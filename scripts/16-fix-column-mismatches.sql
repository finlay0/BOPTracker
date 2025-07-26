-- Fix column mismatches in admin RPC functions
-- The functions were referencing columns that don't exist in the actual schema

-- Drop functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.admin_get_wineries_with_stats();
DROP FUNCTION IF EXISTS public.admin_get_users_with_winery();
DROP FUNCTION IF EXISTS public.admin_create_winery(text, text);
DROP FUNCTION IF EXISTS public.admin_create_winery(text);

-- Fix admin_get_wineries_with_stats function - remove non-existent location column
CREATE OR REPLACE FUNCTION public.admin_get_wineries_with_stats()
RETURNS TABLE (
    id bigint,
    name text,
    join_code text,
    user_count bigint,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify admin access (owner only)
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Access denied: Owner privileges required';
    END IF;
    
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.join_code,
        COUNT(u.id) as user_count,
        w.created_at
    FROM public.wineries w
    LEFT JOIN public.users u ON u.winery_id = w.id
    GROUP BY w.id, w.name, w.join_code, w.created_at
    ORDER BY w.created_at DESC;
END;
$$;

-- Fix admin_get_users_with_winery function - remove non-existent columns
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
    -- Verify admin access (owner only)
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Access denied: Owner privileges required';
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id,
        au.email,
        u.role,
        u.winery_id,
        w.name as winery_name,
        u.created_at
    FROM public.users u
    JOIN auth.users au ON au.id = u.id
    LEFT JOIN public.wineries w ON w.id = u.winery_id
    ORDER BY u.created_at DESC;
END;
$$;

-- Fix admin_create_winery function - remove non-existent location parameter and column
CREATE OR REPLACE FUNCTION public.admin_create_winery(
    name_param text
)
RETURNS TABLE (
    id bigint,
    name text,
    join_code text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_winery_id bigint;
BEGIN
    -- Verify admin access (owner only)
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Access denied: Owner privileges required';
    END IF;
    
    -- Insert new winery (trigger will auto-generate join_code)
    INSERT INTO public.wineries (name)
    VALUES (name_param)
    RETURNING id INTO new_winery_id;
    
    -- Return the created winery
    RETURN QUERY
    SELECT w.id, w.name, w.join_code, w.created_at
    FROM public.wineries w
    WHERE w.id = new_winery_id;
END;
$$; 