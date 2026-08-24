-- Demo seed for Guinea. Idempotent: tagged via notes/description prefixes.

DO $$
DECLARE
  org uuid;
  role_laveur uuid;
  role_resp uuid;
  emp1 uuid; emp2 uuid; emp3 uuid; emp4 uuid;
  vt_berline uuid; vt_suv uuid; vt_pickup uuid; vt_moto uuid;
  svc_full uuid;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid;
  v1 uuid; v2 uuid; v3 uuid; v4 uuid;
  cat_soap uuid; cat_water uuid; cat_rent uuid; cat_power uuid;
  d date;
  i int;
BEGIN
  -- idempotent: drop previous demo rows first
  DELETE FROM public.wash_employees WHERE wash_id IN (SELECT id FROM public.washes WHERE note = 'demo');
  DELETE FROM public.wash_services WHERE wash_id IN (SELECT id FROM public.washes WHERE note = 'demo');
  DELETE FROM public.washes WHERE note = 'demo';
  DELETE FROM public.expenses
  WHERE description LIKE 'demo%'
     OR salary_payment_id IN (SELECT id FROM public.salary_payments WHERE comment LIKE 'demo%');
  DELETE FROM public.salary_payments WHERE comment LIKE 'demo%';
  DELETE FROM public.recurring_expenses WHERE description = 'Loyer du local';
  DELETE FROM public.vehicles WHERE plate IN ('AB-1234-GN', 'CD-5678-GN', 'EF-9012-GN', 'GH-3456-GN');
  DELETE FROM public.customers WHERE phone IN ('622111111', '622222222', '622333333', '622444444');
  DELETE FROM public.employees WHERE notes = 'demo';

  SELECT id INTO org FROM public.organizations ORDER BY created_at LIMIT 1;
  SELECT id INTO role_laveur FROM public.employee_roles WHERE organization_id = org AND slug = 'laveur';
  SELECT id INTO role_resp FROM public.employee_roles WHERE organization_id = org AND slug = 'responsable_lavage';
  SELECT id INTO vt_berline FROM public.vehicle_types WHERE organization_id = org AND slug = 'berline';
  SELECT id INTO vt_suv FROM public.vehicle_types WHERE organization_id = org AND slug = 'suv';
  SELECT id INTO vt_pickup FROM public.vehicle_types WHERE organization_id = org AND slug = 'pickup';
  SELECT id INTO vt_moto FROM public.vehicle_types WHERE organization_id = org AND slug = 'moto';
  SELECT id INTO svc_full FROM public.services WHERE organization_id = org AND name = 'Lavage complet';
  SELECT id INTO cat_soap FROM public.expense_categories WHERE organization_id = org AND name = 'Produits de lavage';
  SELECT id INTO cat_water FROM public.expense_categories WHERE organization_id = org AND name = 'Eau';
  SELECT id INTO cat_rent FROM public.expense_categories WHERE organization_id = org AND name = 'Loyer';
  SELECT id INTO cat_power FROM public.expense_categories WHERE organization_id = org AND name = 'Électricité';

  INSERT INTO public.employees (organization_id, first_name, last_name, phone, role_id, monthly_salary, hired_at, notes, is_active)
  VALUES
    (org, 'Mamadou', 'Diallo', '620111111', role_laveur, 1500000, '2024-01-10', 'demo', true),
    (org, 'Alpha', 'Camara', '620222222', role_laveur, 1400000, '2024-03-02', 'demo', true),
    (org, 'Ibrahima', 'Bah', '620333333', role_resp, 2200000, '2023-11-15', 'demo', true),
    (org, 'Aissatou', 'Sow', '620444444', role_laveur, 1300000, '2025-02-01', 'demo', true);

  SELECT id INTO emp1 FROM public.employees WHERE organization_id = org AND first_name = 'Mamadou' AND last_name = 'Diallo';
  SELECT id INTO emp2 FROM public.employees WHERE organization_id = org AND first_name = 'Alpha' AND last_name = 'Camara';
  SELECT id INTO emp3 FROM public.employees WHERE organization_id = org AND first_name = 'Ibrahima' AND last_name = 'Bah';
  SELECT id INTO emp4 FROM public.employees WHERE organization_id = org AND first_name = 'Aissatou' AND last_name = 'Sow';

  INSERT INTO public.customers (organization_id, name, phone)
  VALUES
    (org, 'Mamadou Diallo', '622111111'),
    (org, 'Alpha Condé', '622222222'),
    (org, 'Ibrahima Camara', '622333333'),
    (org, 'Fatoumata Bah', '622444444');

  SELECT id INTO c1 FROM public.customers WHERE organization_id = org AND phone = '622111111';
  SELECT id INTO c2 FROM public.customers WHERE organization_id = org AND phone = '622222222';
  SELECT id INTO c3 FROM public.customers WHERE organization_id = org AND phone = '622333333';
  SELECT id INTO c4 FROM public.customers WHERE organization_id = org AND phone = '622444444';

  INSERT INTO public.vehicles (organization_id, plate, vehicle_type_id, brand, model, customer_id)
  VALUES
    (org, 'AB-1234-GN', vt_berline, 'Toyota', 'Corolla', c1),
    (org, 'CD-5678-GN', vt_suv, 'Hyundai', 'Tucson', c2),
    (org, 'EF-9012-GN', vt_pickup, 'Ford', 'Ranger', c3),
    (org, 'GH-3456-GN', vt_moto, 'TVS', 'Apache', c4)
  ON CONFLICT (organization_id, plate) DO NOTHING;

  SELECT id INTO v1 FROM public.vehicles WHERE organization_id = org AND plate = 'AB-1234-GN';
  SELECT id INTO v2 FROM public.vehicles WHERE organization_id = org AND plate = 'CD-5678-GN';
  SELECT id INTO v3 FROM public.vehicles WHERE organization_id = org AND plate = 'EF-9012-GN';
  SELECT id INTO v4 FROM public.vehicles WHERE organization_id = org AND plate = 'GH-3456-GN';

  FOR i IN 0..20 LOOP
    d := CURRENT_DATE - i;

    INSERT INTO public.washes (
      organization_id, occurred_at, business_date, vehicle_type_id, plate, customer_id, vehicle_id,
      customer_name, payment_method, theoretical_amount, final_amount, discount_reason, status, note
    )
    VALUES
      (org, d::timestamptz + interval '9 hours', d, vt_berline, 'AB-1234-GN', c1, v1, 'Mamadou Diallo', 'cash', 70000, 70000, NULL, 'active', 'demo'),
      (org, d::timestamptz + interval '11 hours', d, vt_suv, 'CD-5678-GN', c2, v2, 'Alpha Condé', 'mobile_money', 91000, 80000, 'regular_customer', 'active', 'demo'),
      (org, d::timestamptz + interval '15 hours', d, vt_pickup, 'EF-9012-GN', c3, v3, 'Ibrahima Camara', 'cash', 101500, 101500, NULL, 'active', 'demo');

    INSERT INTO public.expenses (organization_id, amount, date, category_id, nature, description, payment_method, status)
    VALUES
      (org, 150000, d, cat_soap, 'VARIABLE', 'demo savon et cire', 'cash', 'active');
  END LOOP;

  INSERT INTO public.wash_services (organization_id, wash_id, service_id, name, price)
  SELECT org, w.id, svc_full, 'Lavage complet', w.theoretical_amount
  FROM public.washes w
  WHERE w.organization_id = org AND w.note = 'demo';

  INSERT INTO public.wash_employees (organization_id, wash_id, employee_id)
  SELECT org, w.id, CASE (row_number() OVER (ORDER BY w.occurred_at)) % 4
    WHEN 0 THEN emp1 WHEN 1 THEN emp2 WHEN 2 THEN emp3 ELSE emp4 END
  FROM public.washes w
  WHERE w.organization_id = org AND w.note = 'demo';

  INSERT INTO public.expenses (organization_id, amount, date, category_id, nature, description, payment_method, status)
  VALUES
    (org, 5000000, date_trunc('month', CURRENT_DATE)::date, cat_rent, 'FIXE', 'demo loyer mensuel', 'cash', 'active'),
    (org, 800000, date_trunc('month', CURRENT_DATE)::date, cat_power, 'FIXE', 'demo électricité', 'mobile_money', 'active'),
    (org, 250000, CURRENT_DATE - 3, cat_water, 'VARIABLE', 'demo citerne d''eau', 'cash', 'active');

  INSERT INTO public.salary_payments (organization_id, employee_id, period_month, expected_amount, paid_amount, paid_at, comment)
  VALUES
    (org, emp1, date_trunc('month', CURRENT_DATE)::date, 1500000, 1500000, CURRENT_DATE - 2, 'demo'),
    (org, emp2, date_trunc('month', CURRENT_DATE)::date, 1400000, 1350000, CURRENT_DATE - 2, 'demo absences');

  INSERT INTO public.financial_goals (organization_id, period_month, revenue_target, washes_target)
  VALUES (org, date_trunc('month', CURRENT_DATE)::date, 10000000, 250)
  ON CONFLICT (organization_id, period_month) DO UPDATE
    SET revenue_target = EXCLUDED.revenue_target, washes_target = EXCLUDED.washes_target;

  INSERT INTO public.recurring_expenses (
    organization_id, category_id, description, amount, nature, payment_method, frequency, start_date, next_due_date, status
  )
  VALUES (org, cat_rent, 'Loyer du local', 5000000, 'FIXE', 'cash', 'monthly', date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + interval '1 month')::date, 'active');
END $$;
