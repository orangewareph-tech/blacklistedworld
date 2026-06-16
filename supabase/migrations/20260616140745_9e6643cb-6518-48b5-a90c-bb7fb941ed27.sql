REVOKE EXECUTE ON FUNCTION public.admin_unblock_user(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.revoke_admin_role(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bulk_update_report_status(uuid[], report_status, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_security_event(text, uuid, text, text, text, jsonb) FROM anon, authenticated;