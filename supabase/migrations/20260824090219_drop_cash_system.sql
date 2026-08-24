DROP FUNCTION IF EXISTS public.cash_day_summary(date);
DROP TABLE IF EXISTS public.cash_sessions CASCADE;

ALTER TABLE public.organizations
  DROP COLUMN IF EXISTS cash_enabled,
  DROP COLUMN IF EXISTS default_opening_cash;
