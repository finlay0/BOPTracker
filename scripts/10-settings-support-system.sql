-- SETTINGS AND SUPPORT SYSTEM
-- This migration adds functionality for the Settings area including support messages

-- 1. CREATE SUPPORT MESSAGES TABLE (if not exists from previous migrations)
-- This table should already exist from 01-schema.sql, but let's ensure it has the right structure
ALTER TABLE public.support_messages 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now() NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- 2. CREATE RPC FUNCTION TO SUBMIT SUPPORT MESSAGES
CREATE OR REPLACE FUNCTION public.submit_support_message(
    subject_param text,
    message_param text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_winery_id bigint;
    message_id uuid;
BEGIN
    -- Get user's winery ID
    SELECT u.winery_id INTO user_winery_id
    FROM public.users u
    WHERE u.id = auth.uid();
    
    IF user_winery_id IS NULL THEN
        RAISE EXCEPTION 'User not associated with a winery';
    END IF;
    
    -- Insert support message
    INSERT INTO public.support_messages (
        user_id,
        winery_id,
        subject,
        message,
        status
    )
    VALUES (
        auth.uid(),
        user_winery_id,
        subject_param,
        message_param,
        'open'
    )
    RETURNING id INTO message_id;
    
    RETURN message_id;
END;
$$;

-- 3. CREATE RPC FUNCTION TO UPDATE USER EMAIL
CREATE OR REPLACE FUNCTION public.update_user_email(
    new_email_param text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Basic email validation
    IF new_email_param !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    -- Update user email in auth.users (this would need to be handled by Supabase Auth)
    -- For now, we'll just update our users table
    UPDATE public.users 
    SET 
        email = new_email_param,
        updated_at = now()
    WHERE id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    RETURN true;
END;
$$;

-- 4. CREATE RPC FUNCTION TO GET USER PROFILE FOR SETTINGS
CREATE OR REPLACE FUNCTION public.get_user_settings_profile()
RETURNS TABLE (
    user_id uuid,
    email text,
    full_name text,
    role text,
    winery_id bigint,
    winery_name text,
    winery_join_code text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        u.full_name,
        u.role,
        u.winery_id,
        w.name as winery_name,
        w.join_code as winery_join_code,
        u.created_at,
        u.updated_at
    FROM public.users u
    LEFT JOIN public.wineries w ON w.id = u.winery_id
    WHERE u.id = auth.uid();
END;
$$;

-- 5. ADD INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS support_messages_user_id_idx ON public.support_messages (user_id);
CREATE INDEX IF NOT EXISTS support_messages_created_at_idx ON public.support_messages (created_at DESC);

-- 6. ADD COMMENTS
COMMENT ON FUNCTION public.submit_support_message IS 'Allows users to submit support messages from Settings';
COMMENT ON FUNCTION public.update_user_email IS 'Updates user email address with validation';
COMMENT ON FUNCTION public.get_user_settings_profile IS 'Returns user profile data for Settings view'; 