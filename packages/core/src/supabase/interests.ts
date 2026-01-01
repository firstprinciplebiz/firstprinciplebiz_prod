import type { SupabaseClient } from "@supabase/supabase-js";
import type { IssueInterest, InterestStatus } from "../types";

export async function getStudentApplications(
  supabase: SupabaseClient,
  studentId: string
) {
  const { data, error } = await supabase
    .from("issue_interests")
    .select(`
      *,
      issues(
        id,
        title,
        status,
        compensation_type,
        business_profiles(business_name)
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return { data: data as IssueInterest[] | null, error };
}

export async function getIssueApplicants(
  supabase: SupabaseClient,
  issueId: string
) {
  const { data, error } = await supabase
    .from("issue_interests")
    .select(`
      *,
      student_profiles(id, user_id, full_name, avatar_url, university_name, major)
    `)
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false });

  return { data: data as IssueInterest[] | null, error };
}

export async function getPendingApplicantsForBusiness(
  supabase: SupabaseClient,
  issueIds: string[]
) {
  const { data, error } = await supabase
    .from("issue_interests")
    .select(`
      *,
      student_profiles(id, user_id, full_name, avatar_url, university_name, major),
      issues(id, title)
    `)
    .in("issue_id", issueIds)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return { data: data as IssueInterest[] | null, error };
}

export async function checkStudentApplication(
  supabase: SupabaseClient,
  issueId: string,
  studentId: string
) {
  const { data, error } = await supabase
    .from("issue_interests")
    .select("id, status")
    .eq("issue_id", issueId)
    .eq("student_id", studentId)
    .single();

  return { data, error };
}

export async function applyToIssue(
  supabase: SupabaseClient,
  issueId: string,
  studentId: string,
  coverMessage: string
) {
  const { data, error } = await supabase
    .from("issue_interests")
    .insert({
      issue_id: issueId,
      student_id: studentId,
      cover_message: coverMessage,
      status: "pending",
    })
    .select()
    .single();

  return { data: data as IssueInterest | null, error };
}

export async function updateApplicationStatus(
  supabase: SupabaseClient,
  applicationId: string,
  status: InterestStatus
) {
  const { data, error } = await supabase
    .from("issue_interests")
    .update({ status })
    .eq("id", applicationId)
    .select()
    .single();

  return { data: data as IssueInterest | null, error };
}


