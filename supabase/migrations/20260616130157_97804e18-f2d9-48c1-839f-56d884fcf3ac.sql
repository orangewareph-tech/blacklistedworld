
-- 1. Restrict profile SELECT to owner/admin
DROP POLICY IF EXISTS "profiles public read basic" ON public.profiles;
CREATE POLICY "users read own profile or admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 2. Prevent privilege escalation via self-update of moderation fields
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.blocked_until IS DISTINCT FROM OLD.blocked_until
     OR NEW.blocked_at IS DISTINCT FROM OLD.blocked_at
     OR NEW.block_reason IS DISTINCT FROM OLD.block_reason
     OR NEW.email_verified_at IS DISTINCT FROM OLD.email_verified_at
     OR NEW.phone_verified_at IS DISTINCT FROM OLD.phone_verified_at
  THEN
    RAISE EXCEPTION 'Not allowed to modify moderation fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_priv_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_priv_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 3. Remove broad avatars listing policy (public URL still works)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- 4. Revoke EXECUTE on internal security-definer functions from client roles
REVOKE EXECUTE ON FUNCTION public.record_security_event(text, uuid, text, text, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_account_blocked(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_ticket_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_ticket_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM anon, authenticated;
-- has_role and log_admin_action remain executable by authenticated (used by app + policies)
