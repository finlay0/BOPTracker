-- Adjust admin_get_users_with_winery return types (email text)
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
    IF NOT EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Access denied: Owner privileges required';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        (SELECT email FROM auth.users au WHERE au.id = u.id)::text AS email,
        u.role,
        u.winery_id,
        w.name AS winery_name,
        u.created_at
    FROM public.users u
    LEFT JOIN public.wineries w ON w.id = u.winery_id
    ORDER BY u.created_at DESC;
END;
$$;
