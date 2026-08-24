-- Allow the audit trigger to record organization updates for the signed-in admin.
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_org_id());
