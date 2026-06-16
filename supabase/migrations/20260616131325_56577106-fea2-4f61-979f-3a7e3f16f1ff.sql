
-- moderation_templates: canned reasons admins can pick from
CREATE TABLE IF NOT EXISTS public.moderation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  body text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('approve','reject','note')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.moderation_templates TO authenticated;
GRANT ALL ON public.moderation_templates TO service_role;
ALTER TABLE public.moderation_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read templates" ON public.moderation_templates
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage templates" ON public.moderation_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.moderation_templates (label, body, kind) VALUES
  ('Approved — verified evidence', 'Report approved after reviewing supplied evidence.', 'approve'),
  ('Rejected — insufficient evidence', 'Report rejected. Please re-submit with documentary evidence (screenshots, transaction IDs, official correspondence).', 'reject'),
  ('Rejected — duplicate', 'A report for this entity already exists. This duplicate has been rejected.', 'reject'),
  ('Rejected — out of scope', 'This report falls outside our scope (consumer disputes, refunds, personal complaints).', 'reject')
ON CONFLICT DO NOTHING;

-- admin_notifications: in-app bell feed
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  target_type text,
  target_id uuid,
  read_by uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read notifications" ON public.admin_notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins mark notifications read" ON public.admin_notifications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto-generate notifications when a pending high-risk report is created or flagged
CREATE OR REPLACE FUNCTION public.notify_new_pending_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.admin_notifications (kind, title, body, target_type, target_id)
    VALUES ('pending_report',
      'New pending report: ' || NEW.subject_name,
      'Risk: ' || NEW.risk || ' • ' || COALESCE(NEW.category,''),
      'report', NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS reports_notify_new ON public.reports;
CREATE TRIGGER reports_notify_new AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_pending_report();

CREATE OR REPLACE FUNCTION public.notify_new_flag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_notifications (kind, title, body, target_type, target_id)
  VALUES ('flag', 'New flag raised', NEW.reason, 'report', NEW.report_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS flags_notify_new ON public.report_flags;
CREATE TRIGGER flags_notify_new AFTER INSERT ON public.report_flags
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_flag();

REVOKE EXECUTE ON FUNCTION public.notify_new_pending_report() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_flag() FROM PUBLIC, anon, authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Bulk update report status with audit
CREATE OR REPLACE FUNCTION public.bulk_update_report_status(_ids uuid[], _status report_status, _note text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.reports
    SET status = _status,
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        admin_notes = COALESCE(_note, admin_notes)
    WHERE id = ANY(_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  PERFORM public.log_admin_action(
    'bulk_status_change', 'report', NULL,
    format('%s reports → %s', v_count, _status),
    jsonb_build_object('ids', _ids, 'status', _status, 'note', _note)
  );
  RETURN v_count;
END $$;
REVOKE EXECUTE ON FUNCTION public.bulk_update_report_status(uuid[], report_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bulk_update_report_status(uuid[], report_status, text) TO authenticated;

-- Unblock user with audit
CREATE OR REPLACE FUNCTION public.admin_unblock_user(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.profiles SET blocked_until = NULL, block_reason = NULL, blocked_at = NULL WHERE id = _user_id;
  PERFORM public.log_admin_action('unblock_user','profile',_user_id,'Unblocked user', '{}'::jsonb);
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_unblock_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_unblock_user(uuid) TO authenticated;

-- Grant / revoke admin (super_admin only)
CREATE OR REPLACE FUNCTION public.grant_admin_role(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Forbidden: super admin only'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id,'admin') ON CONFLICT DO NOTHING;
  PERFORM public.log_admin_action('grant_admin','user',_user_id,'Granted admin role','{}'::jsonb);
END $$;
CREATE OR REPLACE FUNCTION public.revoke_admin_role(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Forbidden: super admin only'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  PERFORM public.log_admin_action('revoke_admin','user',_user_id,'Revoked admin role','{}'::jsonb);
END $$;
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_admin_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_role(uuid) TO authenticated;

-- Reporter summary view (admin only via security_invoker + base table policies)
CREATE OR REPLACE VIEW public.v_reporter_summary
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.display_name,
  p.username,
  p.country,
  p.is_verified,
  p.blocked_until,
  p.blocked_at,
  p.block_reason,
  p.phone,
  p.created_at,
  COALESCE(rc.total,0)::int   AS reports_total,
  COALESCE(rc.approved,0)::int AS reports_approved,
  COALESCE(rc.pending,0)::int  AS reports_pending,
  COALESCE(rc.rejected,0)::int AS reports_rejected
FROM public.profiles p
LEFT JOIN (
  SELECT submitter_id,
    count(*) AS total,
    count(*) FILTER (WHERE status='approved') AS approved,
    count(*) FILTER (WHERE status='pending')  AS pending,
    count(*) FILTER (WHERE status='rejected') AS rejected
  FROM public.reports
  WHERE submitter_id IS NOT NULL
  GROUP BY submitter_id
) rc ON rc.submitter_id = p.id;
GRANT SELECT ON public.v_reporter_summary TO authenticated;

-- Weekly stats view
CREATE OR REPLACE VIEW public.v_admin_weekly_stats
WITH (security_invoker = true) AS
SELECT
  date_trunc('week', created_at)::date AS week,
  count(*)::int AS submitted,
  count(*) FILTER (WHERE status='approved')::int AS approved,
  count(*) FILTER (WHERE status='rejected')::int AS rejected,
  count(*) FILTER (WHERE risk='high')::int AS high_risk
FROM public.reports
GROUP BY 1
ORDER BY 1;
GRANT SELECT ON public.v_admin_weekly_stats TO authenticated;
