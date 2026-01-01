-- Update issue status to support new in-progress states
-- New statuses:
--   - open: Accepting applications
--   - in_progress_accepting: Has approved students but still accepting more
--   - in_progress_full: Has enough students, no longer accepting
--   - completed: Issue resolved successfully
--   - closed: Issue closed (cancelled or abandoned)

-- First, update any existing 'in_progress' to 'in_progress_accepting'
UPDATE public.issues SET status = 'in_progress_accepting' WHERE status = 'in_progress';

-- Drop the old constraint and add the new one
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check;

ALTER TABLE public.issues ADD CONSTRAINT issues_status_check 
    CHECK (status IN ('open', 'in_progress_accepting', 'in_progress_full', 'completed', 'closed'));




