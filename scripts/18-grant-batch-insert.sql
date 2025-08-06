-- scripts/18-grant-batch-insert.sql
-- Allow authenticated users to insert into their own winery’s batches
GRANT INSERT (winery_id, bop_number, customer_name, kit_name, kit_weeks,
              date_of_sale, date_put_up, date_rack, date_filter, date_bottle,
              status, current_stage, customer_email, notes)
ON TABLE public.batches
TO authenticated;