-- Resolve ambiguous id reference in admin_get_users_with_winery
CREATE OR REPLACE FUNCTION public.admin_get_users_with_winery()
RETURNS TABLE (
    id uuid,
    email text,
    role text,
    winery_id bigint,
    winery_name text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure caller is owner
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE public.users.id = auth.uid() AND public.users.role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Access denied: Owner privileges required';
    END IF;

    RETURN QUERY
    SELECT 
        u.id                         AS id,
        au.email::text              AS email,
        u.role                      AS role,
        u.winery_id                 AS winery_id,
        w.name                      AS winery_name,
        u.created_at                AS created_at
    FROM public.users       AS u
    LEFT JOIN public.wineries w  ON w.id = u.winery_id
    LEFT JOIN auth.users     au  ON au.id = u.id
    ORDER BY u.created_at DESC;
END;
$$;