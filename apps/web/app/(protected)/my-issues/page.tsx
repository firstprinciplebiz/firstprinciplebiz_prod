import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, FileText, Clock, CheckCircle2, XCircle, Users } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { ISSUE_STATUSES, COMPENSATION_TYPES } from "shared";
import { IssueStatusActions } from "./IssueStatusActions";
import { RealtimeRefresh } from "@/components/realtime/RealtimeRefresh";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function MyIssuesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is a business
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

  // Get issues with interest counts
  const { data: issues } = await supabase
    .from("issues")
    .select(`
      *,
      issue_interests(count)
    `)
    .eq("business_id", businessProfile.id)
    .order("created_at", { ascending: false });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <FileText className="w-4 h-4" />;
      case "in_progress_accepting":
        return <Users className="w-4 h-4" />;
      case "in_progress_full":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "closed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string): "default" | "primary" | "success" | "warning" | "danger" => {
    switch (status) {
      case "open":
        return "primary";
      case "in_progress_accepting":
        return "primary";
      case "in_progress_full":
        return "warning";
      case "completed":
        return "success";
      case "closed":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Open";
      case "in_progress_accepting":
        return "In Progress (Accepting)";
      case "in_progress_full":
        return "In Progress (Full)";
      case "completed":
        return "Completed";
      case "closed":
        return "Closed";
      default:
        return status;
    }
  };

  const getCompensationLabel = (type: string) => {
    const comp = COMPENSATION_TYPES.find((c) => c.value === type);
    return comp?.label || type;
  };

  // Group issues by status
  const openIssues = issues?.filter((i) => i.status === "open") || [];
  const inProgressIssues = issues?.filter((i) => i.status === "in_progress_accepting" || i.status === "in_progress_full") || [];
  const completedIssues = issues?.filter((i) => i.status === "completed" || i.status === "closed") || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Real-time updates for my issues */}
      <RealtimeRefresh
        tables={[
          { name: "issues", event: "*" },
          { name: "issue_interests", event: "*" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Issues</h1>
          <p className="text-slate-600 mt-1">
            Manage your posted business challenges
          </p>
        </div>
        <Link href="/issues/new">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Post New Issue
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card padding="md" className="text-center">
          <p className="text-3xl font-bold text-emerald-600">{openIssues.length}</p>
          <p className="text-sm text-slate-600">Open</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-3xl font-bold text-amber-600">{inProgressIssues.length}</p>
          <p className="text-sm text-slate-600">In Progress</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-3xl font-bold text-blue-600">{completedIssues.length}</p>
          <p className="text-sm text-slate-600">Completed</p>
        </Card>
      </div>

      {/* Issues List */}
      {(!issues || issues.length === 0) ? (
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No issues yet</h3>
          <p className="text-slate-600 mb-6">
            Post your first business challenge and connect with talented students.
          </p>
          <Link href="/issues/new">
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Post Your First Issue
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <Card key={issue.id} padding="lg" hover className="group">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Link 
                      href={`/issues/${issue.id}`}
                      className="text-lg font-semibold text-slate-900 hover:text-primary truncate"
                    >
                      {issue.title}
                    </Link>
                    <Badge variant={getStatusColor(issue.status)}>
                      {getStatusIcon(issue.status)}
                      <span className="ml-1">{getStatusLabel(issue.status)}</span>
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                    {issue.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {issue.issue_interests?.[0]?.count || 0} interested
                    </span>
                    <span>
                      {getCompensationLabel(issue.compensation_type)}
                      {issue.compensation_type === "paid" && issue.compensation_amount && 
                        ` - $${issue.compensation_amount}`}
                    </span>
                    {issue.duration_days && (
                      <span>{issue.duration_days} days</span>
                    )}
                    <span>
                      Posted {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 lg:ml-4">
                  <Link href={`/issues/${issue.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <Link href={`/issues/${issue.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <IssueStatusActions issueId={issue.id} currentStatus={issue.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

