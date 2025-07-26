-- TASK COMPLETION SYSTEM (COMPATIBLE WITH EXISTING DATA)
-- This creates the task completion system while working with existing current_stage values

-- 1. CREATE TASK COMPLETIONS TABLE
CREATE TABLE IF NOT EXISTS public.task_completions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id bigint NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    winery_id bigint NOT NULL REFERENCES public.wineries(id) ON DELETE CASCADE,
    task_type text NOT NULL CHECK (task_type IN ('put-up', 'rack', 'filter', 'bottle')),
    completed_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    completed_at timestamptz DEFAULT now() NOT NULL,
    due_date date NOT NULL,
    is_overdue boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- Ensure one completion record per batch per task type
    UNIQUE (batch_id, task_type)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS task_completions_batch_id_idx ON public.task_completions (batch_id);
CREATE INDEX IF NOT EXISTS task_completions_winery_id_idx ON public.task_completions (winery_id);
CREATE INDEX IF NOT EXISTS task_completions_due_date_idx ON public.task_completions (due_date);
CREATE INDEX IF NOT EXISTS task_completions_completed_at_idx ON public.task_completions (completed_at);

COMMENT ON TABLE public.task_completions IS 'Tracks completion of individual production tasks with undo capability';

-- 2. CREATE FUNCTION TO NORMALIZE CURRENT_STAGE VALUES
-- This helps us work with both old and new stage values
CREATE OR REPLACE FUNCTION public.normalize_current_stage(stage_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE stage_value
        WHEN 'racked' THEN 'rack'
        WHEN 'filtered' THEN 'filter'
        WHEN 'bottled' THEN 'bottle'
        ELSE stage_value
    END;
END;
$$;

-- 3. CREATE FUNCTION TO UPDATE BATCH CURRENT STAGE
-- Compatible with both old and new stage values
CREATE OR REPLACE FUNCTION public.update_batch_current_stage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    batch_record public.batches%ROWTYPE;
    completed_tasks text[];
    new_stage text;
    new_status text;
BEGIN
    -- Get the batch record
    SELECT * INTO batch_record FROM public.batches WHERE id = NEW.batch_id;
    
    -- Get all completed tasks for this batch
    SELECT array_agg(task_type ORDER BY 
        CASE task_type 
            WHEN 'put-up' THEN 1
            WHEN 'rack' THEN 2 
            WHEN 'filter' THEN 3
            WHEN 'bottle' THEN 4
        END
    ) INTO completed_tasks
    FROM public.task_completions 
    WHERE batch_id = NEW.batch_id;
    
    -- Determine new stage and status based on completed tasks
    IF 'bottle' = ANY(completed_tasks) THEN
        new_stage := 'completed';
        new_status := 'completed';
    ELSIF 'filter' = ANY(completed_tasks) THEN
        new_stage := 'bottle';
        new_status := 'pending';
    ELSIF 'rack' = ANY(completed_tasks) THEN
        new_stage := 'filter';
        new_status := 'pending';
    ELSIF 'put-up' = ANY(completed_tasks) THEN
        new_stage := 'rack';
        new_status := 'pending';
    ELSE
        new_stage := 'put-up';
        new_status := 'pending';
    END IF;
    
    -- Update the batch
    UPDATE public.batches SET 
        current_stage = new_stage,
        status = new_status,
        updated_at = now()
    WHERE id = NEW.batch_id;
    
    RETURN NEW;
END;
$$;

-- 4. CREATE FUNCTION TO HANDLE TASK COMPLETION DELETION (UNDO)
CREATE OR REPLACE FUNCTION public.handle_task_completion_undo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    batch_record public.batches%ROWTYPE;
    remaining_tasks text[];
    new_stage text;
    new_status text;
BEGIN
    -- Get the batch record
    SELECT * INTO batch_record FROM public.batches WHERE id = OLD.batch_id;
    
    -- Get remaining completed tasks for this batch
    SELECT array_agg(task_type ORDER BY 
        CASE task_type 
            WHEN 'put-up' THEN 1
            WHEN 'rack' THEN 2 
            WHEN 'filter' THEN 3
            WHEN 'bottle' THEN 4
        END
    ) INTO remaining_tasks
    FROM public.task_completions 
    WHERE batch_id = OLD.batch_id;
    
    -- Determine new stage based on remaining completed tasks
    IF remaining_tasks IS NULL OR array_length(remaining_tasks, 1) IS NULL THEN
        new_stage := 'put-up';
        new_status := 'pending';
    ELSIF 'filter' = ANY(remaining_tasks) THEN
        new_stage := 'bottle';
        new_status := 'pending';
    ELSIF 'rack' = ANY(remaining_tasks) THEN
        new_stage := 'filter';
        new_status := 'pending';
    ELSIF 'put-up' = ANY(remaining_tasks) THEN
        new_stage := 'rack';
        new_status := 'pending';
    ELSE
        new_stage := 'put-up';
        new_status := 'pending';
    END IF;
    
    -- Update the batch
    UPDATE public.batches SET 
        current_stage = new_stage,
        status = new_status,
        updated_at = now()
    WHERE id = OLD.batch_id;
    
    RETURN OLD;
END;
$$;

-- 5. CREATE TRIGGERS
DROP TRIGGER IF EXISTS trigger_update_batch_stage ON public.task_completions;
CREATE TRIGGER trigger_update_batch_stage
    AFTER INSERT ON public.task_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_batch_current_stage();

DROP TRIGGER IF EXISTS trigger_handle_task_undo ON public.task_completions;
CREATE TRIGGER trigger_handle_task_undo
    AFTER DELETE ON public.task_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_task_completion_undo();

-- 6. CREATE RPC FUNCTIONS FOR TASK COMPLETION
-- Complete a task
CREATE OR REPLACE FUNCTION public.complete_task(
    batch_id_param bigint,
    task_type_param text,
    due_date_param date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_winery_id bigint;
    completion_id uuid;
    is_task_overdue boolean DEFAULT false;
BEGIN
    -- Verify user has access to this batch
    SELECT u.winery_id INTO user_winery_id
    FROM public.users u
    JOIN public.batches b ON b.winery_id = u.winery_id
    WHERE u.id = auth.uid() AND b.id = batch_id_param;
    
    IF user_winery_id IS NULL THEN
        RAISE EXCEPTION 'Access denied: User does not have access to this batch';
    END IF;
    
    -- Check if task is overdue (after midnight of due date)
    IF due_date_param < CURRENT_DATE THEN
        is_task_overdue := true;
    END IF;
    
    -- Insert or update task completion
    INSERT INTO public.task_completions (
        batch_id, 
        winery_id, 
        task_type, 
        completed_by, 
        due_date,
        is_overdue
    )
    VALUES (
        batch_id_param, 
        user_winery_id, 
        task_type_param, 
        auth.uid(), 
        due_date_param,
        is_task_overdue
    )
    ON CONFLICT (batch_id, task_type) 
    DO UPDATE SET
        completed_by = auth.uid(),
        completed_at = now(),
        is_overdue = is_task_overdue
    RETURNING id INTO completion_id;
    
    RETURN completion_id;
END;
$$;

-- Undo a task completion
CREATE OR REPLACE FUNCTION public.undo_task_completion(
    batch_id_param bigint,
    task_type_param text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_winery_id bigint;
BEGIN
    -- Verify user has access to this batch
    SELECT u.winery_id INTO user_winery_id
    FROM public.users u
    JOIN public.batches b ON b.winery_id = u.winery_id
    WHERE u.id = auth.uid() AND b.id = batch_id_param;
    
    IF user_winery_id IS NULL THEN
        RAISE EXCEPTION 'Access denied: User does not have access to this batch';
    END IF;
    
    -- Delete the task completion
    DELETE FROM public.task_completions
    WHERE batch_id = batch_id_param 
    AND task_type = task_type_param
    AND winery_id = user_winery_id;
    
    RETURN FOUND;
END;
$$;

-- 7. CREATE FUNCTION TO GET TASKS WITH COMPLETION STATUS
-- This function works with both old and new current_stage values
CREATE OR REPLACE FUNCTION public.get_tasks_for_date(target_date date)
RETURNS TABLE (
    task_id text,
    batch_id bigint,
    bop_number integer,
    customer_name text,
    kit_name text,
    task_type text,
    action_name text,
    due_date date,
    is_completed boolean,
    is_overdue boolean,
    completed_by uuid,
    completed_at timestamptz,
    category text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_winery_id bigint;
    today_date date := CURRENT_DATE;
BEGIN
    -- Get user's winery ID
    SELECT winery_id INTO user_winery_id
    FROM public.users
    WHERE id = auth.uid();
    
    IF user_winery_id IS NULL THEN
        RAISE EXCEPTION 'User not associated with a winery';
    END IF;
    
    RETURN QUERY
    WITH batch_tasks AS (
        -- Generate tasks for each batch based on their scheduled dates
        SELECT 
            b.id as batch_id,
            b.bop_number,
            b.customer_name,
            b.kit_name,
            'put-up' as task_type,
            'Start' as action_name,
            b.date_put_up as due_date
        FROM public.batches b
        WHERE b.winery_id = user_winery_id 
        AND b.date_put_up = target_date
        AND b.status IN ('pending', 'done')  -- Support both old and new status values
        
        UNION ALL
        
        SELECT 
            b.id,
            b.bop_number,
            b.customer_name,
            b.kit_name,
            'rack' as task_type,
            'Rack' as action_name,
            b.date_rack as due_date
        FROM public.batches b
        WHERE b.winery_id = user_winery_id 
        AND b.date_rack = target_date
        AND b.status IN ('pending', 'done')
        
        UNION ALL
        
        SELECT 
            b.id,
            b.bop_number,
            b.customer_name,
            b.kit_name,
            'filter' as task_type,
            'Filter' as action_name,
            b.date_filter as due_date
        FROM public.batches b
        WHERE b.winery_id = user_winery_id 
        AND b.date_filter = target_date
        AND b.status IN ('pending', 'done')
        
        UNION ALL
        
        SELECT 
            b.id,
            b.bop_number,
            b.customer_name,
            b.kit_name,
            'bottle' as task_type,
            'Bottle' as action_name,
            b.date_bottle as due_date
        FROM public.batches b
        WHERE b.winery_id = user_winery_id 
        AND b.date_bottle = target_date
        AND b.status IN ('pending', 'done')
        
        -- Add overdue tasks (only for today's view)
        UNION ALL
        
        SELECT 
            b.id,
            b.bop_number,
            b.customer_name,
            b.kit_name,
            'put-up' as task_type,
            'Start' as action_name,
            b.date_put_up as due_date
        FROM public.batches b
        WHERE b.winery_id = user_winery_id 
        AND target_date = today_date  -- Only show overdue for today
        AND b.date_put_up < today_date
        AND b.status IN ('pending', 'done')
        AND NOT EXISTS (
            SELECT 1 FROM public.task_completions tc 
            WHERE tc.batch_id = b.id AND tc.task_type = 'put-up'
        )
        
        UNION ALL
        
        SELECT 
            b.id,
            b.bop_number,
            b.customer_name,
            b.kit_name,
            'rack' as task_type,
            'Rack' as action_name,
            b.date_rack as due_date
        FROM public.batches b
        WHERE b.winery_id = user_winery_id 
        AND target_date = today_date
        AND b.date_rack < today_date
        AND b.status IN ('pending', 'done')
        AND EXISTS (
            SELECT 1 FROM public.task_completions tc 
            WHERE tc.batch_id = b.id AND tc.task_type = 'put-up'
        )
        AND NOT EXISTS (
            SELECT 1 FROM public.task_completions tc 
            WHERE tc.batch_id = b.id AND tc.task_type = 'rack'
        )
        
        UNION ALL
        
        SELECT 
            b.id,
            b.bop_number,
            b.customer_name,
            b.kit_name,
            'filter' as task_type,
            'Filter' as action_name,
            b.date_filter as due_date
        FROM public.batches b
        WHERE b.winery_id = user_winery_id 
        AND target_date = today_date
        AND b.date_filter < today_date
        AND b.status IN ('pending', 'done')
        AND EXISTS (
            SELECT 1 FROM public.task_completions tc 
            WHERE tc.batch_id = b.id AND tc.task_type = 'rack'
        )
        AND NOT EXISTS (
            SELECT 1 FROM public.task_completions tc 
            WHERE tc.batch_id = b.id AND tc.task_type = 'filter'
        )
        
        UNION ALL
        
        SELECT 
            b.id,
            b.bop_number,
            b.customer_name,
            b.kit_name,
            'bottle' as task_type,
            'Bottle' as action_name,
            b.date_bottle as due_date
        FROM public.batches b
        WHERE b.winery_id = user_winery_id 
        AND target_date = today_date
        AND b.date_bottle < today_date
        AND b.status IN ('pending', 'done')
        AND EXISTS (
            SELECT 1 FROM public.task_completions tc 
            WHERE tc.batch_id = b.id AND tc.task_type = 'filter'
        )
        AND NOT EXISTS (
            SELECT 1 FROM public.task_completions tc 
            WHERE tc.batch_id = b.id AND tc.task_type = 'bottle'
        )
    )
    SELECT 
        bt.batch_id || '-' || bt.task_type as task_id,
        bt.batch_id,
        bt.bop_number,
        bt.customer_name,
        bt.kit_name,
        bt.task_type,
        bt.action_name,
        bt.due_date,
        COALESCE(tc.id IS NOT NULL, false) as is_completed,
        CASE 
            WHEN target_date = today_date AND bt.due_date < today_date THEN true
            ELSE false
        END as is_overdue,
        tc.completed_by,
        tc.completed_at,
        CASE 
            WHEN target_date = today_date AND bt.due_date < today_date THEN 'Overdue'
            WHEN target_date = today_date THEN 
                CASE bt.task_type
                    WHEN 'put-up' THEN 'Put-Up Today'
                    WHEN 'rack' THEN 'Rack Today'
                    WHEN 'filter' THEN 'Filter Today'
                    WHEN 'bottle' THEN 'Bottle Today'
                END
            ELSE 
                CASE bt.task_type
                    WHEN 'put-up' THEN 'Put-Up'
                    WHEN 'rack' THEN 'Rack'
                    WHEN 'filter' THEN 'Filter'
                    WHEN 'bottle' THEN 'Bottle'
                END
        END as category
    FROM batch_tasks bt
    LEFT JOIN public.task_completions tc ON tc.batch_id = bt.batch_id AND tc.task_type = bt.task_type
    ORDER BY 
        -- Overdue first, then by task type order
        CASE WHEN bt.due_date < today_date AND target_date = today_date THEN 0 ELSE 1 END,
        CASE bt.task_type 
            WHEN 'put-up' THEN 1
            WHEN 'rack' THEN 2
            WHEN 'filter' THEN 3
            WHEN 'bottle' THEN 4
        END,
        bt.bop_number;
END;
$$;

-- 8. ENABLE ROW LEVEL SECURITY ON NEW TABLE
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policy for task_completions
CREATE POLICY "Users can manage task completions for their winery" ON public.task_completions
    FOR ALL USING (
        winery_id IN (
            SELECT winery_id FROM public.users WHERE id = auth.uid()
        )
    );

-- 9. ENABLE REALTIME FOR TASK COMPLETIONS
-- This will allow real-time updates across multiple users
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.batches; 