"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteAccount() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in to delete your account" };
  }

  try {
    // Get user role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return { error: "Failed to fetch user data" };
    }

    const userRole = userData.role;

    if (userRole === "student") {
      // Get student profile
      const { data: studentProfile } = await supabase
        .from("student_profiles")
        .select("id, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (studentProfile) {
        // Auto-reject all pending applications
        const { error: rejectError } = await supabase
          .from("issue_interests")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("student_id", studentProfile.id)
          .eq("status", "pending");

        if (rejectError) {
          console.error("Error rejecting pending applications:", rejectError);
        }

        // Delete avatar from storage if exists
        if (studentProfile.avatar_url) {
          const avatarPath = `${user.id}/`;
          await supabase.storage.from("avatars").remove([avatarPath]);
        }

        // Clear PII from student profile
        const { error: profileError } = await supabase
          .from("student_profiles")
          .update({
            phone: null,
            date_of_birth: null,
            avatar_url: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (profileError) {
          console.error("Error clearing student profile:", profileError);
        }
      }
    } else if (userRole === "business") {
      // Get business profile
      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("id, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (businessProfile) {
        // Close all open/in_progress issues
        const { error: closeError } = await supabase
          .from("issues")
          .update({ status: "closed", updated_at: new Date().toISOString() })
          .eq("business_id", businessProfile.id)
          .in("status", ["open", "in_progress", "in_progress_accepting", "in_progress_full"]);

        if (closeError) {
          console.error("Error closing issues:", closeError);
        }

        // Delete avatar from storage if exists
        if (businessProfile.avatar_url) {
          const avatarPath = `${user.id}/`;
          await supabase.storage.from("avatars").remove([avatarPath]);
        }

        // Clear PII from business profile
        const { error: profileError } = await supabase
          .from("business_profiles")
          .update({
            phone: null,
            address: null,
            avatar_url: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (profileError) {
          console.error("Error clearing business profile:", profileError);
        }
      }
    }

    // Delete chat attachments uploaded by this user
    const { data: attachments } = await supabase.storage
      .from("chat-attachments")
      .list(user.id);

    if (attachments && attachments.length > 0) {
      const filePaths = attachments.map((file) => `${user.id}/${file.name}`);
      await supabase.storage.from("chat-attachments").remove(filePaths);
    }

    // Update users table: clear email and set deleted_at
    const { error: deleteError } = await supabase
      .from("users")
      .update({
        email: `deleted_${user.id}@deleted.local`,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (deleteError) {
      console.error("Error marking user as deleted:", deleteError);
      return { error: "Failed to delete account. Please try again." };
    }

    // Sign out the user
    await supabase.auth.signOut();

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/issues");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err) {
    console.error("Error deleting account:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}









