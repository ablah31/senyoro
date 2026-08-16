-- Views, RPCs and recurring occurrence generator

CREATE OR REPLACE FUNCTION public.advance_due_date(p_date date, p_frequency public.recurrence_frequency)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_frequency
    WHEN 'weekly' THEN (p_date + interval '7 days')::date
    WHEN 'yearly' THEN (p_date + interval '1 year')::date
    ELSE (p_date + interval '1 month')::date
  END
$$;

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

CREATE OR REPLACE FUNCTION public.dashboard_kpis(p_from date, p_to date)
RETURNS TABLE (
  revenue bigint,
  expenses bigint,
  profit bigint,
  wash_count bigint,
  avg_ticket bigint,
  cash_collected bigint,
  mobile_collected bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH w AS (
    SELECT
      COALESCE(SUM(final_amount), 0)::bigint AS revenue,
      COUNT(*)::bigint AS wash_count,
      COALESCE(SUM(final_amount) FILTER (WHERE payment_method = 'cash'), 0)::bigint AS cash_collected,
      COALESCE(SUM(final_amount) FILTER (WHERE payment_method = 'mobile_money'), 0)::bigint AS mobile_collected
    FROM public.washes
    WHERE organization_id = public.current_org_id()
      AND status = 'active'
      AND business_date BETWEEN p_from AND p_to
  ),
  e AS (
    SELECT COALESCE(SUM(amount), 0)::bigint AS expenses
    FROM public.expenses
    WHERE organization_id = public.current_org_id()
      AND status = 'active'
      AND date BETWEEN p_from AND p_to
  )
  SELECT
    w.revenue,
    e.expenses,
    (w.revenue - e.expenses)::bigint AS profit,
    w.wash_count,
    CASE WHEN w.wash_count > 0 THEN (w.revenue / w.wash_count)::bigint ELSE 0 END AS avg_ticket,
    w.cash_collected,
    w.mobile_collected
  FROM w, e;
$$;

CREATE OR REPLACE FUNCTION public.metric_timeseries(p_from date, p_to date, p_metric text)
RETURNS TABLE (bucket date, value bigint)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH days AS (
    SELECT generate_series(p_from, p_to, interval '1 day')::date AS bucket
  )
  SELECT
    d.bucket,
    CASE p_metric
      WHEN 'revenue' THEN COALESCE((
        SELECT SUM(w.final_amount)::bigint FROM public.washes w
        WHERE w.organization_id = public.current_org_id()
          AND w.status = 'active' AND w.business_date = d.bucket
      ), 0)
      WHEN 'expenses' THEN COALESCE((
        SELECT SUM(e.amount)::bigint FROM public.expenses e
        WHERE e.organization_id = public.current_org_id()
          AND e.status = 'active' AND e.date = d.bucket
      ), 0)
      WHEN 'washes' THEN COALESCE((
        SELECT COUNT(*)::bigint FROM public.washes w
        WHERE w.organization_id = public.current_org_id()
          AND w.status = 'active' AND w.business_date = d.bucket
      ), 0)
      WHEN 'profit' THEN COALESCE((
        SELECT SUM(w.final_amount)::bigint FROM public.washes w
        WHERE w.organization_id = public.current_org_id()
          AND w.status = 'active' AND w.business_date = d.bucket
      ), 0) - COALESCE((
        SELECT SUM(e.amount)::bigint FROM public.expenses e
        WHERE e.organization_id = public.current_org_id()
          AND e.status = 'active' AND e.date = d.bucket
      ), 0)
      ELSE 0
    END
  FROM days d
  ORDER BY d.bucket;
END;
$$;

CREATE OR REPLACE FUNCTION public.revenue_by_service(p_from date, p_to date)
RETURNS TABLE (name text, value bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT ws.name, COALESCE(SUM(ws.price), 0)::bigint
  FROM public.wash_services ws
  JOIN public.washes w ON w.id = ws.wash_id
  WHERE w.organization_id = public.current_org_id()
    AND w.status = 'active'
    AND w.business_date BETWEEN p_from AND p_to
  GROUP BY ws.name
  ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION public.revenue_by_vehicle_type(p_from date, p_to date)
RETURNS TABLE (name text, value bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(vt.name, 'Non renseigné'), COALESCE(SUM(w.final_amount), 0)::bigint
  FROM public.washes w
  LEFT JOIN public.vehicle_types vt ON vt.id = w.vehicle_type_id
  WHERE w.organization_id = public.current_org_id()
    AND w.status = 'active'
    AND w.business_date BETWEEN p_from AND p_to
  GROUP BY 1
  ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION public.expenses_by_category(p_from date, p_to date)
RETURNS TABLE (name text, value bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT c.name, COALESCE(SUM(e.amount), 0)::bigint
  FROM public.expenses e
  JOIN public.expense_categories c ON c.id = e.category_id
  WHERE e.organization_id = public.current_org_id()
    AND e.status = 'active'
    AND e.date BETWEEN p_from AND p_to
  GROUP BY c.name
  ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION public.payment_split(p_from date, p_to date)
RETURNS TABLE (name text, value bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    CASE payment_method WHEN 'cash' THEN 'Espèces' ELSE 'Mobile Money' END,
    COALESCE(SUM(final_amount), 0)::bigint
  FROM public.washes
  WHERE organization_id = public.current_org_id()
    AND status = 'active'
    AND business_date BETWEEN p_from AND p_to
  GROUP BY payment_method
  ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION public.revenue_by_employee(p_from date, p_to date)
RETURNS TABLE (name text, value bigint, wash_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    trim(emp.first_name || ' ' || emp.last_name),
    COALESCE(SUM(w.final_amount), 0)::bigint,
    COUNT(DISTINCT w.id)::bigint
  FROM public.wash_employees we
  JOIN public.washes w ON w.id = we.wash_id
  JOIN public.employees emp ON emp.id = we.employee_id
  WHERE w.organization_id = public.current_org_id()
    AND w.status = 'active'
    AND w.business_date BETWEEN p_from AND p_to
  GROUP BY emp.id, emp.first_name, emp.last_name
  ORDER BY 3 DESC, 2 DESC;
$$;

CREATE OR REPLACE FUNCTION public.employee_ranking(p_from date, p_to date)
RETURNS TABLE (
  employee_id uuid,
  name text,
  wash_count bigint,
  revenue bigint,
  top_service text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      emp.id,
      trim(emp.first_name || ' ' || emp.last_name) AS name,
      COUNT(DISTINCT w.id)::bigint AS wash_count,
      COALESCE(SUM(w.final_amount), 0)::bigint AS revenue
    FROM public.employees emp
    LEFT JOIN public.wash_employees we ON we.employee_id = emp.id
    LEFT JOIN public.washes w ON w.id = we.wash_id
      AND w.status = 'active'
      AND w.business_date BETWEEN p_from AND p_to
    WHERE emp.organization_id = public.current_org_id()
    GROUP BY emp.id, emp.first_name, emp.last_name
  ),
  top_svc AS (
    SELECT DISTINCT ON (we.employee_id)
      we.employee_id,
      ws.name
    FROM public.wash_employees we
    JOIN public.washes w ON w.id = we.wash_id
    JOIN public.wash_services ws ON ws.wash_id = w.id
    WHERE w.organization_id = public.current_org_id()
      AND w.status = 'active'
      AND w.business_date BETWEEN p_from AND p_to
    GROUP BY we.employee_id, ws.name
    ORDER BY we.employee_id, COUNT(*) DESC
  )
  SELECT b.id, b.name, b.wash_count, b.revenue, ts.name
  FROM base b
  LEFT JOIN top_svc ts ON ts.employee_id = b.id
  ORDER BY b.wash_count DESC, b.revenue DESC;
$$;

CREATE OR REPLACE FUNCTION public.cash_day_summary(p_date date)
RETURNS TABLE (
  session_id uuid,
  opening_cash bigint,
  opening_mobile_money bigint,
  cash_in bigint,
  mobile_in bigint,
  cash_out bigint,
  mobile_out bigint,
  theoretical_cash bigint,
  theoretical_mobile bigint,
  counted_cash bigint,
  counted_mobile_money bigint,
  cash_diff bigint,
  mobile_diff bigint,
  closed_at timestamptz,
  comment text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH sess AS (
    SELECT *
    FROM public.cash_sessions
    WHERE organization_id = public.current_org_id()
      AND business_date = p_date
  ),
  ins AS (
    SELECT
      COALESCE(SUM(final_amount) FILTER (WHERE payment_method = 'cash'), 0)::bigint AS cash_in,
      COALESCE(SUM(final_amount) FILTER (WHERE payment_method = 'mobile_money'), 0)::bigint AS mobile_in
    FROM public.washes
    WHERE organization_id = public.current_org_id()
      AND status = 'active'
      AND business_date = p_date
  ),
  outs AS (
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE payment_method = 'cash'), 0)::bigint AS cash_out,
      COALESCE(SUM(amount) FILTER (WHERE payment_method = 'mobile_money'), 0)::bigint AS mobile_out
    FROM public.expenses
    WHERE organization_id = public.current_org_id()
      AND status = 'active'
      AND date = p_date
  )
  SELECT
    s.id,
    COALESCE(s.opening_cash, 0),
    COALESCE(s.opening_mobile_money, 0),
    i.cash_in,
    i.mobile_in,
    o.cash_out,
    o.mobile_out,
    COALESCE(s.opening_cash, 0) + i.cash_in - o.cash_out,
    COALESCE(s.opening_mobile_money, 0) + i.mobile_in - o.mobile_out,
    s.counted_cash,
    s.counted_mobile_money,
    CASE WHEN s.counted_cash IS NULL THEN NULL
         ELSE s.counted_cash - (COALESCE(s.opening_cash, 0) + i.cash_in - o.cash_out)
    END,
    CASE WHEN s.counted_mobile_money IS NULL THEN NULL
         ELSE s.counted_mobile_money - (COALESCE(s.opening_mobile_money, 0) + i.mobile_in - o.mobile_out)
    END,
    s.closed_at,
    s.comment
  FROM ins i, outs o
  LEFT JOIN sess s ON true;
$$;

CREATE OR REPLACE FUNCTION public.global_search(p_query text)
RETURNS TABLE (
  entity text,
  id uuid,
  title text,
  subtitle text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH q AS (
    SELECT trim(p_query) AS q
  )
  SELECT 'vehicle'::text, v.id, v.plate, COALESCE(c.name, 'Véhicule')
  FROM public.vehicles v
  LEFT JOIN public.customers c ON c.id = v.customer_id
  CROSS JOIN q
  WHERE v.organization_id = public.current_org_id()
    AND v.plate ILIKE '%' || q.q || '%'
  UNION ALL
  SELECT 'customer', cu.id, COALESCE(cu.name, 'Client'), COALESCE(cu.phone, '')
  FROM public.customers cu
  CROSS JOIN q
  WHERE cu.organization_id = public.current_org_id()
    AND (
      cu.name ILIKE '%' || q.q || '%'
      OR cu.phone ILIKE '%' || q.q || '%'
    )
  UNION ALL
  SELECT 'employee', e.id, trim(e.first_name || ' ' || e.last_name), COALESCE(e.phone, '')
  FROM public.employees e
  CROSS JOIN q
  WHERE e.organization_id = public.current_org_id()
    AND (
      e.first_name ILIKE '%' || q.q || '%'
      OR e.last_name ILIKE '%' || q.q || '%'
      OR e.phone ILIKE '%' || q.q || '%'
    )
  UNION ALL
  SELECT 'wash', w.id, COALESCE(w.plate, 'Lavage'), to_char(w.occurred_at AT TIME ZONE 'Africa/Conakry', 'DD/MM/YYYY HH24:MI')
  FROM public.washes w
  CROSS JOIN q
  WHERE w.organization_id = public.current_org_id()
    AND (
      w.plate ILIKE '%' || q.q || '%'
      OR w.customer_name ILIKE '%' || q.q || '%'
      OR w.customer_phone ILIKE '%' || q.q || '%'
      OR w.id::text ILIKE '%' || q.q || '%'
    )
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_recurring_occurrences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_kpis(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.metric_timeseries(date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revenue_by_service(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revenue_by_vehicle_type(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expenses_by_category(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.payment_split(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revenue_by_employee(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.employee_ranking(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cash_day_summary(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_search(text) TO authenticated;
