import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Building2, 
  Clock, 
  DollarSign, 
  Calendar,
  Briefcase,
  MapPin,
  CheckCircle
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { COMPENSATION_TYPES, ISSUE_STATUSES } from "shared";
import { ApplyButton } from "./ApplyButton";

export default async function IssueDetailPage({
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

  // Fetch issue with business details
  const { data: issue, error } = await supabase
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
        owner_name,
        address
      )
    `)
    .eq("id", id)
    .single();

  if (error || !issue) {
    notFound();
  }

  // Get user role and check if already applied
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isStudent = userData?.role === "student";
  const isOwner = issue.business.user_id === user.id;

  let existingInterest = null;
  let studentProfileId = null;

  if (isStudent) {
    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (studentProfile) {
      studentProfileId = studentProfile.id;
      
      const { data: interest } = await supabase
        .from("issue_interests")
        .select("*")
        .eq("issue_id", id)
        .eq("student_id", studentProfile.id)
        .single();

      existingInterest = interest;
    }
  }

  // Get interest count
  const { count: interestCount } = await supabase
    .from("issue_interests")
    .select("*", { count: "exact", head: true })
    .eq("issue_id", id);

  const getCompensationLabel = (type: string) => {
    const comp = COMPENSATION_TYPES.find((c) => c.value === type);
    return comp?.label || type;
  };

  const getStatusConfig = (status: string) => {
    return ISSUE_STATUSES.find((s) => s.value === status) || ISSUE_STATUSES[0];
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

  const statusConfig = getStatusConfig(issue.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        href={isOwner ? "/my-issues" : "/issues"}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {isOwner ? "Back to My Issues" : "Back to Issues"}
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card padding="lg">
            <div className="flex items-start gap-4 mb-4">
              <Link 
                href={`/profile/business/${issue.business.id}`}
                className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden relative flex-shrink-0 ring-2 ring-transparent hover:ring-primary transition-all"
              >
                {issue.business.avatar_url ? (
                  <Image
                    src={issue.business.avatar_url}
                    alt={issue.business.business_name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-slate-400" />
                  </div>
                )}
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900">{issue.title}</h1>
                  <Badge variant={mapColorToVariant(statusConfig.color)}>
                    {issue.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-slate-600">
                  <Link 
                    href={`/profile/business/${issue.business.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {issue.business.business_name}
                  </Link>
                  {" "}• {issue.business.industry}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100">
              <div>
                <p className="text-sm text-slate-500">Compensation</p>
                <p className="font-semibold text-slate-900">
                  {getCompensationLabel(issue.compensation_type)}
                  {issue.compensation_type === "paid" && issue.compensation_amount && (
                    <span className="text-emerald-600"> ${issue.compensation_amount}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Duration</p>
                <p className="font-semibold text-slate-900">
                  {issue.duration_days ? `${issue.duration_days} days` : "Flexible"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Posted</p>
                <p className="font-semibold text-slate-900">
                  {new Date(issue.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Applicants</p>
                <p className="font-semibold text-slate-900">{interestCount || 0}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4">
              {isOwner ? (
                <div className="flex gap-3">
                  <Link href={`/issues/${id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Edit Issue
                    </Button>
                  </Link>
                  <Link href={`/issues/${id}/applicants`} className="flex-1">
                    <Button className="w-full">
                      View Applicants ({interestCount || 0})
                    </Button>
                  </Link>
                </div>
              ) : isStudent ? (
                existingInterest ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">You've already applied!</p>
                      <p className="text-sm text-emerald-600">
                        Status: {existingInterest.status.charAt(0).toUpperCase() + existingInterest.status.slice(1)}
                      </p>
                    </div>
                  </div>
                ) : (issue.status === "open" || issue.status === "in_progress_accepting") && studentProfileId ? (
                  <ApplyButton issueId={id} studentProfileId={studentProfileId} />
                ) : (
                  <Button disabled className="w-full">
                    {issue.status !== "open" && issue.status !== "in_progress_accepting" 
                      ? "This issue is no longer accepting applications" 
                      : "Complete your profile to apply"}
                  </Button>
                )
              ) : null}
            </div>
          </Card>

          {/* Description */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Description</h2>
            <div className="prose prose-slate max-w-none">
              <p className="whitespace-pre-wrap text-slate-600">{issue.description}</p>
            </div>
          </Card>

          {/* Expectations */}
          {issue.expectations && (
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Expectations</h2>
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap text-slate-600">{issue.expectations}</p>
              </div>
            </Card>
          )}

          {/* Required Skills */}
          {issue.required_skills && issue.required_skills.length > 0 && (
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {issue.required_skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Business Info */}
          <Card padding="lg">
            <h3 className="font-semibold text-slate-900 mb-4">About the Business</h3>
            
            <Link 
              href={`/profile/business/${issue.business.id}`}
              className="flex items-center gap-3 mb-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative ring-2 ring-transparent group-hover:ring-primary transition-all">
                {issue.business.avatar_url ? (
                  <Image
                    src={issue.business.avatar_url}
                    alt={issue.business.business_name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900 group-hover:text-primary transition-colors">{issue.business.business_name}</p>
                <p className="text-sm text-slate-500">{issue.business.industry}</p>
              </div>
            </Link>

            {issue.business.business_description && (
              <p className="text-sm text-slate-600 mb-4 line-clamp-4">
                {issue.business.business_description}
              </p>
            )}

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Briefcase className="w-4 h-4" />
                <span>Owner: {issue.business.owner_name}</span>
              </div>
              {issue.business.address && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>{issue.business.address}</span>
                </div>
              )}
            </div>

            <Link
              href={`/profile/business/${issue.business.id}`}
              className="block w-full text-center py-2 px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-primary hover:text-primary transition-colors"
            >
              View Full Profile
            </Link>
          </Card>

          {/* Tips */}
          {isStudent && !existingInterest && (issue.status === "open" || issue.status === "in_progress_accepting") && (
            <Card padding="lg" className="bg-amber-50 border-amber-100">
              <h3 className="font-semibold text-amber-900 mb-2">Tips for Applying</h3>
              <ul className="text-sm text-amber-800 space-y-2">
                <li>• Write a personalized cover message</li>
                <li>• Highlight relevant experience</li>
                <li>• Show enthusiasm for the project</li>
                <li>• Ask clarifying questions if needed</li>
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}






