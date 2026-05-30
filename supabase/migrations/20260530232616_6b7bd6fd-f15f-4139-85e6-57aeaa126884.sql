
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_at timestamptz;

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
  v_email text := NULLIF(lower(_email), '');
  v_ip text := NULLIF(_ip, '');
  v_ua text := NULLIF(_user_agent, '');
BEGIN
  INSERT INTO public.security_events (event_type, user_id, email, ip_address, user_agent, metadata)
  VALUES (_event_type, _user_id, v_email, v_ip, v_ua, COALESCE(_metadata,'{}'::jsonb));

  IF _event_type IN ('captcha_fail','otp_fail','login_fail') THEN
    SELECT count(*) INTO v_recent_fails
    FROM public.security_events
    WHERE event_type IN ('captcha_fail','otp_fail','login_fail')
      AND created_at > now() - interval '15 minutes'
      AND (
        (_user_id IS NOT NULL AND user_id = _user_id)
        OR (v_email IS NOT NULL AND email = v_email)
        OR (v_ip IS NOT NULL AND ip_address = v_ip)
      );
    IF v_recent_fails >= 5 THEN
      v_blocked := true;
      v_reason := format('%s failed verification attempts in the last 15 minutes', v_recent_fails);
    END IF;
  END IF;

  IF _event_type = 'signup_attempt' AND v_ip IS NOT NULL THEN
    SELECT count(*) INTO v_recent_ip_signups
    FROM public.security_events
    WHERE event_type = 'signup_attempt'
      AND ip_address = v_ip
      AND created_at > now() - interval '1 hour';
    IF v_recent_ip_signups >= 3 THEN
      v_blocked := true;
      v_reason := format('%s signup attempts from the same IP in the last hour', v_recent_ip_signups);
      v_block_minutes := 120;
    END IF;
  END IF;

  IF v_blocked AND _user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET blocked_at = now(),
        blocked_until = now() + (v_block_minutes || ' minutes')::interval,
        block_reason = v_reason
    WHERE id = _user_id;

    INSERT INTO public.security_events (event_type, user_id, email, ip_address, metadata)
    VALUES ('blocked', _user_id, v_email, v_ip,
      jsonb_build_object('reason', v_reason, 'minutes', v_block_minutes));
  END IF;

  RETURN jsonb_build_object(
    'blocked', v_blocked,
    'reason', v_reason,
    'recent_fails', v_recent_fails,
    'recent_ip_signups', v_recent_ip_signups
  );
END $$;
