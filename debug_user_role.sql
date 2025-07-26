-- Debug script to check user role and data
-- Run this to see what's in your users table

-- 1. Check your user record
SELECT 
    u.id,
    u.role,
    u.winery_id,
    w.name as winery_name,
    u.created_at,
    au.email
FROM public.users u
LEFT JOIN public.wineries w ON w.id = u.winery_id
LEFT JOIN auth.users au ON au.id = u.id
WHERE au.id = auth.uid();

-- 2. Check if the role check query works
SELECT 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'owner'
    ) as has_owner_role;

-- 3. Check all your user data (if you want to see everything)
-- SELECT * FROM public.users WHERE id = auth.uid();

-- 4. Check what auth.uid() returns
SELECT auth.uid() as current_user_id; 