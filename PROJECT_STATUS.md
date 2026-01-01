# FirstPrincipleBiz - Project Status

## Overview
Platform connecting business students with small/local businesses. Students gain real-world experience by working on real business challenges, businesses get fresh perspectives and solutions from talented students.

## Tech Stack
- **Frontend:** Next.js 16 (App Router, Turbopack)
- **Mobile:** React Native + Expo (not started)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Email + Google OAuth)
- **Storage:** Supabase Storage (avatars, chat-attachments)
- **Realtime:** Supabase Realtime (messages, notifications, dashboard updates)
- **Hosting:** Vercel (planned)

## Project Structure
```
firstprinciplebiz_v1/
├── apps/
│   └── web/                          # Next.js web app
│       ├── app/                      # App Router pages
│       │   ├── (auth)/               # Auth pages
│       │   │   ├── student/          # Student login/signup
│       │   │   ├── business/         # Business login/signup
│       │   │   └── onboarding/       # Profile completion forms
│       │   ├── (protected)/          # Authenticated pages
│       │   │   ├── dashboard/        # Role-based dashboard
│       │   │   ├── profile/          # View/edit profile
│       │   │   │   ├── student/[id]/ # View student profile
│       │   │   │   ├── business/[id]/# View business profile
│       │   │   │   └── edit/         # Edit own profile
│       │   │   ├── issues/           # Issue management
│       │   │   │   ├── [id]/         # Issue detail
│       │   │   │   │   ├── applicants/   # View applicants
│       │   │   │   │   └── edit/     # Edit issue
│       │   │   │   └── new/          # Create issue
│       │   │   ├── my-issues/        # Business: own issues
│       │   │   ├── my-applications/  # Student: own applications
│       │   │   ├── applicants/       # Business: all applicants
│       │   │   └── messages/         # Chat system
│       │   │       └── [issueId]/[participantId]/
│       │   └── auth/                 # OAuth callbacks
│       ├── components/               # React components
│       │   ├── ui/                   # Reusable UI components
│       │   ├── layout/               # Navbar, etc.
│       │   ├── notifications/        # NotificationBell
│       │   └── realtime/             # RealtimeRefresh
│       └── lib/                      # Server utilities
│           ├── supabase/             # Supabase clients
│           │   ├── client.ts         # Browser client
│           │   ├── server.ts         # Server client
│           │   ├── admin.ts          # Admin client
│           │   └── middleware.ts     # Auth middleware
│           ├── auth/                 # Auth actions
│           ├── issues/               # Issue & interest actions
│           ├── messages/             # Message actions
│           └── notifications/        # Notification actions
├── packages/
│   └── shared/                       # Shared types, constants
│       └── src/
│           ├── constants/            # Industries, expertise, etc.
│           └── types/                # TypeScript types
└── supabase/
    └── migrations/                   # 10 SQL migration files
```

## Database Tables (10 migrations)

### Core Tables
1. **users** - Core user table linked to Supabase Auth
   - `id`, `email`, `role` (student/business), `profile_completed`

2. **student_profiles** - Student details
   - `user_id`, `full_name`, `phone`, `date_of_birth`
   - `university_name`, `degree_name`, `major`, `degree_level`
   - `bio`, `avatar_url`, `areas_of_interest`, `expertise`
   - `open_to_paid`, `open_to_voluntary`

3. **business_profiles** - Business details
   - `user_id`, `owner_name`, `business_name`, `business_description`
   - `industry`, `business_age`, `address`, `phone`
   - `avatar_url`, `looking_for`, `current_issues`

### Issue System
4. **issues** - Business challenges posted
   - `business_id`, `title`, `description`, `expectations`
   - `compensation_type` (paid/voluntary/negotiable), `compensation_amount`
   - `duration_days`, `required_skills`
   - `status`: open → in_progress_accepting → in_progress_full → completed/closed
   - `max_students`, `current_students`

5. **issue_interests** - Student applications
   - `issue_id`, `student_id`, `cover_message`
   - `status`: pending → approved/rejected/withdrawn

### Communication
6. **messages** - Direct messaging between users
   - `sender_id`, `receiver_id`, `issue_id`, `content`
   - `is_read`, `read_at`
   - `attachment_url`, `attachment_name`, `attachment_type`, `attachment_size`

7. **notifications** - User notifications with triggers
   - `user_id`, `type`, `title`, `message`
   - `related_issue_id`, `related_user_id`
   - `is_read`, `read_at`

### Storage
8. **storage.buckets** - File storage
   - `avatars` - Public bucket for profile pictures (5MB limit)
   - `chat-attachments` - Private bucket for chat files (5MB limit, signed URLs)

## Development Phases

### ✅ Phase 1: Foundation (COMPLETED)
- Monorepo setup with npm workspaces
- Next.js 16 with App Router and Turbopack
- Supabase configuration (client, server, admin, middleware)
- Database migrations (8 initial tables)
- Tailwind CSS theming with custom colors
- UI components (Button, Input, Card, Badge, Select, Textarea, MultiSelect, AvatarUpload, GoBackButton)

