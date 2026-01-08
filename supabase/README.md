# Supabase Database Setup

This folder contains all the database migrations for the FirstPrincipleBiz platform.

## Running Migrations

### Option 1: Using Supabase Dashboard (Recommended for initial setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order (00001 → 00002 → ... → 00008)
4. Make sure to run them in sequence as they have dependencies

### Option 2: Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

## Migration Files

| File | Description |
|------|-------------|
| `00001_create_users_table.sql` | Core users table extending Supabase auth |
| `00002_create_student_profiles.sql` | Student profile information |
| `00003_create_business_profiles.sql` | Business owner profile information |
| `00004_create_issues.sql` | Business issues/problems table |
| `00005_create_issue_interests.sql` | Student interest in issues |
| `00006_create_messages.sql` | Direct messaging between users |
| `00007_create_notifications.sql` | User notifications with triggers |
| `00008_create_storage_buckets.sql` | Storage buckets for avatars and attachments |

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Users can only access their own data
- Profiles and issues are publicly readable
- Write operations are restricted to owners

## Realtime

To enable realtime subscriptions, go to your Supabase dashboard:
1. Navigate to **Database → Replication**
2. Enable replication for: `messages`, `notifications`, `issues`

## Storage Buckets

Two storage buckets are created:
- `avatars` - Public bucket for user profile pictures (5MB limit)
- `attachments` - Private bucket for issue attachments (10MB limit)
















