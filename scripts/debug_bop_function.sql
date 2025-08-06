-- Debug script to test BOP number generation
-- Run this in Supabase SQL editor while logged in as your user

-- 1. Check if the function exists
SELECT routine_name, routine_type, data_type 
FROM information_schema.routines 
WHERE routine_name = 'get_next_bop_number';

-- 2. Check your user's winery_id
SELECT 
    u.id as user_id,
    u.winery_id,
    u.role,
    w.name as winery_name
FROM public.users u
LEFT JOIN public.wineries w ON w.id = u.winery_id
WHERE u.id = auth.uid();

-- 3. Check if bop_sequences table has data for your winery
SELECT * FROM public.bop_sequences;

-- 4. Try to call the function manually (this will fail if there are issues)
-- Replace WINERY_ID_HERE with your actual winery_id from query #2
-- SELECT public.get_next_bop_number(WINERY_ID_HERE);