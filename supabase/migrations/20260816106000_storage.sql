-- Storage buckets and policies

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('employee-photos', 'employee-photos', true),
  ('expense-receipts', 'expense-receipts', false),
  ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY employee_photos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'employee-photos');

CREATE POLICY employee_photos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'employee-photos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
  );

CREATE POLICY employee_photos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
  );

CREATE POLICY employee_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
  );

CREATE POLICY logos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'organization-logos');

CREATE POLICY logos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'organization-logos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
  );

CREATE POLICY logos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'organization-logos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
  );

CREATE POLICY receipts_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
  );

CREATE POLICY receipts_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
  );

CREATE POLICY receipts_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
  );
