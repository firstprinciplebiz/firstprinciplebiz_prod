// ============================================
// User Types
// ============================================
export type UserRole = "student" | "business";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Student Profile Types
// ============================================
export type DegreeLevel = "undergraduate" | "masters" | "doctorate" | "other";

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  university_name: string;
  degree_name: string;
  major: string;
  degree_level: DegreeLevel;
  bio: string | null;
  avatar_url: string | null;
  areas_of_interest: string[];
  expertise: string[];
  open_to_paid: boolean;
  open_to_voluntary: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentProfileFormData {
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  university_name: string;
  degree_name: string;
  major: string;
  degree_level: DegreeLevel;
  bio?: string;
  areas_of_interest?: string[];
  expertise?: string[];
  open_to_paid?: boolean;
  open_to_voluntary?: boolean;
}

// ============================================
// Business Profile Types
// ============================================
export interface BusinessProfile {
  id: string;
  user_id: string;
  owner_name: string;
  phone: string | null;
  business_name: string;
  business_description: string | null;
  industry: string;
  address: string | null;
  business_age_years: number | null;
  avatar_url: string | null;
  looking_for: string[];
  created_at: string;
  updated_at: string;
}

export interface BusinessProfileFormData {
  owner_name: string;
  phone?: string;
  business_name: string;
  business_description?: string;
  industry: string;
  address?: string;
  business_age_years?: number;
  looking_for?: string[];
}

// ============================================
// Issue Types
// ============================================
export type CompensationType = "paid" | "voluntary" | "negotiable";
export type IssueStatus = "open" | "in_progress_accepting" | "in_progress_full" | "completed" | "closed";

export interface Issue {
  id: string;
  business_id: string;
  title: string;
  description: string;
  expectations: string | null;
  compensation_type: CompensationType;
  compensation_amount: number | null;
  duration_days: number | null;
  status: IssueStatus;
  required_skills: string[];
  created_at: string;
  updated_at: string;
  // Joined data
  business?: BusinessProfile;
}

export interface IssueFormData {
  title: string;
  description: string;
  expectations?: string;
  compensation_type: CompensationType;
  compensation_amount?: number;
  duration_days?: number;
  required_skills?: string[];
}

// ============================================
// Issue Interest Types
// ============================================
export type InterestStatus = "pending" | "approved" | "rejected" | "withdrawn";

export interface IssueInterest {
  id: string;
  issue_id: string;
  student_id: string;
  status: InterestStatus;
  cover_message: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: StudentProfile;
  issue?: Issue;
}

// ============================================
// Message Types
// ============================================
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  issue_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  issue_id?: string;
  issue_title?: string;
}

// ============================================
// Notification Types
// ============================================
export type NotificationType =
  | "new_interest"
  | "interest_approved"
  | "interest_rejected"
  | "new_message"
  | "new_issue";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}










