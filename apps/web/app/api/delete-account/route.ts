import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Get the user's session using the regular client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to delete your account" },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    // Use admin client for elevated operations
    const adminClient = createAdminClient();

    // Get user role
    const { data: userData, error: userError } = await adminClient
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    const userRole = userData.role;

    // Handle role-specific cleanup
    if (userRole === "student") {
      // Get student profile
      const { data: studentProfile } = await adminClient
        .from("student_profiles")
        .select("id, avatar_url")
        .eq("user_id", userId)
        .single();

      if (studentProfile) {
        // Auto-reject all pending applications
        await adminClient
          .from("issue_interests")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("student_id", studentProfile.id)
          .eq("status", "pending");

        // Delete avatar from storage if exists
        if (studentProfile.avatar_url) {
          const { data: avatarFiles } = await adminClient.storage
            .from("avatars")
            .list(userId);
          if (avatarFiles && avatarFiles.length > 0) {
            const filePaths = avatarFiles.map((file) => `${userId}/${file.name}`);
            await adminClient.storage.from("avatars").remove(filePaths);
          }
        }

        // Clear PII from student profile
        await adminClient
          .from("student_profiles")
          .update({
            phone: null,
            date_of_birth: null,
            avatar_url: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    } else if (userRole === "business") {
      // Get business profile
      const { data: businessProfile } = await adminClient
        .from("business_profiles")
        .select("id, avatar_url")
        .eq("user_id", userId)
        .single();

      if (businessProfile) {
        // Close all open/in_progress issues
        await adminClient
          .from("issues")
          .update({ status: "closed", updated_at: new Date().toISOString() })
          .eq("business_id", businessProfile.id)
          .in("status", ["open", "in_progress", "in_progress_accepting", "in_progress_full"]);

        // Auto-reject all pending applications for this business's issues
        const { data: businessIssues } = await adminClient
          .from("issues")
          .select("id")
          .eq("business_id", businessProfile.id);

        if (businessIssues && businessIssues.length > 0) {
          const issueIds = businessIssues.map((i) => i.id);
          await adminClient
            .from("issue_interests")
            .update({ status: "rejected", updated_at: new Date().toISOString() })
            .in("issue_id", issueIds)
            .eq("status", "pending");
        }

        // Delete avatar from storage if exists
        if (businessProfile.avatar_url) {
          const { data: avatarFiles } = await adminClient.storage
            .from("avatars")
            .list(userId);
          if (avatarFiles && avatarFiles.length > 0) {
            const filePaths = avatarFiles.map((file) => `${userId}/${file.name}`);
            await adminClient.storage.from("avatars").remove(filePaths);
          }
        }

        // Clear PII from business profile (including owner_name)
        await adminClient
          .from("business_profiles")
          .update({
            phone: null,
            address: null,
            avatar_url: null,
            owner_name: null, // Clear owner name for privacy
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }

    // Delete chat attachments uploaded by this user
    const { data: attachments } = await adminClient.storage
      .from("chat-attachments")
      .list(userId);

    if (attachments && attachments.length > 0) {
      const filePaths = attachments.map((file) => `${userId}/${file.name}`);
      await adminClient.storage.from("chat-attachments").remove(filePaths);
    }

    // Update users table: store original email and mark as deleted
    await adminClient
      .from("users")
      .update({
        email: `deleted_${userId}@deleted.local`,
        deleted_user_email: userEmail, // Store original email for record keeping
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // Update auth.users email to prevent login with original email
    // We use updateUserById instead of deleteUser to avoid CASCADE deletion
    const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(userId, {
      email: `deleted_${userId}@deleted.local`,
      email_confirm: true,
      password: crypto.randomUUID(), // Random password they can't know
    });

    if (updateAuthError) {
      console.error("Error updating auth user:", updateAuthError);
      // Even if auth update fails, the user data in public.users is marked as deleted
    }

    // Sign out the user from current session (the session will be invalidated anyway)
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Error deleting account:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}


