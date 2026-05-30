
-- Security events log
CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('captcha_fail','otp_fail','signup_attempt','login_fail','blocked')),
  user_id uuid,
  email text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read security events"
ON public.security_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users read own security events"
ON public.security_events FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_security_events_user_created ON public.security_events (user_id, created_at DESC);
CREATE INDEX idx_security_events_ip_created ON public.security_events (ip_address, created_at DESC);
CREATE INDEX idx_security_events_email_created ON public.security_events (email, created_at DESC);
CREATE INDEX idx_security_events_type_created ON public.security_events (event_type, created_at DESC);

-- Block fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_until timestamptz,
  ADD COLUMN IF NOT EXISTS block_reason text;

-- Helper: is account blocked?
CREATE OR REPLACE FUNCTION public.is_account_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND blocked_until IS NOT NULL
      AND blocked_until > now()
  );
$$;

-- Security definer fn: record event + auto-block on thresholds
CREATE OR REPLACE FUNCTION public.record_security_event(
  _event_type text,
  _user_id uuid,
  _email text,
  _ip text,
  _user_agent text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_recent_fails int;
  v_recent_ip_signups int;
  v_blocked boolean := false;
  v_reason text;
  v_block_minutes int := 60;
BEGIN
  INSERT INTO public.security_events (event_type, user_id, email, ip_address, user_agent, metadata)
  VALUES (_event_type, _user_id, lower(_email), _ip, _user_agent, COALESCE(_metadata,'{}'::jsonb));

  -- Rule 1: 5+ CAPTCHA/OTP failures in 15 min by user or email or ip
  IF _event_type IN ('captcha_fail','otp_fail','login_fail') THEN
    SELECT count(*) INTO v_recent_fails
    FROM public.security_events
    WHERE event_type IN ('captcha_fail','otp_fail','login_fail')
      AND created_at > now() - interval '15 minutes'
      AND (
        (_user_id IS NOT NULL AND user_id = _user_id)
        OR (_email IS NOT NULL AND email = lower(_email))
        OR (_ip IS NOT NULL AND ip_address = _ip)
      );

    IF v_recent_fails >= 5 THEN
      v_blocked := true;
      v_reason := format('Auto-block: %s failed verification attempts in 15 minutes', v_recent_fails);
    END IF;
  END IF;

  -- Rule 2: 3+ signup attempts from same IP in 1 hour
  IF _event_type = 'signup_attempt' AND _ip IS NOT NULL THEN
    SELECT count(*) INTO v_recent_ip_signups
    FROM public.security_events
    WHERE event_type = 'signup_attempt'
      AND ip_address = _ip
      AND created_at > now() - interval '1 hour';

    IF v_recent_ip_signups >= 3 THEN
      v_blocked := true;
      v_reason := format('Auto-block: %s signup attempts from same IP in 1 hour', v_recent_ip_signups);
      v_block_minutes := 120;
    END IF;
  END IF;

  -- Apply block
  IF v_blocked AND _user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET blocked_until = now() + (v_block_minutes || ' minutes')::interval,
        block_reason = v_reason
    WHERE id = _user_id;

    INSERT INTO public.security_events (event_type, user_id, email, ip_address, metadata)
    VALUES ('blocked', _user_id, lower(_email), _ip,
      jsonb_build_object('reason', v_reason, 'minutes', v_block_minutes));
  END IF;

  RETURN jsonb_build_object(
    'blocked', v_blocked,
    'reason', v_reason,
    'recent_fails', v_recent_fails,
    'recent_ip_signups', v_recent_ip_signups
  );
END $$;

REVOKE ALL ON FUNCTION public.record_security_event(text, uuid, text, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.record_security_event(text, uuid, text, text, text, jsonb) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_account_blocked(uuid) TO authenticated, anon, service_role;
