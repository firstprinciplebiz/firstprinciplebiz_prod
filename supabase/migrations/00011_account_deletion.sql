-- Add deleted_at column to users table for soft delete functionality
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient filtering of non-deleted users
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at);

-- Update RLS policies to handle deleted users

-- Policy: Deleted users cannot log in (handled at application level, but adding index helps)
-- The actual blocking is done in the application middleware

-- Create a function to handle account deletion
-- This will be called from the application to perform soft delete
CREATE OR REPLACE FUNCTION soft_delete_user(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    user_role TEXT;
    profile_id UUID;
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM public.users WHERE id = user_uuid;
    
    IF user_role = 'student' THEN
        -- Get student profile id
        SELECT id INTO profile_id FROM public.student_profiles WHERE user_id = user_uuid;
        
        -- Auto-reject all pending applications
        UPDATE public.issue_interests 
        SET status = 'rejected', updated_at = NOW()
        WHERE student_id = profile_id AND status = 'pending';
        
        -- Clear PII from student profile
        UPDATE public.student_profiles
        SET 
            phone = NULL,
            date_of_birth = NULL,
            avatar_url = NULL,
            updated_at = NOW()
        WHERE user_id = user_uuid;
        
    ELSIF user_role = 'business' THEN
        -- Get business profile id
        SELECT id INTO profile_id FROM public.business_profiles WHERE user_id = user_uuid;
        
        -- Close all open/in_progress issues
        UPDATE public.issues 
        SET status = 'closed', updated_at = NOW()
        WHERE business_id = profile_id AND status IN ('open', 'in_progress', 'in_progress_accepting', 'in_progress_full');
        
        -- Clear PII from business profile
        UPDATE public.business_profiles
        SET 
            phone = NULL,
            address = NULL,
            avatar_url = NULL,
            updated_at = NOW()
        WHERE user_id = user_uuid;
    END IF;
    
    -- Clear email and set deleted_at on users table
    UPDATE public.users
    SET 
        email = 'deleted_' || user_uuid::text || '@deleted.local',
        deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = user_uuid;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (they can only delete their own account via application)
GRANT EXECUTE ON FUNCTION soft_delete_user(UUID) TO authenticated;

