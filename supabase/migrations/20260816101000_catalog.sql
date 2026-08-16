-- Catalog: vehicle types, services, prices

CREATE TABLE public.vehicle_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  reference_price bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.service_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  vehicle_type_id uuid NOT NULL REFERENCES public.vehicle_types (id) ON DELETE CASCADE,
  price bigint NOT NULL,
  UNIQUE (service_id, vehicle_type_id)
);

CREATE INDEX vehicle_types_org_idx ON public.vehicle_types (organization_id, sort_order);
CREATE INDEX services_org_idx ON public.services (organization_id, name);
CREATE INDEX service_prices_org_idx ON public.service_prices (organization_id);

CREATE TRIGGER set_org_vehicle_types
  BEFORE INSERT ON public.vehicle_types
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_services
  BEFORE INSERT ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_service_prices
  BEFORE INSERT ON public.service_prices
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER touch_services
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicle_types_all ON public.vehicle_types
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY services_all ON public.services
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY service_prices_all ON public.service_prices
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

INSERT INTO public.vehicle_types (organization_id, name, slug, sort_order)
SELECT id, v.name, v.slug, v.sort_order
FROM public.organizations
CROSS JOIN (
  VALUES
    ('Moto', 'moto', 1),
    ('Berline', 'berline', 2),
    ('SUV / 4x4', 'suv', 3),
    ('Pickup', 'pickup', 4),
    ('Minibus', 'minibus', 5),
    ('Camion', 'camion', 6),
    ('Autre', 'autre', 7)
) AS v(name, slug, sort_order);

INSERT INTO public.services (organization_id, name, description, reference_price)
SELECT id, s.name, s.description, s.price
FROM public.organizations
CROSS JOIN (
  VALUES
    ('Lavage extérieur', 'Carrosserie et jantes', 50000),
    ('Lavage intérieur', 'Habitacle et tapis', 30000),
    ('Lavage complet', 'Extérieur + intérieur', 70000),
    ('Nettoyage moteur', 'Dégraissage du compartiment moteur', 40000),
    ('Lavage premium', 'Complet + finitions', 120000)
) AS s(name, description, price);

INSERT INTO public.service_prices (organization_id, service_id, vehicle_type_id, price)
SELECT s.organization_id, s.id, vt.id,
  CASE
    WHEN vt.slug = 'moto' THEN (s.reference_price * 40 / 100)
    WHEN vt.slug = 'berline' THEN s.reference_price
    WHEN vt.slug = 'suv' THEN (s.reference_price * 130 / 100)
    WHEN vt.slug = 'pickup' THEN (s.reference_price * 145 / 100)
    WHEN vt.slug = 'minibus' THEN (s.reference_price * 170 / 100)
    WHEN vt.slug = 'camion' THEN (s.reference_price * 200 / 100)
    ELSE s.reference_price
  END
FROM public.services s
JOIN public.vehicle_types vt ON vt.organization_id = s.organization_id;
