import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IssuesList } from "./IssuesList";
import { RealtimeRefresh } from "@/components/realtime/RealtimeRefresh";

// Force dynamic rendering to ensure filters work
export const dynamic = "force-dynamic";

interface SearchParams {
  page?: string;
  search?: string;
  compensation?: string;
  skills?: string;
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const compensation = params.compensation || "";
  const skills = params.skills ? params.skills.split(",") : [];

  // Build query
  const limit = 10;
  const offset = (page - 1) * limit;

  // Show issues that are either open or in_progress but still accepting students
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
    `, { count: "exact" })
    .in("status", ["open", "in_progress_accepting"]);

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (compensation) {
    query = query.eq("compensation_type", compensation);
  }

  if (skills.length > 0) {
    // Match issues that have any of the selected skills using JSONB containment
    // We need to check if any skill matches, so we use OR conditions
    const skillFilters = skills.map(skill => `required_skills.cs.["${skill}"]`).join(',');
    query = query.or(skillFilters);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: issues, count } = await query;

  const totalPages = Math.ceil((count || 0) / limit);

  // Get user's interests for marking applied issues
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  let appliedIssueIds: string[] = [];
  if (userData?.role === "student") {
    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (studentProfile) {
      const { data: interests } = await supabase
        .from("issue_interests")
        .select("issue_id")
        .eq("student_id", studentProfile.id);

      appliedIssueIds = interests?.map((i) => i.issue_id) || [];
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Real-time updates for issue list */}
      <RealtimeRefresh
        tables={[
          { name: "issues", event: "*" },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Browse Issues</h1>
        <p className="text-slate-600 mt-1">
          Find business challenges that match your skills and interests
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-8">Loading issues...</div>}>
        <IssuesList
          issues={issues || []}
          totalPages={totalPages}
          currentPage={page}
          appliedIssueIds={appliedIssueIds}
          initialSearch={search}
          initialCompensation={compensation}
          initialSkills={skills}
        />
      </Suspense>
    </div>
  );
}

