-- Employees and roles

CREATE TABLE public.employee_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  UNIQUE (organization_id, slug)
);

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  role_id uuid REFERENCES public.employee_roles (id) ON DELETE SET NULL,
  monthly_salary bigint NOT NULL DEFAULT 0,
  hired_at date,
  is_active boolean NOT NULL DEFAULT true,
  address text,
  notes text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX employees_org_idx ON public.employees (organization_id, is_active, last_name);

CREATE TRIGGER set_org_employee_roles
  BEFORE INSERT ON public.employee_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_employees
  BEFORE INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER touch_employees
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

ALTER TABLE public.employee_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_roles_all ON public.employee_roles
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY employees_all ON public.employees
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

INSERT INTO public.employee_roles (organization_id, name, slug)
SELECT id, r.name, r.slug
FROM public.organizations
CROSS JOIN (
  VALUES
    ('Laveur', 'laveur'),
    ('Responsable lavage', 'responsable_lavage'),
    ('Caissier', 'caissier'),
    ('Gardien', 'gardien'),
    ('Responsable', 'responsable'),
    ('Autre', 'autre')
) AS r(name, slug);
