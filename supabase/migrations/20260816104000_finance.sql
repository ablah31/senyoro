-- Finance: expenses, recurring, salaries, cash, goals, attachments

CREATE TYPE public.expense_nature AS ENUM ('FIXE', 'VARIABLE');
CREATE TYPE public.salary_status AS ENUM ('to_pay', 'partial', 'paid');
CREATE TYPE public.recurrence_frequency AS ENUM ('weekly', 'monthly', 'yearly');
CREATE TYPE public.occurrence_status AS ENUM ('pending', 'confirmed', 'skipped');
CREATE TYPE public.recurring_status AS ENUM ('active', 'paused');

CREATE TABLE public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  default_nature public.expense_nature NOT NULL DEFAULT 'VARIABLE',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE public.recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.expense_categories (id) ON DELETE RESTRICT,
  description text NOT NULL,
  amount bigint NOT NULL,
  nature public.expense_nature NOT NULL DEFAULT 'FIXE',
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  frequency public.recurrence_frequency NOT NULL DEFAULT 'monthly',
  start_date date NOT NULL,
  next_due_date date NOT NULL,
  status public.recurring_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.recurring_expense_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  recurring_expense_id uuid NOT NULL REFERENCES public.recurring_expenses (id) ON DELETE CASCADE,
  due_date date NOT NULL,
  label text NOT NULL,
  status public.occurrence_status NOT NULL DEFAULT 'pending',
  expense_id uuid,
  UNIQUE (recurring_expense_id, due_date)
);

CREATE TABLE public.salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees (id) ON DELETE RESTRICT,
  period_month date NOT NULL,
  expected_amount bigint NOT NULL,
  paid_amount bigint NOT NULL DEFAULT 0,
  paid_at date,
  status public.salary_status NOT NULL DEFAULT 'to_pay',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period_month)
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  date date NOT NULL,
  category_id uuid NOT NULL REFERENCES public.expense_categories (id) ON DELETE RESTRICT,
  nature public.expense_nature NOT NULL,
  description text NOT NULL,
  supplier text,
  payment_method public.payment_method NOT NULL,
  recorded_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  recurring_occurrence_id uuid REFERENCES public.recurring_expense_occurrences (id) ON DELETE SET NULL,
  salary_payment_id uuid REFERENCES public.salary_payments (id) ON DELETE SET NULL,
  status public.record_status NOT NULL DEFAULT 'active',
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_expense_occurrences
  ADD CONSTRAINT recurring_expense_occurrences_expense_id_fkey
  FOREIGN KEY (expense_id) REFERENCES public.expenses (id) ON DELETE SET NULL;

CREATE TABLE public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  business_date date NOT NULL,
  opening_cash bigint NOT NULL DEFAULT 0,
  opening_mobile_money bigint NOT NULL DEFAULT 0,
  counted_cash bigint,
  counted_mobile_money bigint,
  closed_at timestamptz,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, business_date)
);

CREATE TABLE public.financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  period_month date NOT NULL,
  revenue_target bigint NOT NULL DEFAULT 0,
  washes_target int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, period_month)
);

CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  expense_id uuid REFERENCES public.expenses (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX expenses_org_date_idx ON public.expenses (organization_id, date DESC);
CREATE INDEX expenses_org_status_date_idx ON public.expenses (organization_id, status, date);
CREATE INDEX expenses_category_idx ON public.expenses (category_id);
CREATE INDEX salary_payments_org_period_idx ON public.salary_payments (organization_id, period_month DESC);
CREATE INDEX cash_sessions_org_date_idx ON public.cash_sessions (organization_id, business_date DESC);
CREATE INDEX recurring_occurrences_status_idx ON public.recurring_expense_occurrences (organization_id, status, due_date);

CREATE TRIGGER set_org_expense_categories
  BEFORE INSERT ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_recurring_expenses
  BEFORE INSERT ON public.recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_recurring_occurrences
  BEFORE INSERT ON public.recurring_expense_occurrences
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_salary_payments
  BEFORE INSERT ON public.salary_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_expenses
  BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_cash_sessions
  BEFORE INSERT ON public.cash_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_financial_goals
  BEFORE INSERT ON public.financial_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_attachments
  BEFORE INSERT ON public.attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER touch_expenses
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER touch_salary_payments
  BEFORE UPDATE ON public.salary_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_salary_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.salary_payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_cash_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.cash_sessions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expense_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY expense_categories_all ON public.expense_categories
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY recurring_expenses_all ON public.recurring_expenses
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY recurring_occurrences_all ON public.recurring_expense_occurrences
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY salary_payments_all ON public.salary_payments
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY expenses_all ON public.expenses
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY cash_sessions_all ON public.cash_sessions
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY financial_goals_all ON public.financial_goals
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY attachments_all ON public.attachments
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

INSERT INTO public.expense_categories (organization_id, name, default_nature, is_system)
SELECT id, c.name, c.nature::public.expense_nature, c.is_system
FROM public.organizations
CROSS JOIN (
  VALUES
    ('Produits de lavage', 'VARIABLE', false),
    ('Eau', 'VARIABLE', false),
    ('Électricité', 'FIXE', false),
    ('Loyer', 'FIXE', false),
    ('Salaires', 'FIXE', true),
    ('Matériel', 'VARIABLE', false),
    ('Entretien', 'VARIABLE', false),
    ('Réparation', 'VARIABLE', false),
    ('Transport', 'VARIABLE', false),
    ('Marketing', 'VARIABLE', false),
    ('Taxes', 'FIXE', false),
    ('Autre', 'VARIABLE', false)
) AS c(name, nature, is_system);

CREATE OR REPLACE FUNCTION public.set_salary_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.paid_amount > NEW.expected_amount THEN
    RAISE EXCEPTION 'Le montant versé ne peut pas dépasser le salaire prévu';
  END IF;
  IF NEW.paid_amount <= 0 THEN
    NEW.status := 'to_pay';
  ELSIF NEW.paid_amount < NEW.expected_amount THEN
    NEW.status := 'partial';
  ELSE
    NEW.status := 'paid';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_salary_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cat_id uuid;
  exp_id uuid;
BEGIN
  SELECT id INTO cat_id
  FROM public.expense_categories
  WHERE organization_id = NEW.organization_id AND name = 'Salaires'
  LIMIT 1;

  SELECT id INTO exp_id
  FROM public.expenses
  WHERE salary_payment_id = NEW.id
  LIMIT 1;

  IF NEW.paid_amount > 0 AND cat_id IS NOT NULL THEN
    IF exp_id IS NULL THEN
      INSERT INTO public.expenses (
        organization_id, amount, date, category_id, nature, description,
        payment_method, salary_payment_id, status, recorded_by
      ) VALUES (
        NEW.organization_id,
        NEW.paid_amount,
        COALESCE(NEW.paid_at, CURRENT_DATE),
        cat_id,
        'FIXE',
        'Salaire ' || to_char(NEW.period_month, 'TMMonth YYYY'),
        'cash',
        NEW.id,
        'active',
        auth.uid()
      );
    ELSE
      UPDATE public.expenses
      SET amount = NEW.paid_amount,
          date = COALESCE(NEW.paid_at, date),
          status = 'active',
          cancel_reason = NULL
      WHERE id = exp_id;
    END IF;
  ELSIF exp_id IS NOT NULL THEN
    UPDATE public.expenses
    SET status = 'cancelled',
        cancel_reason = 'Paiement de salaire annulé'
    WHERE id = exp_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER salary_payments_set_status
  BEFORE INSERT OR UPDATE OF paid_amount, expected_amount
  ON public.salary_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_salary_status();

CREATE TRIGGER salary_payments_sync_expense
  AFTER INSERT OR UPDATE OF paid_amount, paid_at, expected_amount
  ON public.salary_payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_salary_expense();
