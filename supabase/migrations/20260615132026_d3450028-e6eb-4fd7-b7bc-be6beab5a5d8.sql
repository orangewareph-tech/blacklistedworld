
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX admin_audit_log_target_idx  ON public.admin_audit_log (target_type, target_id);

CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action text,
  _target_type text DEFAULT NULL,
  _target_id uuid DEFAULT NULL,
  _summary text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: not an admin';
  END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, summary, metadata)
  VALUES (auth.uid(), _action, _target_type, _target_id, _summary, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, text, jsonb) TO authenticated;

-- Helper for bootstrapping the first admin by email (run manually once):
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'you@example.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
