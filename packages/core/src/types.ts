export type UserRole = "student" | "business";

export type IssueStatus =
  | "open"
  | "in_progress_accepting"
  | "in_progress_full"
  | "completed"
  | "closed";

export type CompensationType = "paid" | "voluntary" | "negotiable";

export type InterestStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile_completed: boolean;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  university_name: string;
  degree_name: string;
  degree_level: string;
  major: string;
  bio: string | null;
  expertise: string[];
  areas_of_interest: string[];
  open_to_paid: boolean;
  open_to_voluntary: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  owner_name: string;
  business_name: string;
  avatar_url: string | null;
  industry: string;
  business_age: number | null;
  address: string | null;
  business_description: string | null;
  looking_for: string[];
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  business_id: string;
  title: string;
  description: string;
  expectations: string | null;
  status: IssueStatus;
  compensation_type: CompensationType;
  compensation_amount: number | null;
  duration_days: number | null;
  required_skills: string[];
  max_students: number;
  current_students: number;
  created_at: string;
  updated_at: string;
  business_profiles?: BusinessProfile;
}

export interface IssueInterest {
  id: string;
  issue_id: string;
  student_id: string;
  status: InterestStatus;
  cover_message: string;
  created_at: string;
  updated_at: string;
  student_profiles?: StudentProfile;
  issues?: Issue;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  issue_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export interface Conversation {
  issue_id: string;
  issue_title: string;
  participant_id: string;
  participant_name: string;
  participant_avatar: string | null;
  participant_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}


