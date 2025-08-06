-- scripts/28-fix-admin-create-winery-ambiguous-id.sql
CREATE OR REPLACE FUNCTION public.admin_create_winery(
    name_param text
)
RETURNS TABLE (
    id         bigint,
    name       text,
    join_code  text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_winery_id bigint;
BEGIN
    -- owner check
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE public.users.id = auth.uid()
          AND public.users.role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Access denied: Owner privileges required';
    END IF;

    INSERT INTO public.wineries (name)
    VALUES (name_param)
    RETURNING public.wineries.id INTO new_winery_id;

    RETURN QUERY
    SELECT
        w.id        AS id,          -- fully-qualified & aliased
        w.name      AS name,
        w.join_code AS join_code,
        w.created_at
    FROM public.wineries AS w
    WHERE w.id = new_winery_id;
END;
$$;