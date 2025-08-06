-- scripts/19-grant-batches-table-insert.sql
-- Table-level INSERT privilege is required; otherwise PostgREST
-- strips the JSON fields before RLS even runs.
GRANT INSERT ON TABLE public.batches TO authenticated;