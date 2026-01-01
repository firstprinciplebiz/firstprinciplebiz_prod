# FirstPrincipleBiz - Database Schema

## Overview
PostgreSQL database hosted on Supabase with Row Level Security (RLS) policies for data protection.

## Entity Relationship Diagram
```
┌─────────────────┐     ┌─────────────────────┐     ┌───────────────────┐
│  auth.users     │     │      users          │     │  student_profiles │
│  (Supabase)     │────▶│                     │◀────│                   │
└─────────────────┘     │  id (PK)            │     │  id (PK)          │
                        │  email              │     │  user_id (FK)     │
                        │  role               │     │  full_name        │
                        │  profile_completed  │     │  university_name  │
                        └─────────────────────┘     │  degree_name      │
                                │                   │  expertise[]      │
                                │                   │  areas_of_interest│
                                ▼                   └───────────────────┘
                        ┌─────────────────────┐
                        │  business_profiles  │
                        │                     │
                        │  id (PK)            │
                        │  user_id (FK)       │
                        │  business_name      │
                        │  industry           │
                        │  looking_for[]      │
                        └─────────────────────┘
                                │
                                │ 1:N
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                           issues                                 │
│                                                                  │
│  id (PK)              business_id (FK → business_profiles)       │
│  title                status (open/in_progress/completed/closed) │
│  description          compensation_type (paid/voluntary/nego)    │
│  required_skills[]    max_students, current_students             │
└─────────────────────────────────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ issue_interests │   │    messages     │   │  notifications  │
│                 │   │                 │   │                 │
│ id (PK)         │   │ id (PK)         │   │ id (PK)         │
│ issue_id (FK)   │   │ issue_id (FK)   │   │ user_id (FK)    │
│ student_id (FK) │   │ sender_id (FK)  │   │ related_issue_id│
│ status          │   │ receiver_id(FK) │   │ type, title     │
│ cover_message   │   │ content         │   │ is_read         │
└─────────────────┘   │ attachment_*    │   └─────────────────┘
                      │ is_read         │
                      └─────────────────┘
```

## Tables

### 1. users
Core user table extending Supabase Auth.

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'business')),
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- SELECT: Users can view their own record
- UPDATE: Users can update their own record
- INSERT: Authenticated users can create (via trigger on auth.users)

---

### 2. student_profiles
Student user profile information.

```sql
CREATE TABLE public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    university_name TEXT NOT NULL,
    degree_name TEXT NOT NULL,
    major TEXT NOT NULL,
    degree_level TEXT NOT NULL CHECK (degree_level IN ('undergraduate', 'masters', 'doctorate', 'other')),
    bio TEXT,
    avatar_url TEXT,
    areas_of_interest JSONB DEFAULT '[]'::jsonb,
    expertise JSONB DEFAULT '[]'::jsonb,
    open_to_paid BOOLEAN DEFAULT TRUE,
    open_to_voluntary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- SELECT: Public (anyone can view profiles)
- INSERT: Students can create their own profile
- UPDATE: Students can update their own profile

---

### 3. business_profiles
Business user profile information.

```sql
CREATE TABLE public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    owner_name TEXT NOT NULL,
    phone TEXT,
    business_name TEXT NOT NULL,
    business_description TEXT,
    industry TEXT NOT NULL,
    business_age INTEGER,
    address TEXT,
    avatar_url TEXT,
    looking_for JSONB DEFAULT '[]'::jsonb,
    current_issues TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- SELECT: Public (anyone can view profiles)
- INSERT: Business users can create their own profile
- UPDATE: Business users can update their own profile

---

### 4. issues
Business challenges/problems posted for students.

```sql
CREATE TABLE public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    expectations TEXT,
    compensation_type TEXT NOT NULL CHECK (compensation_type IN ('paid', 'voluntary', 'negotiable')),
    compensation_amount DECIMAL(10, 2),
    duration_days INTEGER,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
        'open', 
        'in_progress_accepting', 
        'in_progress_full', 
        'completed', 
        'closed'
    )),
    required_skills JSONB DEFAULT '[]'::jsonb,
    max_students INTEGER DEFAULT 1,
    current_students INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status Flow:**
- `open` - Visible in browse, accepting applications
- `in_progress_accepting` - Has approved students, still accepting more
- `in_progress_full` - Hidden from browse, fully staffed
- `completed` - Successfully completed
- `closed` - Cancelled or abandoned

**RLS Policies:**
- SELECT: Public (anyone can view issues)
- INSERT: Business users can create issues
- UPDATE: Business owners can update their issues

---

### 5. issue_interests
Student applications to issues.

```sql
CREATE TABLE public.issue_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    cover_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(issue_id, student_id)
);
```

**RLS Policies:**
- SELECT: Students can view their own interests; Business owners can view interests for their issues
- INSERT: Students can express interest
- UPDATE: Students can withdraw; Business owners can approve/reject

---

### 6. messages
Direct messaging between users.

```sql
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT,
    attachment_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- SELECT: Users can view messages they sent or received
