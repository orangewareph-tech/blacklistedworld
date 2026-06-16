
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, text, jsonb) FROM anon;
