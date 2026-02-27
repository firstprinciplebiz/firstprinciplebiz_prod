# Database Wipe Scripts

This directory contains scripts to completely wipe all data from your Supabase database, including authentication users and storage files.

## ⚠️ WARNING

**These scripts are IRREVERSIBLE.** They will delete:
- All user data (profiles, issues, messages, notifications, etc.)
- All authentication users (auth.users)
- All OAuth providers
- All storage files (avatars, attachments, chat attachments)

**Make sure you have backups if needed before running these scripts.**

## Option 1: SQL Script (Recommended)

The SQL script is the most reliable method and can be run directly in the Supabase dashboard.

### Steps:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/00099_wipe_all_data.sql`
4. Copy and paste the entire SQL script into the SQL Editor
5. Click **Run** to execute

The script will:
- Delete all data from all tables in the correct order
- Delete all authentication users and OAuth providers
- Delete all storage files
- Verify the deletion

## Option 2: Node.js Script

The Node.js script provides a more interactive experience with progress updates.

### Prerequisites:

- Node.js 18+ installed
- Environment variables set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Steps:

1. Make sure your environment variables are set in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Run the script from the project root:
   ```bash
   node scripts/wipe-all-data.js
   ```

   Or if you're in the web app directory:
   ```bash
   cd apps/web
   node ../../scripts/wipe-all-data.js
   ```

3. The script will:
   - Show a warning message
   - Delete all data from tables
   - Delete all authentication users
   - Delete all storage files
   - Show verification results

## Verification

After running either script, you can verify the deletion by checking:

- **Supabase Dashboard → Table Editor**: All tables should be empty
- **Supabase Dashboard → Authentication → Users**: No users should exist
- **Supabase Dashboard → Storage**: All buckets should be empty

## Troubleshooting

### SQL Script Issues

- If you get foreign key constraint errors, make sure you're running the script in the correct order
- Some tables might have RLS policies that prevent deletion - the script uses `TRUNCATE CASCADE` to bypass this

### Node.js Script Issues

- **"Missing environment variables"**: Make sure `.env.local` exists in the project root with the required variables
- **"Permission denied"**: Make sure you're using the `SUPABASE_SERVICE_ROLE_KEY` (not the anon key)
- **Storage deletion fails**: The script will continue even if some files fail to delete - check the error messages

## After Wiping Data

Once the data is wiped, you can:
1. Start creating new users through your app
2. Test your signup/login flows
3. Begin feeding real data

The database schema and structure remain intact - only the data is deleted.


