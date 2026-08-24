-- Login role: admin | responsable (distinct from employee_roles.slug)
-- Assign after creating the Auth user:
--   UPDATE public.profiles SET role = 'responsable' WHERE id = '<auth user uuid>';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'responsable'));

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin', false)
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Le rôle ne peut pas être modifié depuis l''application';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_change ON public.profiles;
CREATE TRIGGER prevent_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

CREATE OR REPLACE FUNCTION public.generate_recurring_occurrences()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  due date;
  inserted int := 0;
  month_label text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  FOR rec IN
    SELECT *
    FROM public.recurring_expenses
    WHERE organization_id = public.current_org_id()
      AND status = 'active'
  LOOP
    due := rec.next_due_date;
    WHILE due <= CURRENT_DATE LOOP
      month_label := to_char(due, 'TMMonth YYYY');
      INSERT INTO public.recurring_expense_occurrences (
        organization_id, recurring_expense_id, due_date, label, status
      )
      VALUES (
        rec.organization_id,
        rec.id,
        due,
        rec.description || ' — ' || month_label || ' à confirmer',
        'pending'
      )
      ON CONFLICT (recurring_expense_id, due_date) DO NOTHING;

      IF FOUND THEN
        inserted := inserted + 1;
      END IF;

      due := public.advance_due_date(due, rec.frequency);
    END LOOP;

    UPDATE public.recurring_expenses
    SET next_due_date = due
    WHERE id = rec.id;
  END LOOP;

  RETURN inserted;
END;
$$;

-- Organizations: read for staff, update admin only
DROP POLICY IF EXISTS organizations_select ON public.organizations;
DROP POLICY IF EXISTS organizations_update ON public.organizations;

CREATE POLICY organizations_select ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.current_org_id());

CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = public.current_org_id() AND public.is_admin())
  WITH CHECK (id = public.current_org_id() AND public.is_admin());

-- Profiles: org read; self-update (role locked by trigger)
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Audit: admin only
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;

CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin());

-- Catalog: read for staff, write admin only
DROP POLICY IF EXISTS vehicle_types_all ON public.vehicle_types;
DROP POLICY IF EXISTS services_all ON public.services;
DROP POLICY IF EXISTS service_prices_all ON public.service_prices;

CREATE POLICY vehicle_types_select ON public.vehicle_types
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

CREATE POLICY vehicle_types_write ON public.vehicle_types
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY services_select ON public.services
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

CREATE POLICY services_write ON public.services
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY service_prices_select ON public.service_prices
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

CREATE POLICY service_prices_write ON public.service_prices
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

-- Employees: read for staff (wash form), write admin only
DROP POLICY IF EXISTS employee_roles_all ON public.employee_roles;
DROP POLICY IF EXISTS employees_all ON public.employees;

CREATE POLICY employee_roles_select ON public.employee_roles
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

CREATE POLICY employee_roles_write ON public.employee_roles
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY employees_select ON public.employees
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

CREATE POLICY employees_write ON public.employees
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

-- Customers / vehicles: staff can insert/update for wash intake; delete admin only
DROP POLICY IF EXISTS customers_all ON public.customers;
DROP POLICY IF EXISTS vehicles_all ON public.vehicles;

CREATE POLICY customers_select ON public.customers
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

CREATE POLICY customers_insert ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY customers_update ON public.customers
  FOR UPDATE TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY customers_delete ON public.customers
  FOR DELETE TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY vehicles_select ON public.vehicles
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

CREATE POLICY vehicles_insert ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY vehicles_update ON public.vehicles
  FOR UPDATE TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY vehicles_delete ON public.vehicles
  FOR DELETE TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin());

-- Washes: full CRUD for admin and responsable
DROP POLICY IF EXISTS washes_all ON public.washes;
DROP POLICY IF EXISTS wash_services_all ON public.wash_services;
DROP POLICY IF EXISTS wash_employees_all ON public.wash_employees;

CREATE POLICY washes_access ON public.washes
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY wash_services_access ON public.wash_services
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY wash_employees_access ON public.wash_employees
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

-- Finance: admin only
DROP POLICY IF EXISTS expense_categories_all ON public.expense_categories;
DROP POLICY IF EXISTS recurring_expenses_all ON public.recurring_expenses;
DROP POLICY IF EXISTS recurring_occurrences_all ON public.recurring_expense_occurrences;
DROP POLICY IF EXISTS salary_payments_all ON public.salary_payments;
DROP POLICY IF EXISTS expenses_all ON public.expenses;
DROP POLICY IF EXISTS financial_goals_all ON public.financial_goals;
DROP POLICY IF EXISTS attachments_all ON public.attachments;

CREATE POLICY expense_categories_admin ON public.expense_categories
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY recurring_expenses_admin ON public.recurring_expenses
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY recurring_occurrences_admin ON public.recurring_expense_occurrences
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY salary_payments_admin ON public.salary_payments
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY expenses_admin ON public.expenses
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY financial_goals_admin ON public.financial_goals
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

CREATE POLICY attachments_admin ON public.attachments
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id() AND public.is_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.is_admin());

-- Storage writes: admin only; private receipts readable by admin only
DROP POLICY IF EXISTS employee_photos_insert ON storage.objects;
DROP POLICY IF EXISTS employee_photos_update ON storage.objects;
DROP POLICY IF EXISTS employee_photos_delete ON storage.objects;
DROP POLICY IF EXISTS logos_insert ON storage.objects;
DROP POLICY IF EXISTS logos_update ON storage.objects;
DROP POLICY IF EXISTS receipts_select ON storage.objects;
DROP POLICY IF EXISTS receipts_insert ON storage.objects;
DROP POLICY IF EXISTS receipts_delete ON storage.objects;

CREATE POLICY employee_photos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'employee-photos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
    AND public.is_admin()
  );

CREATE POLICY employee_photos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
    AND public.is_admin()
  );

CREATE POLICY employee_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
    AND public.is_admin()
  );

CREATE POLICY logos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'organization-logos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
    AND public.is_admin()
  );

CREATE POLICY logos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'organization-logos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
    AND public.is_admin()
  );

CREATE POLICY receipts_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
    AND public.is_admin()
  );

CREATE POLICY receipts_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
    AND public.is_admin()
  );

CREATE POLICY receipts_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
    AND public.is_admin()
  );
