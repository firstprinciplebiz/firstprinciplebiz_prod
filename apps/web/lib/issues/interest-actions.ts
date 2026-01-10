"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
// Note: Notifications are handled by database triggers in 00007_create_notifications.sql
// Do not call createNotification() here to avoid duplicate notifications

export async function applyToIssue({
  issueId,
  studentProfileId,
  coverMessage,
}: {
  issueId: string;
  studentProfileId: string;
  coverMessage?: string;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in to apply" };
  }

  // Verify the student profile belongs to this user
  const { data: studentProfile, error: profileError } = await supabase
    .from("student_profiles")
    .select("id, user_id")
    .eq("id", studentProfileId)
    .single();

  if (profileError) {
    console.error("Error fetching student profile:", profileError);
    return { error: "Could not find your student profile. Please complete your profile first." };
  }

  if (!studentProfile || studentProfile.user_id !== user.id) {
    return { error: "Invalid student profile" };
  }

  // Check if issue is still accepting applications
  const { data: issue } = await supabase
    .from("issues")
    .select("id, title, status, business_id")
    .eq("id", issueId)
    .single();

  // Allow applying to open issues or in_progress issues that are still accepting students
  if (!issue || (issue.status !== "open" && issue.status !== "in_progress_accepting")) {
    return { error: "This issue is no longer accepting applications" };
  }

  // Get business owner info
  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("user_id, business_name")
    .eq("id", issue.business_id)
    .single();

  if (!businessProfile) {
    return { error: "Issue business not found" };
  }

  // Check if already applied
  const { data: existingInterest } = await supabase
    .from("issue_interests")
    .select("id")
    .eq("issue_id", issueId)
    .eq("student_id", studentProfileId)
    .single();

  if (existingInterest) {
    return { error: "You have already applied to this issue" };
  }

  // Create interest
  const { error: insertError } = await supabase
    .from("issue_interests")
    .insert({
      issue_id: issueId,
      student_id: studentProfileId,
      cover_message: coverMessage || null,
      status: "pending",
    });

  if (insertError) {
    console.error("Error creating interest:", insertError);
    return { error: "Failed to submit application" };
  }

  // Note: Notification is created by database trigger (notify_new_interest)

  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/my-applications");

  return { success: true };
}

export async function withdrawApplication(interestId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in" };
  }

  // Verify ownership
  const { data: interest } = await supabase
    .from("issue_interests")
    .select(`
      id,
      issue_id,
      student:student_profiles!inner(user_id)
    `)
    .eq("id", interestId)
    .single();

  const student = Array.isArray(interest?.student) ? interest.student[0] : interest?.student;
  if (!interest || !student || student.user_id !== user.id) {
    return { error: "Application not found" };
  }

  // Update status to withdrawn
  const { error: updateError } = await supabase
    .from("issue_interests")
    .update({ status: "withdrawn" })
    .eq("id", interestId);

  if (updateError) {
    return { error: "Failed to withdraw application" };
  }

  revalidatePath(`/issues/${interest.issue_id}`);
  revalidatePath("/my-applications");

  return { success: true };
}

export async function updateInterestStatus(
  interestId: string,
  status: "approved" | "rejected"
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in" };
  }

  // First get the interest to get the issue_id and student info
  const { data: interest, error: interestError } = await supabase
    .from("issue_interests")
    .select("id, issue_id, student_profiles!inner(user_id)")
    .eq("id", interestId)
    .single();

  if (interestError || !interest) {
    return { error: "Application not found" };
  }

  const issueId = interest.issue_id;
  const studentProfiles = interest.student_profiles;
  const studentProfile = Array.isArray(studentProfiles) ? studentProfiles[0] : studentProfiles;
  const studentUserId = studentProfile?.user_id;

  // Get issue details
  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .select("id, title, business_id")
    .eq("id", issueId)
    .single();

  if (issueError || !issue) {
    return { error: "Issue not found" };
  }

  // Verify the business owner owns this issue
  const { data: issueBusinessProfile } = await supabase
    .from("business_profiles")
    .select("user_id, business_name")
    .eq("id", issue.business_id)
    .single();

  if (!issueBusinessProfile || issueBusinessProfile.user_id !== user.id) {
    return { error: "You don't have permission to update this application" };
  }

  // Update interest status
  const { error: updateError } = await supabase
    .from("issue_interests")
    .update({ status })
    .eq("id", interestId);

  if (updateError) {
    return { error: "Failed to update application status" };
  }

  // If approving a student, change issue status to "in_progress_accepting" (still accepting more students)
  // Only update if issue is currently "open" - don't change if already in_progress_accepting
  if (status === "approved") {
    const { data: currentIssue } = await supabase
      .from("issues")
      .select("status")
      .eq("id", issueId)
      .single();

    if (currentIssue?.status === "open") {
      const { error: issueUpdateError } = await supabase
        .from("issues")
        .update({ status: "in_progress_accepting", updated_at: new Date().toISOString() })
        .eq("id", issueId);
      
      if (issueUpdateError) {
        console.error("Error updating issue status:", issueUpdateError);
      } else {
        console.log("Successfully updated issue", issueId, "to in_progress_accepting");
      }
    }
  }

  // Note: Notification is created by database trigger (notify_interest_status_change)

  // If approved, send an automatic welcome message from business to student
  if (status === "approved") {
    const welcomeMessage = `Welcome! You've been approved to work on "${issue.title}". I'm excited to collaborate with you. Feel free to ask any questions about the project!`;
    
    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id, // Business owner
        receiver_id: studentUserId,
        issue_id: issueId,
        content: welcomeMessage,
        is_read: false,
      });

    if (messageError) {
      console.error("Error creating welcome message:", messageError);
      // Don't fail the approval if message fails
    }
  }

  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/issues/${issueId}/applicants`);
  revalidatePath("/dashboard");
  revalidatePath("/my-issues");
  revalidatePath("/messages");

  return { success: true };
}

export async function getMyApplications() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], total: 0 };

  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!studentProfile) return { data: [], total: 0 };

  const { data, error, count } = await supabase
    .from("issue_interests")
    .select(`
      *,
      issue:issues!inner(
        id,
        title,
        status,
        compensation_type,
        compensation_amount,
        business:business_profiles!inner(
          business_name,
          avatar_url
        )
      )
    `, { count: "exact" })
    .eq("student_id", studentProfile.id)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
    return { data: [], total: 0 };
  }

  return { data: data || [], total: count || 0 };
}

