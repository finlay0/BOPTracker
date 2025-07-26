-- Test the admin RPC function with your specific user
-- Replace 'YOUR_USER_ID_HERE' with your actual user UUID

-- First, let's see your user data
SELECT 
    u.id,
    u.role,
    u.winery_id,
    w.name as winery_name,
    au.email
FROM public.users u
LEFT JOIN public.wineries w ON w.id = u.winery_id
LEFT JOIN auth.users au ON au.id = u.id
WHERE au.email = 'finlaybarrett8770@gmail.com';

-- Test if the role check works for your specific user
-- Replace the UUID below with your actual user ID from the query above
SELECT 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = 'YOUR_USER_ID_HERE' AND users.role = 'owner'
    ) as has_owner_role;

-- If you want to test the RPC function directly (this won't work in dashboard, needs app context)
-- SELECT * FROM admin_get_wineries_with_stats(); 