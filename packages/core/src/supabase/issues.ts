import type { SupabaseClient } from "@supabase/supabase-js";
import type { Issue, IssueStatus } from "../types";

export async function getOpenIssues(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("issues")
    .select(`
      *,
      business_profiles(id, business_name, industry, address, avatar_url)
    `)
    .in("status", ["open", "in_progress_accepting"])
    .order("created_at", { ascending: false });

  return { data: data as Issue[] | null, error };
}

export async function getIssueById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("issues")
    .select(`
      *,
      business_profiles(id, user_id, business_name, industry, address, avatar_url)
    `)
    .eq("id", id)
    .single();

  return { data: data as Issue | null, error };
}

export async function getBusinessIssues(supabase: SupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  return { data: data as Issue[] | null, error };
}

export async function createIssue(
  supabase: SupabaseClient,
  issue: Partial<Issue>
) {
  const { data, error } = await supabase
    .from("issues")
    .insert(issue)
    .select()
    .single();

  return { data: data as Issue | null, error };
}

export async function updateIssue(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Issue>
) {
  const { data, error } = await supabase
    .from("issues")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data: data as Issue | null, error };
}

export async function updateIssueStatus(
  supabase: SupabaseClient,
  id: string,
  status: IssueStatus
) {
  return updateIssue(supabase, id, { status });
}



