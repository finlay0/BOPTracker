-- Fix admin role checks to use 'owner' instead of 'admin'
-- The database schema only allows 'member' and 'owner' roles, not 'admin'
-- Also fix return type mismatches by dropping functions first

-- Drop existing functions that have return type mismatches
DROP FUNCTION IF EXISTS public.admin_list_all_wineries();
DROP FUNCTION IF EXISTS public.admin_list_all_users();
DROP FUNCTION IF EXISTS public.admin_list_all_support_messages();
DROP FUNCTION IF EXISTS public.admin_resolve_support_message(uuid);
DROP FUNCTION IF EXISTS public.admin_resolve_support_message(bigint);

-- Fix admin_get_wineries_with_stats function
CREATE OR REPLACE FUNCTION public.admin_get_wineries_with_stats()
RETURNS TABLE (
    id bigint,
    name text,
    location text,
    join_code text,
    user_count bigint,
    created_at timestamptz,
    updated_at timestamptz
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
        w.location,
        w.join_code,
        COUNT(u.id) as user_count,
        w.created_at,
        w.updated_at
    FROM public.wineries w
    LEFT JOIN public.users u ON u.winery_id = w.id
    GROUP BY w.id, w.name, w.location, w.join_code, w.created_at, w.updated_at
    ORDER BY w.created_at DESC;
END;
$$;

-- Fix admin_get_users_with_winery function
CREATE OR REPLACE FUNCTION public.admin_get_users_with_winery()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    role text,
    winery_id bigint,
    winery_name text,
    created_at timestamptz,
    updated_at timestamptz
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
        u.email,
        u.full_name,
        u.role,
        u.winery_id,
        w.name as winery_name,
        u.created_at,
        u.updated_at
    FROM public.users u
    LEFT JOIN public.wineries w ON w.id = u.winery_id
    ORDER BY u.created_at DESC;
END;
$$;

-- Fix admin_get_support_messages function
CREATE OR REPLACE FUNCTION public.admin_get_support_messages()
RETURNS TABLE (
    id bigint,
    subject text,
    message text,
    status text,
    user_id uuid,
    user_email text,
    user_name text,
    winery_id bigint,
    winery_name text,
    created_at timestamptz,
    updated_at timestamptz
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
        sm.id,
        sm.subject,
        sm.message,
        sm.status,
        sm.user_id,
        u.email as user_email,
        u.full_name as user_name,
        sm.winery_id,
        w.name as winery_name,
        sm.created_at,
        sm.updated_at
    FROM public.support_messages sm
    LEFT JOIN public.users u ON u.id = sm.user_id
    LEFT JOIN public.wineries w ON w.id = sm.winery_id
    ORDER BY sm.created_at DESC;
END;
$$;

-- Fix admin_create_winery function
CREATE OR REPLACE FUNCTION public.admin_create_winery(
    name_param text,
    location_param text
)
RETURNS TABLE (
    id bigint,
    name text,
    location text,
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
    INSERT INTO public.wineries (name, location)
    VALUES (name_param, location_param)
    RETURNING id INTO new_winery_id;
    
    -- Return the created winery
    RETURN QUERY
    SELECT w.id, w.name, w.location, w.join_code, w.created_at
    FROM public.wineries w
    WHERE w.id = new_winery_id;
END;
$$;

-- Recreate admin_list_all_wineries with correct data types
CREATE FUNCTION public.admin_list_all_wineries()
RETURNS TABLE (
    id bigint,
    name text,
    join_code text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is owner
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Access denied: Owner privileges required';
    END IF;
    
    RETURN QUERY
    SELECT w.id, w.name, w.join_code, w.created_at, w.updated_at
    FROM public.wineries w
    ORDER BY w.created_at DESC;
END;
$$;

-- Recreate admin_list_all_users with correct data types
CREATE FUNCTION public.admin_list_all_users()
RETURNS TABLE (
    id uuid,
    email text,
    winery_id bigint,
    winery_name text,
    role text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is owner
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
        u.winery_id,
        w.name as winery_name,
        u.role,
        u.created_at,
        u.updated_at
    FROM public.users u
    JOIN auth.users au ON u.id = au.id
    LEFT JOIN public.wineries w ON u.winery_id = w.id
    ORDER BY u.created_at DESC;
END;
$$;

-- Recreate admin_list_all_support_messages with correct data types  
CREATE FUNCTION public.admin_list_all_support_messages()
RETURNS TABLE (
    id bigint,
    user_id uuid,
    user_email text,
    winery_name text,
    subject text,
    message text,
    status text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is owner
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Access denied: Owner privileges required';
    END IF;
    
    RETURN QUERY
    SELECT 
        sm.id,
        sm.user_id,
        au.email as user_email,
        w.name as winery_name,
        sm.subject,
        sm.message,
        sm.status,
        sm.created_at,
        sm.updated_at
    FROM public.support_messages sm
    JOIN public.users u ON sm.user_id = u.id
    JOIN auth.users au ON u.id = au.id
    LEFT JOIN public.wineries w ON u.winery_id = w.id
    ORDER BY sm.created_at DESC;
END;
$$;

-- Recreate admin_resolve_support_message with correct parameter type
CREATE FUNCTION public.admin_resolve_support_message(message_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is owner
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Access denied: Owner privileges required';
    END IF;
    
    UPDATE public.support_messages
    SET status = 'resolved', updated_at = NOW()
    WHERE id = message_id;
END;
$$; 