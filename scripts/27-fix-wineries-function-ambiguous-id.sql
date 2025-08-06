-- Re-create with qualified columns
CREATE OR REPLACE FUNCTION public.admin_get_wineries_with_stats()
RETURNS TABLE (
    id          bigint,
    name        text,
    join_code   text,
    user_count  bigint,
    created_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- owner check
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE public.users.id = auth.uid()
          AND public.users.role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Access denied: Owner privileges required';
    END IF;

    RETURN QUERY
    SELECT
        w.id               AS id,
        w.name             AS name,
        w.join_code        AS join_code,
        COUNT(u.id)        AS user_count,
        w.created_at       AS created_at
    FROM public.wineries AS w
    LEFT JOIN public.users AS u ON u.winery_id = w.id
    GROUP BY w.id, w.name, w.join_code, w.created_at
    ORDER BY w.created_at DESC;
END;
$$;