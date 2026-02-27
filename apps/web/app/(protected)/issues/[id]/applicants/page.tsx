import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, GraduationCap, Calendar, MessageSquare } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { INTEREST_STATUSES } from "@repo/shared";
import { ApplicantActions } from "./ApplicantActions";

export default async function IssueApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the issue and verify ownership
  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .select(`
      *,
      business:business_profiles!inner(
        id,
        user_id,
        business_name
      )
    `)
    .eq("id", id)
    .single();

  if (issueError || !issue) {
    notFound();
  }

  if (issue.business.user_id !== user.id) {
    redirect("/dashboard");
  }

  // Get all applicants
  const { data: applicants } = await supabase
    .from("issue_interests")
    .select(`
      *,
      student:student_profiles!inner(
        id,
        user_id,
        full_name,
        avatar_url,
        university_name,
        degree_name,
        major,
        bio,
        expertise
      )
    `)
    .eq("issue_id", id)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false });

  const getStatusConfig = (status: string) => {
    return INTEREST_STATUSES.find((s) => s.value === status) || INTEREST_STATUSES[0];
  };

  const mapColorToVariant = (color: string): "default" | "primary" | "success" | "warning" | "danger" => {
    const colorMap: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
      amber: "warning",
      emerald: "success",
      blue: "primary",
      red: "danger",
      slate: "default",
    };
    return colorMap[color] || "default";
  };

  // Group applicants by status
  const pendingApplicants = applicants?.filter((a) => a.status === "pending") || [];
  const approvedApplicants = applicants?.filter((a) => a.status === "approved") || [];
  const rejectedApplicants = applicants?.filter((a) => a.status === "rejected") || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <Link
        href={`/issues/${id}`}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Issue
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Applicants</h1>
        <p className="text-slate-600 mt-1">
          Manage applications for: <span className="font-medium">{issue.title}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card padding="md" className="text-center">
          <p className="text-3xl font-bold text-amber-600">{pendingApplicants.length}</p>
          <p className="text-sm text-slate-600">Pending</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-3xl font-bold text-emerald-600">{approvedApplicants.length}</p>
          <p className="text-sm text-slate-600">Approved</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-3xl font-bold text-slate-600">{rejectedApplicants.length}</p>
          <p className="text-sm text-slate-600">Rejected</p>
        </Card>
      </div>

      {/* Applicants List */}
      {(!applicants || applicants.length === 0) ? (
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No applicants yet</h3>
          <p className="text-slate-600">
            Check back later or share your issue to attract students.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {applicants.map((applicant) => {
            const statusConfig = getStatusConfig(applicant.status);
            
            return (
              <Card key={applicant.id} padding="lg">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden relative">
                      {applicant.student.avatar_url ? (
                        <Image
                          src={applicant.student.avatar_url}
                          alt={applicant.student.full_name}
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
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {applicant.student.full_name}
                          </h3>
                          <Badge variant={mapColorToVariant(statusConfig.color)}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            {applicant.student.university_name}
                          </span>
                          <span>{applicant.student.degree_name} in {applicant.student.major}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {applicant.student.bio && (
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {applicant.student.bio}
                      </p>
                    )}

                    {/* Skills */}
                    {applicant.student.expertise && applicant.student.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {applicant.student.expertise.slice(0, 4).map((skill: string) => (
                          <span
                            key={skill}
                            className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-600"
                          >
                            {skill}
                          </span>
                        ))}
                        {applicant.student.expertise.length > 4 && (
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-500">
                            +{applicant.student.expertise.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Cover Message */}
                    {applicant.cover_message && (
                      <div className="bg-slate-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                          <MessageSquare className="w-4 h-4" />
                          Cover Message
                        </div>
                        <p className="text-sm text-slate-700">{applicant.cover_message}</p>
                      </div>
                    )}

                    {/* Meta & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        Applied {new Date(applicant.created_at).toLocaleDateString()}
                      </span>
                      
                      {applicant.status === "pending" && (
                        <ApplicantActions interestId={applicant.id} />
                      )}
                    </div>
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










