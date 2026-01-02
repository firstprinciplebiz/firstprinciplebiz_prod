import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, Briefcase, Calendar, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui";
import { ApplicantActions } from "./ApplicantActions";
import { RealtimeRefresh } from "@/components/realtime/RealtimeRefresh";

export const dynamic = "force-dynamic";

export default async function ApplicantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify user is a business
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "business") {
    redirect("/dashboard");
  }

  // Get business profile
  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!businessProfile) {
    redirect("/onboarding/business");
  }

  // Get all issues for this business
  const { data: issues } = await supabase
    .from("issues")
    .select("id, title, status")
    .eq("business_id", businessProfile.id);

  if (!issues || issues.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Student Applications</h1>

        <Card padding="lg" className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No issues posted yet</h3>
          <p className="text-slate-600 mb-4">
            Post an issue to start receiving applications from students.
          </p>
          <Link href="/issues/new" className="btn-primary inline-flex">
            Post an Issue
          </Link>
        </Card>
      </div>
    );
  }

  const issueIds = issues.map((i) => i.id);

  // Get all pending interests for this business's issues with student details
  const { data: interests } = await supabase
    .from("issue_interests")
    .select(`
      id,
      status,
      message,
      created_at,
      issue_id,
      student_id,
      student_profiles!inner(
        id,
        full_name,
        avatar_url,
        university,
        degree,
        major,
        expertise_areas
      )
    `)
    .in("issue_id", issueIds)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Create a map of issue_id to issue data
  const issueMap = new Map(issues.map((i) => [i.id, i]));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Real-time updates for applications */}
      <RealtimeRefresh
        tables={[
          { name: "issue_interests", event: "*" },
        ]}
      />

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Applications</h1>
          <p className="text-slate-600 mt-1">
            Review and manage all pending applications from students
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{interests?.length || 0}</p>
          <p className="text-sm text-slate-600">Pending</p>
        </div>
      </div>

      {!interests || interests.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No pending applications</h3>
          <p className="text-slate-600">
            You don&apos;t have any pending student applications at the moment.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {interests.map((interest) => {
            const issue = issueMap.get(interest.issue_id);
            const student = Array.isArray(interest.student_profiles) 
                                      ? interest.student_profiles[0] 
                                      : interest.student_profiles;

            return (
              <Card key={interest.id} padding="lg" className="hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Student Avatar - Clickable */}
                  <Link href={`/profile/student/${student.id}`} className="flex-shrink-0 group">
                    <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden relative ring-2 ring-transparent group-hover:ring-primary transition-all">
                      {student.avatar_url ? (
                        <Image
                          src={student.avatar_url}
                          alt={student.full_name || "Student"}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <Link 
                          href={`/profile/student/${student.id}`}
                          className="text-lg font-semibold text-slate-900 hover:text-primary transition-colors"
                        >
                          {student.full_name || "Student"}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-1">
                          {student.university && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-4 h-4" />
                              {student.university}
                            </span>
                          )}
                          {student.degree && student.major && (
                            <span>• {student.degree} in {student.major}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        Applied {new Date(interest.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Issue Info */}
                    <Link
                      href={`/issues/${interest.issue_id}`}
                      className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span className="truncate max-w-xs">{issue?.title || "Issue"}</span>
                    </Link>

                    {/* Student Message */}
                    {interest.message && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 italic">&ldquo;{interest.message}&rdquo;</p>
                      </div>
                    )}

                    {/* Expertise Areas */}
                    {student.expertise_areas && student.expertise_areas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {student.expertise_areas.slice(0, 5).map((area: string) => (
                          <span
                            key={area}
                            className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                          >
                            {area}
                          </span>
                        ))}
                        {student.expertise_areas.length > 5 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                            +{student.expertise_areas.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 sm:ml-4">
                    <ApplicantActions interestId={interest.id} issueId={interest.issue_id} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

