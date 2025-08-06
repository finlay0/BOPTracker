-- Allow authenticated owners to execute admin RPCs
GRANT EXECUTE ON FUNCTION public.admin_get_wineries_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_users_with_winery() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_support_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_winery(text) TO authenticated;
