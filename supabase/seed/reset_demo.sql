-- Remove demo-tagged operational data, keep catalog and organization.

DELETE FROM public.wash_employees
WHERE wash_id IN (SELECT id FROM public.washes WHERE note = 'demo');

DELETE FROM public.wash_services
WHERE wash_id IN (SELECT id FROM public.washes WHERE note = 'demo');

DELETE FROM public.washes WHERE note = 'demo';

DELETE FROM public.expenses
WHERE description LIKE 'demo%'
   OR salary_payment_id IN (SELECT id FROM public.salary_payments WHERE comment LIKE 'demo%');

DELETE FROM public.salary_payments WHERE comment LIKE 'demo%';

DELETE FROM public.recurring_expenses WHERE description = 'Loyer du local';

DELETE FROM public.vehicles WHERE plate IN ('AB-1234-GN', 'CD-5678-GN', 'EF-9012-GN', 'GH-3456-GN');

DELETE FROM public.customers WHERE phone IN ('622111111', '622222222', '622333333', '622444444');

DELETE FROM public.employees WHERE notes = 'demo';

DELETE FROM public.cash_sessions
WHERE NOT EXISTS (
  SELECT 1 FROM public.washes w
  WHERE w.organization_id = cash_sessions.organization_id
    AND w.business_date = cash_sessions.business_date
);

DELETE FROM public.financial_goals
WHERE revenue_target = 10000000 AND washes_target = 250;
