-- Optional cash register: organizations can hide the daily cash workflow
-- until they decide to use it. Payments (cash / Mobile Money) stay on washes.

ALTER TABLE public.organizations
  ADD COLUMN cash_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.organizations.cash_enabled IS
  'When false, hide cash register UI and skip opening daily cash sessions.';
