-- ADMIN PANEL FUNCTIONS (FIXED)
-- This migration fixes ambiguous id references in admin panel functions

-- 1. CREATE FUNCTION TO GENERATE UNIQUE JOIN CODES (unchanged)
CREATE OR REPLACE FUNCTION public.generate_unique_join_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_code text;
    code_exists boolean;
BEGIN
    LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        IF new_code ~ '[0-9]' AND new_code ~ '[A-Z]' THEN
            SELECT EXISTS(SELECT 1 FROM public.wineries WHERE join_code = new_code) INTO code_exists;
            IF NOT code_exists THEN
                RETURN new_code;
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- 2. CREATE TRIGGER TO AUTO-GENERATE JOIN CODES FOR NEW WINERIES (unchanged)
CREATE OR REPLACE FUNCTION public.set_winery_join_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.join_code IS NULL OR NEW.join_code = '' THEN
        NEW.join_code := generate_unique_join_code();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_winery_join_code ON public.wineries;
CREATE TRIGGER trigger_set_winery_join_code
    BEFORE INSERT ON public.wineries
    FOR EACH ROW
    EXECUTE FUNCTION public.set_winery_join_code();

-- 3. ADMIN RPC FUNCTIONS FOR COMPREHENSIVE DATA RETRIEVAL (FIXED)

-- Get all wineries with user counts for admin panel
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
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
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

-- Get all users with winery info for admin panel
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
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
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

-- Get all support messages with user and winery info for admin panel
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
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
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

-- 4. ADMIN WINERY CREATION FUNCTION (FIXED)
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
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    INSERT INTO public.wineries (name, location)
    VALUES (name_param, location_param)
    RETURNING id INTO new_winery_id;
    RETURN QUERY
    SELECT w.id, w.name, w.location, w.join_code, w.created_at
    FROM public.wineries w
    WHERE w.id = new_winery_id;
END;
$$;

-- 5. ADD COMMENTS (unchanged)
COMMENT ON FUNCTION public.generate_unique_join_code IS 'Generates unique 6-character alphanumeric join codes for wineries';
COMMENT ON FUNCTION public.set_winery_join_code IS 'Trigger function to auto-generate join codes for new wineries';
COMMENT ON FUNCTION public.admin_get_wineries_with_stats IS 'Admin function to get all wineries with user counts';
COMMENT ON FUNCTION public.admin_get_users_with_winery IS 'Admin function to get all users with winery information';
COMMENT ON FUNCTION public.admin_get_support_messages IS 'Admin function to get all support messages with user/winery info';
COMMENT ON FUNCTION public.admin_create_winery IS 'Admin function to create new wineries with auto-generated join codes'; 