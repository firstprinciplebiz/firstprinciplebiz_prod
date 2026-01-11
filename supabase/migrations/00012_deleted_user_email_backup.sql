-- Add column to store the original email of deleted users for record keeping
-- This helps track deleted accounts in case of bad faith or scams

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS deleted_user_email TEXT DEFAULT NULL;

-- Create index for querying deleted users
CREATE INDEX IF NOT EXISTS idx_users_deleted_user_email ON public.users(deleted_user_email) WHERE deleted_user_email IS NOT NULL;

-- Comment explaining the column
COMMENT ON COLUMN public.users.deleted_user_email IS 'Original email address preserved when user deletes account. Used for record keeping.';


