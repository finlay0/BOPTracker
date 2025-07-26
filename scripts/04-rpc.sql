-- REMOTE PROCEDURE CALLS (RPC) FOR BOP TRACKER

-- Function to get winery ID by join code (used during user registration)
CREATE OR REPLACE FUNCTION public.get_winery_id_by_join_code(join_code_param text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    winery_uuid uuid;
BEGIN
    SELECT id INTO winery_uuid
    FROM public.wineries
    WHERE join_code = join_code_param;
    
    IF winery_uuid IS NULL THEN
        RAISE EXCEPTION 'Invalid join code';
    END IF;
    
    RETURN winery_uuid;
END;
$$;

-- Function to get next BOP number for a winery
CREATE OR REPLACE FUNCTION public.get_next_bop_number(winery_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_bop_number integer;
BEGIN
    -- Check if user belongs to the winery
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND winery_id = winery_id_param
    ) THEN
        RAISE EXCEPTION 'Access denied: User does not belong to this winery';
    END IF;
    
    -- Increment and get next BOP number
    UPDATE public.bop_sequences 
    SET last_bop_number = last_bop_number + 1
    WHERE winery_id = winery_id_param
    RETURNING last_bop_number INTO next_bop_number;
    
    -- If no sequence exists, create one
    IF next_bop_number IS NULL THEN
        INSERT INTO public.bop_sequences (winery_id, last_bop_number)
        VALUES (winery_id_param, 1)
        RETURNING last_bop_number INTO next_bop_number;
    END IF;
    
    RETURN next_bop_number;
END;
$$;

-- Admin function to list all wineries
CREATE OR REPLACE FUNCTION public.admin_list_all_wineries()
RETURNS TABLE (
    id uuid,
    name text,
    join_code text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin/owner
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role IN ('admin', 'owner')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    RETURN QUERY
    SELECT w.id, w.name, w.join_code, w.created_at, w.updated_at
    FROM public.wineries w
    ORDER BY w.created_at DESC;
END;
$$;

-- Admin function to list all users
CREATE OR REPLACE FUNCTION public.admin_list_all_users()
RETURNS TABLE (
    id uuid,
    email text,
    winery_id uuid,
    winery_name text,
    role text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin/owner
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role IN ('admin', 'owner')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
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

-- Admin function to list all support messages
CREATE OR REPLACE FUNCTION public.admin_list_all_support_messages()
RETURNS TABLE (
    id uuid,
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
    -- Check if user is admin/owner
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role IN ('admin', 'owner')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
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

-- Admin function to resolve support message
CREATE OR REPLACE FUNCTION public.admin_resolve_support_message(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin/owner
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role IN ('admin', 'owner')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    UPDATE public.support_messages
    SET status = 'resolved', updated_at = NOW()
    WHERE id = message_id;
END;
$$;
