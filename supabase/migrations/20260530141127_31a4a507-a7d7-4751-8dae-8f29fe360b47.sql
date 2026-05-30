
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  country TEXT,
  bio TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles public read basic" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "admins update any profile" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Reports
CREATE TYPE public.report_status AS ENUM ('pending', 'approved', 'rejected', 'resolved');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high');

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_name TEXT NOT NULL,
  alias TEXT,
  country TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  social TEXT,
  passport_partial TEXT,
  national_id_partial TEXT,
  bank_partial TEXT,
  wallet TEXT,
  transaction_type TEXT NOT NULL,
  industry TEXT,
  category TEXT NOT NULL,
  amount_usd NUMERIC(14,2),
  incident_date DATE,
  reference_no TEXT,
  court_case_no TEXT,
  police_report_no TEXT,
  description TEXT NOT NULL,
  risk risk_level NOT NULL DEFAULT 'medium',
  status report_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reports_status_created_idx ON public.reports (status, created_at DESC);
CREATE INDEX reports_subject_idx ON public.reports USING gin (to_tsvector('simple', coalesce(subject_name,'') || ' ' || coalesce(alias,'') || ' ' || coalesce(email,'') || ' ' || coalesce(wallet,'') || ' ' || coalesce(website,'')));

GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT SELECT ON public.reports TO anon;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads approved/resolved" ON public.reports FOR SELECT TO anon, authenticated
  USING (status IN ('approved','resolved') OR submitter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "auth users create reports" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (submitter_id = auth.uid() AND status = 'pending');
CREATE POLICY "submitter edits own pending" ON public.reports FOR UPDATE TO authenticated
  USING (submitter_id = auth.uid() AND status = 'pending')
  WITH CHECK (submitter_id = auth.uid() AND status = 'pending');
CREATE POLICY "admins manage reports" ON public.reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Evidence
CREATE TABLE public.report_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.report_evidence TO authenticated;
GRANT SELECT ON public.report_evidence TO anon;
GRANT ALL ON public.report_evidence TO service_role;
ALTER TABLE public.report_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence visible with report" ON public.report_evidence FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND (
    r.status IN ('approved','resolved') OR r.submitter_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  )));
CREATE POLICY "uploader inserts evidence" ON public.report_evidence FOR INSERT TO authenticated
  WITH CHECK (uploader_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.submitter_id = auth.uid()
  ));
CREATE POLICY "admins manage evidence" ON public.report_evidence FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Flags
CREATE TABLE public.report_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  flagger_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_id, flagger_id)
);
GRANT SELECT, INSERT ON public.report_flags TO authenticated;
GRANT ALL ON public.report_flags TO service_role;
ALTER TABLE public.report_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own flags or admins all" ON public.report_flags FOR SELECT TO authenticated
  USING (flagger_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "auth users flag reports" ON public.report_flags FOR INSERT TO authenticated
  WITH CHECK (flagger_id = auth.uid());
CREATE POLICY "admins manage flags" ON public.report_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER reports_touch BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth upload own evidence" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "owner read own evidence" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidence' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "admins manage evidence storage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'evidence' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'evidence' AND public.has_role(auth.uid(), 'admin'));
