-- Customers, vehicles, washes

CREATE TYPE public.payment_method AS ENUM ('cash', 'mobile_money');
CREATE TYPE public.record_status AS ENUM ('active', 'cancelled');
CREATE TYPE public.discount_reason AS ENUM (
  'commercial_discount',
  'regular_customer',
  'goodwill',
  'error',
  'other'
);

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  plate text NOT NULL,
  vehicle_type_id uuid REFERENCES public.vehicle_types (id) ON DELETE SET NULL,
  brand text,
  model text,
  customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, plate)
);

CREATE TABLE public.washes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  business_date date NOT NULL,
  vehicle_type_id uuid REFERENCES public.vehicle_types (id) ON DELETE SET NULL,
  plate text,
  customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles (id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  payment_method public.payment_method NOT NULL,
  theoretical_amount bigint NOT NULL DEFAULT 0,
  final_amount bigint NOT NULL DEFAULT 0,
  discount_amount bigint GENERATED ALWAYS AS (theoretical_amount - final_amount) STORED,
  discount_reason public.discount_reason,
  discount_note text,
  status public.record_status NOT NULL DEFAULT 'active',
  cancel_reason text,
  note text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT washes_discount_reason_required CHECK (
    theoretical_amount = final_amount OR discount_reason IS NOT NULL
  ),
  CONSTRAINT washes_cancel_reason_required CHECK (
    status = 'active' OR cancel_reason IS NOT NULL
  )
);

CREATE TABLE public.wash_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  wash_id uuid NOT NULL REFERENCES public.washes (id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services (id) ON DELETE SET NULL,
  name text NOT NULL,
  price bigint NOT NULL
);

CREATE TABLE public.wash_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  wash_id uuid NOT NULL REFERENCES public.washes (id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees (id) ON DELETE RESTRICT,
  UNIQUE (wash_id, employee_id)
);

CREATE INDEX customers_org_phone_idx ON public.customers (organization_id, phone);
CREATE INDEX customers_org_name_idx ON public.customers (organization_id, name);
CREATE INDEX vehicles_org_plate_idx ON public.vehicles (organization_id, plate);
CREATE INDEX washes_org_date_idx ON public.washes (organization_id, business_date DESC);
CREATE INDEX washes_org_plate_idx ON public.washes (organization_id, plate);
CREATE INDEX washes_org_status_date_idx ON public.washes (organization_id, status, business_date);
CREATE INDEX wash_services_wash_idx ON public.wash_services (wash_id);
CREATE INDEX wash_employees_employee_idx ON public.wash_employees (employee_id);
CREATE INDEX wash_employees_wash_idx ON public.wash_employees (wash_id);

CREATE TRIGGER set_org_customers
  BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_vehicles
  BEFORE INSERT ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_washes
  BEFORE INSERT ON public.washes
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_wash_services
  BEFORE INSERT ON public.wash_services
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_wash_employees
  BEFORE INSERT ON public.wash_employees
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER touch_customers
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER touch_washes
  BEFORE UPDATE ON public.washes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER audit_washes
  AFTER INSERT OR UPDATE OR DELETE ON public.washes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wash_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wash_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_all ON public.customers
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY vehicles_all ON public.vehicles
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY washes_all ON public.washes
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY wash_services_all ON public.wash_services
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY wash_employees_all ON public.wash_employees
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());
