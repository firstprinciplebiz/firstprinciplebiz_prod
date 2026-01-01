import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, GraduationCap, BookOpen, Briefcase, Calendar, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, Badge, GoBackButton } from "@/components/ui";

export default async function StudentProfilePage({
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

  // Fetch student profile by profile ID or user ID
  let profile = null;
  let error = null;

  // First try to find by profile ID
  const { data: profileById, error: errorById } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (profileById) {
    profile = profileById;
  } else {
    // If not found, try by user_id
    const { data: profileByUserId, error: errorByUserId } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", id)
      .single();
    
    profile = profileByUserId;
    error = errorByUserId;
  }

  if (error || !profile) {
    notFound();
  }

  // Fetch completed issues for this student
  const { data: completedIssues } = await supabase
    .from("issue_interests")
    .select(`
      id,
      updated_at,
      issues(
        id,
        title,
        status,
        compensation_type,
        business_profiles(business_name)
      )
    `)
    .eq("student_id", profile.id)
    .eq("status", "approved")
    .order("updated_at", { ascending: false });

  // Filter to only show completed/closed issues
  const completedIssuesList = (completedIssues || [])
    .filter((i) => i.issues && (i.issues.status === "completed" || i.issues.status === "closed"))
    .slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <GoBackButton className="mb-6" />

      {/* Profile Header */}
      <Card padding="lg" className="mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full bg-slate-100 overflow-hidden relative flex-shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name || "Student"}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-14 h-14 text-slate-400" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {profile.full_name || "Student"}
            </h1>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                {profile.university_name || <span className="text-slate-400 italic">University not specified</span>}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {profile.degree_name || <span className="text-slate-400 italic">Degree not specified</span>}
              </span>
            </div>

            <p className="mt-2 text-slate-600">
              Major: <span className="font-medium text-slate-900">
                {profile.major || <span className="text-slate-400 italic font-normal">Not specified</span>}
              </span>
            </p>
            
            {profile.degree_level && (
              <p className="mt-1 text-sm text-slate-500 capitalize">
                {profile.degree_level} program
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Bio */}
      <Card padding="lg" className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">About</h2>
        {profile.bio ? (
          <p className="text-slate-600 whitespace-pre-wrap">{profile.bio}</p>
        ) : (
          <p className="text-slate-400 italic">Not specified</p>
        )}
      </Card>

      {/* Expertise */}
      <Card padding="lg" className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Expertise</h2>
        {profile.expertise && profile.expertise.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.expertise.map((area: string) => (
              <Badge key={area} variant="primary">
                {area}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 italic">Not specified</p>
        )}
      </Card>

      {/* Areas of Interest */}
      <Card padding="lg" className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Areas of Interest</h2>
        {profile.areas_of_interest && profile.areas_of_interest.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.areas_of_interest.map((interest: string) => (
              <Badge key={interest} variant="primary">
                {interest}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 italic">Not specified</p>
        )}
      </Card>

      {/* Work Preferences */}
      <Card padding="lg" className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Work Preferences</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Open to Paid Work</p>
              <p className="font-medium text-slate-900">
                {profile.open_to_paid ? "Yes" : "No"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Open to Voluntary Work</p>
              <p className="font-medium text-slate-900">
                {profile.open_to_voluntary ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Completed Issues */}
      {completedIssuesList.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">Completed Projects</h2>
          </div>
          <div className="space-y-3">
            {completedIssuesList.map((item) => (
              <Link
                key={item.id}
                href={`/issues/${item.issues?.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-primary/30 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate group-hover:text-primary transition-colors">
                    {item.issues?.title}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {item.issues?.business_profiles?.business_name} • {item.issues?.compensation_type}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

