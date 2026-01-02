import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Search,
  PlusCircle,
  Users,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui";
import { RealtimeRefresh } from "@/components/realtime/RealtimeRefresh";

// Force dynamic rendering to ensure stats are always fresh
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user data and profile
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = userData?.role;

  // Get profile data
  let profile = null;
  if (role === "student") {
    const { data } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    profile = data;
  } else {
    const { data } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    profile = data;
  }

  // Get stats
  let stats = {
    issues: 0,
    interests: 0,
    issuesClosed: 0,
    inProgress: 0,
    approved: 0,
    interestedStudents: 0,
  };

  // Fetch recent issues for business dashboard
  let recentIssues: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    compensation_type: string;
  }> = [];

  // Fetch recent issues for student dashboard
  let studentRecentIssues: Array<{
    id: string;
    title: string;
    status: string;
    interest_status: string;
    updated_at: string;
  }> = [];

  if (role === "student" && profile) {
    const { count: interestCount } = await supabase
      .from("issue_interests")
      .select("*", { count: "exact", head: true })
      .eq("student_id", profile.id);
    stats.interests = interestCount || 0;

    // Count approved applications for this student
    const { count: approvedCount } = await supabase
      .from("issue_interests")
      .select("*", { count: "exact", head: true })
      .eq("student_id", profile.id)
      .eq("status", "approved");
    stats.approved = approvedCount || 0;

    // Get approved interests with their issue status
    const { data: approvedInterests } = await supabase
      .from("issue_interests")
      .select("issue_id, issues(status)")
      .eq("student_id", profile.id)
      .eq("status", "approved");

    if (approvedInterests) {
      // Count issues by status
      stats.issuesClosed = approvedInterests.filter((i) => {
        const issue = Array.isArray(i.issues) ? i.issues[0] : i.issues;
        return issue && (issue.status === "completed" || issue.status === "closed");
      }).length;
      stats.inProgress = approvedInterests.filter((i) => {
        const issue = Array.isArray(i.issues) ? i.issues[0] : i.issues;
        return issue && (issue.status === "in_progress_accepting" || issue.status === "in_progress_full");
      }).length;
    }

    // Fetch recent issues the student is involved in (closed or in progress)
    const { data: recentStudentInterests } = await supabase
      .from("issue_interests")
      .select("status, updated_at, issues(id, title, status)")
      .eq("student_id", profile.id)
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (recentStudentInterests) {
      studentRecentIssues = recentStudentInterests
        .filter((i) => i.issues)
        .map((i) => {
          const issue = Array.isArray(i.issues) ? i.issues[0] : i.issues;
          return {
            id: issue!.id,
            title: issue!.title,
            status: issue!.status,
            interest_status: i.status,
            updated_at: i.updated_at,
          };
        });
    }
  } else if (role === "business" && profile) {
    // Get all issues for this business with their stats
    const { data: businessIssues } = await supabase
      .from("issues")
      .select("id, status, title, created_at, compensation_type")
      .eq("business_id", profile.id)
      .order("created_at", { ascending: false });

    if (businessIssues) {
      stats.issues = businessIssues.length;
      stats.issuesClosed = businessIssues.filter(
        (i) => i.status === "completed" || i.status === "closed"
      ).length;
      stats.inProgress = businessIssues.filter(
        (i) => i.status === "in_progress_accepting" || i.status === "in_progress_full"
      ).length;

      // Store recent issues for display (limit to 5)
      recentIssues = businessIssues.slice(0, 5);

      // Get pending interests for this business's issues
      const issueIds = businessIssues.map((i) => i.id);
      if (issueIds.length > 0) {
        const { count: interestedCount } = await supabase
          .from("issue_interests")
          .select("*", { count: "exact", head: true })
          .in("issue_id", issueIds)
          .eq("status", "pending");
        stats.interestedStudents = interestedCount || 0;
      }
    }
  }

  const displayName = role === "student" 
    ? profile?.full_name 
    : profile?.owner_name;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Real-time updates for dashboard stats */}
      <RealtimeRefresh
        tables={[
          { name: "issues", event: "*" },
          { name: "issue_interests", event: "*" },
        ]}
      />

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {displayName?.split(" ")[0] || "there"}! 👋
        </h1>
        <p className="text-slate-600">
          {role === "student"
            ? "Browse open issues and find opportunities to apply your skills."
            : "Post your business challenges and connect with talented students."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {role === "student" ? (
          <>
            <Link href="/my-applications">
              <Card padding="md" hover className="flex items-center gap-4 cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-colors">
                  <FileText className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.interests}</p>
                  <p className="text-sm text-slate-600">Applications</p>
                </div>
              </Card>
            </Link>
            <Link href="/my-applications?status=approved">
              <Card padding="md" hover className="flex items-center gap-4 cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
                  <p className="text-sm text-slate-600">Applications Approved</p>
                </div>
              </Card>
            </Link>
            <Link href="/my-applications?status=closed">
              <Card padding="md" hover className="flex items-center gap-4 cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-green-100 group-hover:bg-green-500 flex items-center justify-center transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.issuesClosed}</p>
                  <p className="text-sm text-slate-600">Issues Closed</p>
                </div>
              </Card>
            </Link>
            <Link href="/my-applications?status=in_progress">
              <Card padding="md" hover className="flex items-center gap-4 cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-purple-100 group-hover:bg-purple-500 flex items-center justify-center transition-colors">
                  <Clock className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.inProgress}</p>
                  <p className="text-sm text-slate-600">In Progress</p>
                </div>
              </Card>
            </Link>
          </>
        ) : (
          <>
            <Card padding="md" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.issues}</p>
                <p className="text-sm text-slate-600">Posted Issues</p>
              </div>
            </Card>
            <Link href="/applicants">
              <Card padding="md" hover className="flex items-center gap-4 cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-amber-100 group-hover:bg-amber-500 flex items-center justify-center transition-colors">
                  <Users className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.interestedStudents}</p>
                  <p className="text-sm text-slate-600">Interested Students</p>
                </div>
              </Card>
            </Link>
            <Card padding="md" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.issuesClosed}</p>
                <p className="text-sm text-slate-600">Issues Closed</p>
              </div>
            </Card>
            <Card padding="md" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.inProgress}</p>
                <p className="text-sm text-slate-600">In Progress</p>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {role === "student" ? (
          <>
            <Link href="/issues">
              <Card hover padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-colors">
                      <Search className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Browse Issues</h3>
                      <p className="text-slate-600">Find business challenges to work on</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
            <Link href="/profile">
              <Card hover padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center transition-colors">
                      <Users className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Update Profile</h3>
                      <p className="text-slate-600">Keep your profile up to date</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
          </>
        ) : (
          <>
            <Link href="/issues/new">
              <Card hover padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-colors">
                      <PlusCircle className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Post New Issue</h3>
                      <p className="text-slate-600">Describe a challenge you need help with</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
            <Link href="/issues">
              <Card hover padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center transition-colors">
                      <Search className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">See What Others Are Posting</h3>
                      <p className="text-slate-600">Browse issues from other businesses</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          {role === "business" && recentIssues.length > 0 && (
            <Link href="/my-issues" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          )}
          {role === "student" && studentRecentIssues.length > 0 && (
            <Link href="/my-applications" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          )}
        </div>
        
        {role === "business" && recentIssues.length > 0 ? (
          <div className="space-y-3">
            {recentIssues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-primary/30 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate group-hover:text-primary transition-colors">
                    {issue.title}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Posted {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      issue.status === "open"
                        ? "bg-emerald-100 text-emerald-700"
                        : issue.status === "in_progress_accepting" || issue.status === "in_progress_full"
                        ? "bg-blue-100 text-blue-700"
                        : issue.status === "completed" || issue.status === "closed"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {issue.status === "open"
                      ? "Open"
                      : issue.status === "in_progress_accepting"
                      ? "In Progress"
                      : issue.status === "in_progress_full"
                      ? "Fully Staffed"
                      : issue.status === "completed"
                      ? "Completed"
                      : "Closed"}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">
                    {issue.compensation_type}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        ) : role === "student" && studentRecentIssues.length > 0 ? (
          <div className="space-y-3">
            {studentRecentIssues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-primary/30 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate group-hover:text-primary transition-colors">
                    {issue.title}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Updated {new Date(issue.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      issue.status === "open"
                        ? "bg-emerald-100 text-emerald-700"
                        : issue.status === "in_progress_accepting" || issue.status === "in_progress_full"
                        ? "bg-blue-100 text-blue-700"
                        : issue.status === "completed" || issue.status === "closed"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {issue.status === "open"
                      ? "Open"
                      : issue.status === "in_progress_accepting" || issue.status === "in_progress_full"
                      ? "In Progress"
                      : issue.status === "completed" || issue.status === "closed"
                      ? "Completed"
                      : issue.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No activity yet</h3>
            <p className="text-slate-600 mb-4">
              {role === "student"
                ? "Start by browsing available issues and expressing your interest."
                : "Post your first issue to start receiving applications from students."}
            </p>
            <Link
              href={role === "student" ? "/issues" : "/issues/new"}
              className="btn-primary inline-flex"
            >
              {role === "student" ? "Browse Issues" : "Post an Issue"}
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