### ✅ Phase 2: Authentication (COMPLETED)
- Separate student/business portals (/student/*, /business/*)
- Email/password signup and login
- Google OAuth SSO
- Forgot/reset password flow
- Onboarding (profile completion forms with validation)
- Role-based routing and protection
- Session management and logout

### ✅ Phase 3: Profile Management (COMPLETED)
- View own profile page (/profile)
- Edit profile page with avatar upload (/profile/edit)
- Public profile views:
  - Student profile (/profile/student/[id]) - shows completed projects
  - Business profile (/profile/business/[id]) - shows all posted issues
- GoBackButton component for proper browser history navigation

### ✅ Phase 4: Issue Posting & Feed (COMPLETED)
- Create issue form for businesses (/issues/new)
- Issue listing/feed with search & filters (/issues)
- Issue detail page (/issues/[id])
- Edit issue page (/issues/[id]/edit)
- My Issues page for businesses (/my-issues) with status management
- Browse issues with industry/compensation/skill filters
- Real-time updates on issue lists

### ✅ Phase 5: Interest System (COMPLETED)
- Express interest button with cover message
- View applicants page (/issues/[id]/applicants)
- All applicants page for business (/applicants) - clickable from dashboard
- Approve/reject workflow with notifications
- My Applications page for students (/my-applications)
  - Filter tabs: All, Pending, Approved, In Progress, Completed, Rejected
- Notification system with:
  - Database triggers for auto-notifications
  - NotificationBell component with unread count
  - Real-time updates (30-second polling)
- Dashboard stats (clickable for students):
  - Applications → /my-applications
  - Applications Approved → /my-applications?status=approved
  - Issues Closed → /my-applications?status=closed
  - In Progress → /my-applications?status=in_progress
- Dashboard Recent Activity:
  - Students: Shows approved issues (in progress/completed)
  - Business: Shows recently posted issues

### ✅ Phase 6: Messaging (COMPLETED)
- Realtime chat with Supabase subscriptions
- Conversation list (/messages)
- Chat interface with message bubbles
- Seen/read status with timestamps
- File sharing with secure signed URLs:
  - Images displayed inline
  - Documents (PDF, DOCX, etc.) as downloadable cards
  - 5MB file size limit
  - Private storage with temporary signed URLs (1 hour expiry)
- Clickable avatars/names to view profiles

### 🔲 Phase 7: Mobile App (NOT STARTED)
- React Native + Expo setup
- Share logic from packages/shared
- Mobile-specific UI

### 🔲 Phase 8: Deployment (NOT STARTED)
- Vercel deployment
- Custom domain
- Environment variables setup
- Expo EAS builds for mobile

## Key Routes

### Public Routes
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signup` | Portal selection |
| `/login` | Portal selection |
| `/student/signup` | Student registration |
| `/student/login` | Student login |
| `/business/signup` | Business registration |
| `/business/login` | Business login |

### Protected Routes (Authenticated)
| Route | Description | Access |
|-------|-------------|--------|
| `/dashboard` | Role-based dashboard | All |
| `/profile` | View own profile | All |
| `/profile/edit` | Edit own profile | All |
| `/profile/student/[id]` | View student profile | All |
| `/profile/business/[id]` | View business profile | All |
| `/issues` | Browse all issues | All |
| `/issues/new` | Create new issue | Business |
| `/issues/[id]` | View issue details | All |
| `/issues/[id]/edit` | Edit issue | Business (owner) |
| `/issues/[id]/applicants` | View applicants | Business (owner) |
| `/my-issues` | View own issues | Business |
| `/my-applications` | View own applications | Student |
| `/applicants` | View all applicants | Business |
| `/messages` | Conversation list | All |
| `/messages/[issueId]/[participantId]` | Chat interface | Participants |

## UI Components

### Core Components (`components/ui/`)
- **Button** - Primary, secondary, outline, danger variants
- **Input** - Form input with label and error states
- **Card** - Container with padding and hover states
- **Badge** - Status indicators (primary, success, warning, danger)
- **Select** - Dropdown select with options
- **Textarea** - Multi-line text input
- **MultiSelect** - Tag-based multi-selection
- **AvatarUpload** - Image upload with preview
- **GoBackButton** - Browser history navigation

### Feature Components
- **NotificationBell** - Notification dropdown with unread count
- **RealtimeRefresh** - Auto-refresh on database changes
- **ChatInterface** - Real-time messaging with attachments
- **ApplicantActions** - Approve/reject buttons
- **IssueStatusActions** - Issue status management

## Issue Status Flow
```
open (visible in browse, accepting applications)
  ↓ (business approves first student)
in_progress_accepting (visible in browse, still accepting more)
  ↓ (business sets to full or reaches max_students)
in_progress_full (hidden from browse, fully staffed)
  ↓ (work completed)
completed (hidden from browse, success)
  OR
closed (hidden from browse, cancelled/abandoned)
```

## Environment Variables (apps/web/.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Known Issues / Notes
- Middleware deprecation warning (Next.js 16) - cosmetic, doesn't affect functionality
- Google OAuth requires GCP setup with test users in "Testing" mode
- Email notifications not implemented (skipped in Phase 5)
- Real-time updates use 30-second polling for dashboard/notifications

## Last Updated
January 1, 2026 - Phase 6 completed with secure file sharing
