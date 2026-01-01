import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin, Calendar, Briefcase, Globe, FileText, ArrowRight } from "lucide-react";
import { Card, Badge, GoBackButton } from "@/components/ui";

export default async function BusinessProfilePage({
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

  // Fetch business profile by profile ID or user ID
  let profile = null;
  let error = null;

  // First try to find by profile ID
  const { data: profileById, error: errorById } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (profileById) {
    profile = profileById;
  } else {
    // If not found, try by user_id
    const { data: profileByUserId, error: errorByUserId } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("user_id", id)
      .single();
    
    profile = profileByUserId;
    error = errorByUserId;
  }

  if (error || !profile) {
    notFound();
  }

  // Fetch all issues posted by this business
  const { data: businessIssues } = await supabase
    .from("issues")
    .select("id, title, status, compensation_type, created_at")
    .eq("business_id", profile.id)
    .order("created_at", { ascending: false });

  // Calculate business age in years
  const getBusinessAge = () => {
    if (!profile.business_age) return null;
    const years = profile.business_age;
    if (years < 1) return "Less than 1 year";
    if (years === 1) return "1 year";
    return `${years} years`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return { label: "Open", className: "bg-emerald-100 text-emerald-700" };
      case "in_progress_accepting":
        return { label: "In Progress", className: "bg-blue-100 text-blue-700" };
      case "in_progress_full":
        return { label: "Fully Staffed", className: "bg-blue-100 text-blue-700" };
      case "completed":
        return { label: "Completed", className: "bg-green-100 text-green-700" };
      case "closed":
        return { label: "Closed", className: "bg-slate-100 text-slate-600" };
      default:
        return { label: status, className: "bg-slate-100 text-slate-600" };
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <GoBackButton className="mb-6" />

      {/* Profile Header */}
      <Card padding="lg" className="mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-xl bg-slate-100 overflow-hidden relative flex-shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.business_name || "Business"}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-14 h-14 text-slate-400" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {profile.business_name || "Business"}
            </h1>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-slate-600">
              {profile.industry && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  {profile.industry}
                </span>
              )}
              {profile.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {profile.address}
                </span>
              )}
            </div>

            {profile.owner_name && (
              <p className="mt-2 text-slate-600">
                Owner: <span className="font-medium text-slate-900">{profile.owner_name}</span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Business Description */}
      {profile.business_description && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">About the Business</h2>
          <p className="text-slate-600 whitespace-pre-wrap">{profile.business_description}</p>
        </Card>
      )}

      {/* Business Details */}
      <Card padding="lg" className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Business Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {profile.industry && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Industry</p>
                <p className="font-medium text-slate-900">{profile.industry}</p>
              </div>
            </div>
          )}
          {getBusinessAge() && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Business Age</p>
                <p className="font-medium text-slate-900">{getBusinessAge()}</p>
              </div>
            </div>
          )}
          {profile.address && (
            <div className="flex items-center gap-3 sm:col-span-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-medium text-slate-900">{profile.address}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Looking For */}
      {profile.looking_for && profile.looking_for.length > 0 && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Looking For</h2>
          <p className="text-slate-600 mb-3">This business is looking for help in:</p>
          <div className="flex flex-wrap gap-2">
            {profile.looking_for.map((skill: string) => (
              <Badge key={skill} variant="primary">
                {skill}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Current Issues Description */}
      {profile.current_issues && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Current Challenges</h2>
          <p className="text-slate-600 whitespace-pre-wrap">{profile.current_issues}</p>
        </Card>
      )}

      {/* Posted Issues */}
      {businessIssues && businessIssues.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-slate-900">Posted Issues ({businessIssues.length})</h2>
          </div>
          <div className="space-y-3">
            {businessIssues.map((issue) => {
              const statusInfo = getStatusLabel(issue.status);
              return (
                <Link
                  key={issue.id}
                  href={`/issues/${issue.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-primary/30 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900 truncate group-hover:text-primary transition-colors">
                        {issue.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Posted {new Date(issue.created_at).toLocaleDateString()} • {issue.compensation_type}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

