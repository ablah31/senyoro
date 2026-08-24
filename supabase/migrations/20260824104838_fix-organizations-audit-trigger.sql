-- organizations uses id, not organization_id. Accessing NEW.organization_id
-- raised "record new has no fields organization_id" on name/logo updates.

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org uuid;
  rec_id uuid;
  new_row jsonb;
  old_row jsonb;
BEGIN
  IF TG_OP <> 'DELETE' THEN
    new_row := to_jsonb(NEW);
  END IF;
  IF TG_OP <> 'INSERT' THEN
    old_row := to_jsonb(OLD);
  END IF;

  rec_id := COALESCE((new_row->>'id')::uuid, (old_row->>'id')::uuid);

  IF TG_TABLE_NAME = 'organizations' THEN
    org := rec_id;
  ELSE
    org := COALESCE(
      (new_row->>'organization_id')::uuid,
      (old_row->>'organization_id')::uuid,
      public.current_org_id()
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (organization_id, table_name, record_id, action, old_data, new_data, user_id)
    VALUES (org, TG_TABLE_NAME, rec_id, 'DELETE', old_row, NULL, auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (organization_id, table_name, record_id, action, old_data, new_data, user_id)
    VALUES (org, TG_TABLE_NAME, rec_id, 'UPDATE', old_row, new_row, auth.uid());
    RETURN NEW;
  ELSE
    INSERT INTO public.audit_logs (organization_id, table_name, record_id, action, old_data, new_data, user_id)
    VALUES (org, TG_TABLE_NAME, rec_id, 'INSERT', NULL, new_row, auth.uid());
    RETURN NEW;
  END IF;
END;
$$;
