import type { SupabaseClient } from "@supabase/supabase-js";
import type { User, StudentProfile, BusinessProfile, UserRole } from "../types";

export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("role, profile_completed")
    .eq("id", userId)
    .single();

  return { data: data as { role: UserRole; profile_completed: boolean } | null, error };
}

export async function getStudentProfile(
  supabase: SupabaseClient,
  id: string,
  byUserId: boolean = false
) {
  const query = supabase.from("student_profiles").select("*");
  
  const { data, error } = byUserId
    ? await query.eq("user_id", id).single()
    : await query.eq("id", id).single();

  return { data: data as StudentProfile | null, error };
}

export async function getBusinessProfile(
  supabase: SupabaseClient,
  id: string,
  byUserId: boolean = false
) {
  const query = supabase.from("business_profiles").select("*");
  
  const { data, error } = byUserId
    ? await query.eq("user_id", id).single()
    : await query.eq("id", id).single();

  return { data: data as BusinessProfile | null, error };
}

export async function updateStudentProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<StudentProfile>
) {
  const { data, error } = await supabase
    .from("student_profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  return { data: data as StudentProfile | null, error };
}

export async function updateBusinessProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<BusinessProfile>
) {
  const { data, error } = await supabase
    .from("business_profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  return { data: data as BusinessProfile | null, error };
}

export async function createStudentProfile(
  supabase: SupabaseClient,
  profile: Partial<StudentProfile>
) {
  const { data, error } = await supabase
    .from("student_profiles")
    .insert(profile)
    .select()
    .single();

  if (!error && profile.user_id) {
    await supabase
      .from("users")
      .update({ profile_completed: true })
      .eq("id", profile.user_id);
  }

  return { data: data as StudentProfile | null, error };
}

export async function createBusinessProfile(
  supabase: SupabaseClient,
  profile: Partial<BusinessProfile>
) {
  const { data, error } = await supabase
    .from("business_profiles")
    .insert(profile)
    .select()
    .single();

  if (!error && profile.user_id) {
    await supabase
      .from("users")
      .update({ profile_completed: true })
      .eq("id", profile.user_id);
  }

  return { data: data as BusinessProfile | null, error };
}

export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: {
    uri: string;
    type: string;
  }
) {
  const ext = file.type.split("/").pop() || "jpg";
  const fileName = `${userId}-${Date.now()}.${ext}`;

  const response = await fetch(file.uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, blob, { upsert: true });

  if (uploadError) return { url: null, error: uploadError };

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  return { url: publicUrl, error: null };
}



