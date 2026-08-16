-- Foundations: organizations, profiles, RLS helpers, audit

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  currency text NOT NULL DEFAULT 'GNF',
  country text NOT NULL DEFAULT 'GN',
  timezone text NOT NULL DEFAULT 'Africa/Conakry',
  logo_url text,
  default_opening_cash bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  full_name text,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_organization_id_idx ON public.profiles (organization_id);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_org_created_idx ON public.audit_logs (organization_id, created_at DESC);

INSERT INTO public.organizations (name, phone, country, currency, timezone)
VALUES ('Senyoro', NULL, 'GN', 'GNF', 'Africa/Conakry');

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT id INTO org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;
  INSERT INTO public.profiles (id, organization_id, full_name)
  VALUES (
    NEW.id,
    org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.current_org_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org uuid;
  rec_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    org := COALESCE(OLD.organization_id, public.current_org_id());
    rec_id := OLD.id;
    INSERT INTO public.audit_logs (organization_id, table_name, record_id, action, old_data, new_data, user_id)
    VALUES (org, TG_TABLE_NAME, rec_id, 'DELETE', to_jsonb(OLD), NULL, auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    org := COALESCE(NEW.organization_id, OLD.organization_id, public.current_org_id());
    rec_id := NEW.id;
    INSERT INTO public.audit_logs (organization_id, table_name, record_id, action, old_data, new_data, user_id)
    VALUES (org, TG_TABLE_NAME, rec_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSE
    org := COALESCE(NEW.organization_id, public.current_org_id());
    rec_id := NEW.id;
    INSERT INTO public.audit_logs (organization_id, table_name, record_id, action, old_data, new_data, user_id)
    VALUES (org, TG_TABLE_NAME, rec_id, 'INSERT', NULL, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
END;
$$;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_select ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.current_org_id());

CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = public.current_org_id())
  WITH CHECK (id = public.current_org_id());

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

CREATE TRIGGER audit_organizations
  AFTER UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
