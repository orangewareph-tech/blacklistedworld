
-- 1. profiles additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- 2. ticket number infra
CREATE SEQUENCE IF NOT EXISTS public.ticket_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'BL-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.ticket_seq')::text, 6, '0');
$$;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS ticket_number text UNIQUE;

CREATE OR REPLACE FUNCTION public.assign_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS reports_assign_ticket ON public.reports;
CREATE TRIGGER reports_assign_ticket
  BEFORE INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.assign_ticket_number();

-- backfill ticket numbers for existing rows
UPDATE public.reports
  SET ticket_number = public.generate_ticket_number()
  WHERE ticket_number IS NULL;

-- 3. pre_assessments table
CREATE TABLE IF NOT EXISTS public.pre_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id uuid NOT NULL,
  ticket_number text UNIQUE,
  subject_name text NOT NULL,
  alias text,
  country text,
  city text,
  phone text,
  email text,
  website text,
  social text,
  transaction_type text NOT NULL,
  industry text,
  amount_usd numeric,
  description text NOT NULL,
  status public.report_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pre_assessments TO authenticated;
GRANT ALL ON public.pre_assessments TO service_role;

ALTER TABLE public.pre_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage pre_assessments"
  ON public.pre_assessments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "users create own pre_assessment"
  ON public.pre_assessments FOR INSERT TO authenticated
  WITH CHECK (submitter_id = auth.uid() AND status = 'pending'::public.report_status);

CREATE POLICY "users view own pre_assessment"
  ON public.pre_assessments FOR SELECT TO authenticated
  USING (submitter_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "users update own pending pre_assessment"
  ON public.pre_assessments FOR UPDATE TO authenticated
  USING (submitter_id = auth.uid() AND status = 'pending'::public.report_status)
  WITH CHECK (submitter_id = auth.uid() AND status = 'pending'::public.report_status);

DROP TRIGGER IF EXISTS pre_assessments_assign_ticket ON public.pre_assessments;
CREATE TRIGGER pre_assessments_assign_ticket
  BEFORE INSERT ON public.pre_assessments
  FOR EACH ROW EXECUTE FUNCTION public.assign_ticket_number();

DROP TRIGGER IF EXISTS pre_assessments_touch_updated_at ON public.pre_assessments;
CREATE TRIGGER pre_assessments_touch_updated_at
  BEFORE UPDATE ON public.pre_assessments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. handle_new_user reads username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_username text;
BEGIN
  v_username := NULLIF(lower(NEW.raw_user_meta_data->>'username'), '');
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    v_username
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END $function$;

-- ensure trigger on auth.users exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