- INSERT: Authenticated users can send messages
- UPDATE: Receivers can mark messages as read

---

### 7. notifications
User notifications with database triggers.

```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    related_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notification Types:**
- `new_interest` - Student applied to your issue
- `interest_approved` - Your application was approved
- `interest_rejected` - Your application was rejected
- `new_message` - You have a new message

**RLS Policies:**
- SELECT: Users can view their own notifications
- UPDATE: Users can mark their notifications as read

**Triggers:**
- Auto-create notification when interest status changes
- Auto-create notification when new message received

---

## Storage Buckets

### avatars (Public)
- **Purpose:** Profile pictures
- **Access:** Public URLs
- **Size Limit:** 5MB
- **Allowed Types:** image/jpeg, image/png, image/gif, image/webp

### chat-attachments (Private)
- **Purpose:** Chat file attachments
- **Access:** Signed URLs (1 hour expiry)
- **Size Limit:** 5MB
- **Allowed Types:** 
  - Images: jpeg, png, gif, webp
  - Documents: pdf, doc, docx, xls, xlsx, ppt, pptx
  - Text: txt, csv

---

## Database Functions

### get_conversations(user_uuid)
Returns list of conversations for a user with latest message info.

```sql
CREATE OR REPLACE FUNCTION get_conversations(user_uuid UUID)
RETURNS TABLE (
    issue_id UUID,
    issue_title TEXT,
    participant_id UUID,
    participant_name TEXT,
    participant_avatar TEXT,
    participant_role TEXT,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT
)
```

### update_updated_at_column()
Trigger function to auto-update `updated_at` timestamp.

---

## Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Student Profiles
CREATE INDEX idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX idx_student_profiles_areas_of_interest ON public.student_profiles USING GIN(areas_of_interest);
CREATE INDEX idx_student_profiles_expertise ON public.student_profiles USING GIN(expertise);

-- Business Profiles
CREATE INDEX idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX idx_business_profiles_industry ON public.business_profiles(industry);
CREATE INDEX idx_business_profiles_looking_for ON public.business_profiles USING GIN(looking_for);

-- Issues
CREATE INDEX idx_issues_business_id ON public.issues(business_id);
CREATE INDEX idx_issues_status ON public.issues(status);
CREATE INDEX idx_issues_compensation_type ON public.issues(compensation_type);
CREATE INDEX idx_issues_created_at ON public.issues(created_at DESC);
CREATE INDEX idx_issues_required_skills ON public.issues USING GIN(required_skills);

-- Issue Interests
CREATE INDEX idx_issue_interests_issue_id ON public.issue_interests(issue_id);
CREATE INDEX idx_issue_interests_student_id ON public.issue_interests(student_id);
CREATE INDEX idx_issue_interests_status ON public.issue_interests(status);

-- Messages
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_issue_id ON public.messages(issue_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_has_attachment ON public.messages(attachment_url) WHERE attachment_url IS NOT NULL;

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
```

---

## Migration Files

| File | Description |
|------|-------------|
| `00001_create_users_table.sql` | Users table with auth trigger |
| `00002_create_student_profiles.sql` | Student profiles |
| `00003_create_business_profiles.sql` | Business profiles |
| `00004_create_issues.sql` | Issues table |
| `00005_create_issue_interests.sql` | Interest/application system |
| `00006_create_messages.sql` | Messaging system with get_conversations function |
| `00007_create_notifications.sql` | Notifications with triggers |
| `00008_create_storage_buckets.sql` | Avatar storage bucket |
| `00009_update_issue_status.sql` | Extended status values + max_students |
| `00010_add_message_attachments.sql` | Chat attachments + private storage bucket |

---

## Realtime Subscriptions

Enable realtime for these tables in Supabase Dashboard → Database → Replication:
- `messages` - For live chat updates
- `notifications` - For notification bell updates
- `issues` - For issue list updates
- `issue_interests` - For application status updates


