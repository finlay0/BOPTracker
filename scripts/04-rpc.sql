-- 1. SECURE RPC FOR JOINING A WINERY
-- Allows a user to look up a winery by its join code to get its ID.
-- SECURITY DEFINER allows this function to bypass RLS to find the winery.
CREATE OR REPLACE FUNCTION public.get_winery_id_by_join_code(p_join_code text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_winery_id bigint;
BEGIN
  SELECT id INTO v_winery_id FROM public.wineries WHERE join_code = p_join_code;
  RETURN v_winery_id;
END;
$$;
COMMENT ON FUNCTION public.get_winery_id_by_join_code(text) IS 'Securely retrieves a winery ID from a join code.';


-- 2. ADMIN RPC FUNCTIONS
-- These functions are intended for an admin panel and should be called by a service role.
-- They bypass RLS to perform administrative tasks.

-- Function to list all wineries
CREATE OR REPLACE FUNCTION admin_list_all_wineries()
RETURNS SETOF public.wineries
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.wineries ORDER BY created_at DESC;
$$;

-- Function to list all users
CREATE OR REPLACE FUNCTION admin_list_all_users()
RETURNS TABLE(id uuid, role text, winery_id bigint, email text)
LANGUAGE sql
SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT u.id, u.role, u.winery_id, a.email
  FROM public.users u
  JOIN auth.users a ON u.id = a.id
  ORDER BY u.created_at DESC;
$$;

-- Function to list all support messages
CREATE OR REPLACE FUNCTION admin_list_all_support_messages()
RETURNS SETOF public.support_messages
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.support_messages ORDER BY created_at DESC;
$$;

-- Function to resolve a support message
CREATE OR REPLACE FUNCTION admin_resolve_support_message(p_message_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.support_messages
  SET status = 'resolved'
  WHERE id = p_message_id;
END;
$$;
