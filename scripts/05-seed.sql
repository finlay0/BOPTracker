-- Seed the first winery for the application.
-- Run this script in your Supabase SQL Editor.
-- After running, copy the "join_code" that is returned. You will need it to sign up.

INSERT INTO public.wineries (name)
VALUES ('Vercel Vineyards')
RETURNING id, name, join_code;
