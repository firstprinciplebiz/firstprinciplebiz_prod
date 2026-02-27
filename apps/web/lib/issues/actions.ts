"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { issueSchema } from "@repo/shared";
import type { IssueInput } from "@repo/shared";

export async function createIssue(formData: IssueInput) {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in to create an issue" };
  }

  // Validate input
  const validatedFields = issueSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }

  // Get business profile
  const { data: businessProfile, error: profileError } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !businessProfile) {
    return { error: "Business profile not found. Please complete your profile first." };
  }

  // Create issue
  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .insert({
      business_id: businessProfile.id,
      title: validatedFields.data.title,
      description: validatedFields.data.description,
      expectations: validatedFields.data.expectations || null,
      compensation_type: validatedFields.data.compensation_type,
      compensation_amount: validatedFields.data.compensation_amount || null,
      duration_days: validatedFields.data.duration_days || null,
      required_skills: validatedFields.data.required_skills || [],
      status: "open",
    })
    .select()
    .single();

  if (issueError) {
    console.error("Error creating issue:", issueError);
    return { error: "Failed to create issue. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/issues");
  revalidatePath("/my-issues");
  
  return { success: true, issueId: issue.id };
}

export async function updateIssue(issueId: string, formData: Partial<IssueInput>) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in to update an issue" };
  }

  // Get business profile
  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!businessProfile) {
    return { error: "Business profile not found" };
  }

  // Verify ownership
  const { data: existingIssue } = await supabase
    .from("issues")
    .select("business_id")
    .eq("id", issueId)
    .single();

  if (!existingIssue || existingIssue.business_id !== businessProfile.id) {
    return { error: "You don't have permission to edit this issue" };
  }

  const { error: updateError } = await supabase
    .from("issues")
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", issueId);

  if (updateError) {
    return { error: "Failed to update issue" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/issues");
  revalidatePath("/my-issues");
  revalidatePath(`/issues/${issueId}`);

  return { success: true };
}

export async function updateIssueStatus(issueId: string, status: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in" };
  }

  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!businessProfile) {
    return { error: "Business profile not found" };
  }

  const { error: updateError } = await supabase
    .from("issues")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", issueId)
    .eq("business_id", businessProfile.id);

  if (updateError) {
    return { error: "Failed to update status" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/issues");
  revalidatePath("/my-issues");
  revalidatePath(`/issues/${issueId}`);

  return { success: true };
}

export async function deleteIssue(issueId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in" };
  }

  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!businessProfile) {
    return { error: "Business profile not found" };
  }

  const { error: deleteError } = await supabase
    .from("issues")
    .delete()
    .eq("id", issueId)
    .eq("business_id", businessProfile.id);

  if (deleteError) {
    return { error: "Failed to delete issue" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/issues");
  revalidatePath("/my-issues");

  return { success: true };
}

export async function getIssues(options: {
  page?: number;
  limit?: number;
  status?: string;
  compensationType?: string;
  skills?: string[];
  search?: string;
  businessId?: string;
} = {}) {
  const supabase = await createClient();

  const {
    page = 1,
    limit = 10,
    status,
    compensationType,
    skills,
    search,
    businessId,
  } = options;

  const offset = (page - 1) * limit;

  let query = supabase
    .from("issues")
    .select(`
      *,
      business:business_profiles!inner(
        id,
        business_name,
        industry,
        avatar_url
      )
    `, { count: "exact" });

  // Apply filters
  if (status) {
    query = query.eq("status", status);
  } else {
    // Default: only show open issues for students
    query = query.eq("status", "open");
  }

  if (compensationType) {
    query = query.eq("compensation_type", compensationType);
  }

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (skills && skills.length > 0) {
    // Filter by required_skills containing any of the specified skills
    query = query.contains("required_skills", skills);
  }

  // Order and paginate
  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching issues:", error);
    return { data: [], total: 0, hasMore: false };
  }

  return {
    data: data || [],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
    page,
    limit,
  };
}

export async function getIssueById(issueId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("issues")
    .select(`
      *,
      business:business_profiles!inner(
        id,
        user_id,
        business_name,
        business_description,
        industry,
        avatar_url,
        owner_name
      )
    `)
    .eq("id", issueId)
    .single();

  if (error) {
    console.error("Error fetching issue:", error);
    return null;
  }

  return data;
}

export async function getMyIssues(status?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], total: 0 };

  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!businessProfile) return { data: [], total: 0 };

  let query = supabase
    .from("issues")
    .select(`
      *,
      interests:issue_interests(count)
    `, { count: "exact" })
    .eq("business_id", businessProfile.id);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching my issues:", error);
    return { data: [], total: 0 };
  }

  return { data: data || [], total: count || 0 };
}












