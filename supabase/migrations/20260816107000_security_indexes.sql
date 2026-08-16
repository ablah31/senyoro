-- Revoke RPC access to trigger-only SECURITY DEFINER functions.
REVOKE ALL ON FUNCTION public.audit_trigger_fn() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_salary_expense() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_recurring_occurrences() TO authenticated;

-- Covering indexes for remaining foreign keys.
CREATE INDEX IF NOT EXISTS attachments_organization_id_idx
  ON public.attachments (organization_id);
CREATE INDEX IF NOT EXISTS expenses_recorded_by_idx
  ON public.expenses (recorded_by);
CREATE INDEX IF NOT EXISTS recurring_expenses_category_id_idx
  ON public.recurring_expenses (category_id);
CREATE INDEX IF NOT EXISTS recurring_expenses_organization_id_idx
  ON public.recurring_expenses (organization_id);
CREATE INDEX IF NOT EXISTS service_prices_vehicle_type_id_idx
  ON public.service_prices (vehicle_type_id);
CREATE INDEX IF NOT EXISTS vehicles_vehicle_type_id_idx
  ON public.vehicles (vehicle_type_id);
CREATE INDEX IF NOT EXISTS wash_employees_organization_id_idx
  ON public.wash_employees (organization_id);
CREATE INDEX IF NOT EXISTS wash_services_organization_id_idx
  ON public.wash_services (organization_id);
CREATE INDEX IF NOT EXISTS washes_created_by_idx
  ON public.washes (created_by);
CREATE INDEX IF NOT EXISTS washes_vehicle_type_id_idx
  ON public.washes (vehicle_type_id);
