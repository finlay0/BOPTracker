-- Grant execute privilege on task completion RPC functions to authenticated role
GRANT EXECUTE ON FUNCTION public.complete_task(bigint, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.undo_task_completion(bigint, text) TO authenticated;