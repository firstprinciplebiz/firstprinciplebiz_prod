-- ============================================================================
-- WIPE ALL DATA SCRIPT
-- ============================================================================
-- WARNING: This script will DELETE ALL DATA from your database including:
-- - All user data (profiles, issues, messages, notifications, etc.)
-- - All authentication users (auth.users)
-- - All OAuth providers
-- - All storage files (avatars, attachments, chat attachments)
--
-- This is IRREVERSIBLE. Make sure you have backups if needed.
-- ============================================================================

-- Disable triggers temporarily to avoid notification triggers during deletion
SET session_replication_role = 'replica';

-- ============================================================================
-- STEP 1: Delete all data from child tables (respecting foreign key order)
-- ============================================================================

-- Delete issue interests (references issues and student_profiles)
TRUNCATE TABLE public.issue_interests CASCADE;

-- Delete messages (references users and issues)
TRUNCATE TABLE public.messages CASCADE;

-- Delete notifications (references users)
TRUNCATE TABLE public.notifications CASCADE;

-- Delete issues (references business_profiles)
TRUNCATE TABLE public.issues CASCADE;

-- Delete student profiles (references users)
TRUNCATE TABLE public.student_profiles CASCADE;

-- Delete business profiles (references users)
TRUNCATE TABLE public.business_profiles CASCADE;

-- Delete users from public schema (references auth.users)
TRUNCATE TABLE public.users CASCADE;

-- ============================================================================
-- STEP 2: Delete all authentication users and OAuth providers
-- ============================================================================

-- Delete all OAuth identities first (they reference auth.users)
DELETE FROM auth.identities;

-- Delete all user sessions
DELETE FROM auth.sessions;

-- Delete all refresh tokens
DELETE FROM auth.refresh_tokens;

-- Delete all auth users (this will cascade to public.users if CASCADE is set)
-- Note: We need to use DELETE instead of TRUNCATE because of RLS policies
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users
    LOOP
        DELETE FROM auth.users WHERE id = user_record.id;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Delete all storage files
-- ============================================================================

-- Delete all files from chat-attachments bucket
DELETE FROM storage.objects WHERE bucket_id = 'chat-attachments';

-- Delete all files from attachments bucket
DELETE FROM storage.objects WHERE bucket_id = 'attachments';

-- Delete all files from avatars bucket
DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- ============================================================================
-- STEP 4: Reset sequences (if any auto-increment columns exist)
-- ============================================================================

-- Note: UUID primary keys don't use sequences, but if you have any
-- serial/bigserial columns, you can reset them here:
-- ALTER SEQUENCE table_name_id_seq RESTART WITH 1;

-- ============================================================================
-- STEP 5: Re-enable triggers
-- ============================================================================

SET session_replication_role = 'origin';

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to verify deletion)
-- ============================================================================

-- SELECT COUNT(*) as users_count FROM public.users;
-- SELECT COUNT(*) as student_profiles_count FROM public.student_profiles;
-- SELECT COUNT(*) as business_profiles_count FROM public.business_profiles;
-- SELECT COUNT(*) as issues_count FROM public.issues;
-- SELECT COUNT(*) as issue_interests_count FROM public.issue_interests;
-- SELECT COUNT(*) as messages_count FROM public.messages;
-- SELECT COUNT(*) as notifications_count FROM public.notifications;
-- SELECT COUNT(*) as auth_users_count FROM auth.users;
-- SELECT COUNT(*) as storage_files_count FROM storage.objects;

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================
-- All data has been wiped. You can now start feeding real data.
-- ============================================================================


