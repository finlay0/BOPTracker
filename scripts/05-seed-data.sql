-- SEED DATA FOR BOP TRACKER
-- This script seeds initial data for testing and development

-- 1. INSERT A TEST WINERY
INSERT INTO public.wineries (name, join_code) 
VALUES ('Test Wine Shop', '111000') 
ON CONFLICT (join_code) DO NOTHING;

-- 2. GET THE WINERY ID (for reference)
-- You can run this to see the winery ID that was created
-- SELECT id, name, join_code FROM public.wineries WHERE join_code = 'SVW123';

-- 3. SET UP USER AS ADMIN/OWNER
-- First, we need to find your user ID from auth.users
-- You can check your user ID with:
-- SELECT id, email FROM auth.users WHERE email = 'finlayabarrett@gmail.com';

-- 4. INSERT/UPDATE USER PROFILE
-- Replace 'YOUR_USER_ID_HERE' with your actual UUID from auth.users
-- This assumes you've already signed up and exist in auth.users
INSERT INTO public.users (id, winery_id, role)
SELECT 
    au.id,
    w.id as winery_id,
    'owner' as role
FROM auth.users au
CROSS JOIN public.wineries w
WHERE au.email = 'finlaybarrett8770@gmail.com'
AND w.join_code = '111000'
ON CONFLICT (id) DO UPDATE SET
    winery_id = EXCLUDED.winery_id,
    role = 'owner';

-- 5. INITIALIZE BOP SEQUENCE FOR THE WINERY
INSERT INTO public.bop_sequences (winery_id, last_bop_number)
SELECT id, 0
FROM public.wineries 
WHERE join_code = '111000'
ON CONFLICT (winery_id) DO NOTHING;

-- 6. OPTIONAL: ADD SOME SAMPLE BATCH DATA
INSERT INTO public.batches (
    winery_id, 
    bop_number, 
    customer_name, 
    kit_name, 
    kit_weeks, 
    date_of_sale, 
    date_put_up,
    date_rack,
    date_filter,
    date_bottle,
    status,
    current_stage
)
SELECT 
    w.id as winery_id,
    1 as bop_number,
    'John Smith' as customer_name,
    'Cabernet Sauvignon' as kit_name,
    6 as kit_weeks,
    CURRENT_DATE - INTERVAL '30 days' as date_of_sale,
    CURRENT_DATE - INTERVAL '25 days' as date_put_up,
    CURRENT_DATE - INTERVAL '11 days' as date_rack,
    NULL as date_filter,
    NULL as date_bottle,
    'pending' as status,
    'racked' as current_stage
FROM public.wineries w
WHERE w.join_code = 'SVW123'
ON CONFLICT (winery_id, bop_number) DO NOTHING;

-- Update BOP sequence after inserting sample data
UPDATE public.bop_sequences 
SET last_bop_number = 1 
WHERE winery_id = (SELECT id FROM public.wineries WHERE join_code = 'SVW123');

-- 7. VERIFICATION QUERIES
-- Run these to verify everything was set up correctly:

-- Check winery was created
-- SELECT * FROM public.wineries WHERE join_code = 'SVW123';

-- Check user profile was created/updated
-- SELECT u.*, w.name as winery_name 
-- FROM public.users u 
-- JOIN public.wineries w ON u.winery_id = w.id 
-- WHERE u.id = (SELECT id FROM auth.users WHERE email = 'finlayabarrett@gmail.com');

-- Check sample batch was created
-- SELECT * FROM public.batches WHERE winery_id = (SELECT id FROM public.wineries WHERE join_code = 'SVW123'); 