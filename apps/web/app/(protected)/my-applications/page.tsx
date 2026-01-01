import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";
import { Card, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

type ApplicationStatus = "all" | "pending" | "approved" | "rejected" | "in_progress" | "closed";

export default async function MyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is a student
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "student") {
    redirect("/dashboard");
  }

  // Get student profile (using same approach as dashboard)
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding/student");
  }

  const statusFilter = (params.status as ApplicationStatus) || "all";

  // Build the query based on status filter
  let interestStatusFilter: string | null = null;
  if (statusFilter === "pending") {
    interestStatusFilter = "pending";
  } else if (statusFilter === "approved" || statusFilter === "in_progress" || statusFilter === "closed") {
    interestStatusFilter = "approved";
  } else if (statusFilter === "rejected") {
    interestStatusFilter = "rejected";
  }

  // Fetch all applications with issue details
  let applicationsQuery = supabase
    .from("issue_interests")
    .select(`
      id,
      status,
      cover_message,
      created_at,
      updated_at,
      issues(
        id,
        title,
        status,
        compensation_type,
        business_id
      )
    `)
    .eq("student_id", profile.id);
  
  // Add status filter if needed
  if (interestStatusFilter) {
    applicationsQuery = applicationsQuery.eq("status", interestStatusFilter);
  }
  
  // Add ordering
  applicationsQuery = applicationsQuery.order("created_at", { ascending: false });

  const { data: applications } = await applicationsQuery;

  // Fetch business names for each issue
  const businessIds = [...new Set(
    (applications || [])
      .filter(app => app.issues?.business_id)
      .map(app => app.issues!.business_id)
  )];
  
  let businessMap: Record<string, string> = {};
  if (businessIds.length > 0) {
    const { data: businesses } = await supabase
      .from("business_profiles")
      .select("id, business_name")
      .in("id", businessIds);
    
    if (businesses) {
      businessMap = Object.fromEntries(
        businesses.map(b => [b.id, b.business_name])
      );
    }
  }

  // Filter by issue status if needed
  let filteredApplications = applications || [];
  if (statusFilter === "in_progress") {
    filteredApplications = filteredApplications.filter(
      (app) => app.issues && 
      (app.issues.status === "in_progress_accepting" || app.issues.status === "in_progress_full")
    );
  } else if (statusFilter === "closed") {
    filteredApplications = filteredApplications.filter(
      (app) => app.issues && 
      (app.issues.status === "completed" || app.issues.status === "closed")
    );
  }

  const getStatusBadge = (appStatus: string, issueStatus: string) => {
    if (appStatus === "pending") {
      return <Badge variant="warning">Pending</Badge>;
    } else if (appStatus === "rejected") {
      return <Badge variant="danger">Rejected</Badge>;
    } else if (appStatus === "approved") {
      if (issueStatus === "completed" || issueStatus === "closed") {
        return <Badge variant="success">Completed</Badge>;
      } else if (issueStatus === "in_progress_accepting" || issueStatus === "in_progress_full") {
        return <Badge variant="primary">In Progress</Badge>;
      }
      return <Badge variant="success">Approved</Badge>;
    }
    return <Badge>{appStatus}</Badge>;
  };

  const getPageTitle = () => {
    switch (statusFilter) {
      case "pending":
        return "Pending Applications";
      case "approved":
        return "Approved Applications";
      case "rejected":
        return "Rejected Applications";
      case "in_progress":
        return "Issues In Progress";
      case "closed":
        return "Completed Issues";
      default:
        return "My Applications";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{getPageTitle()}</h1>
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "in_progress", label: "In Progress" },
            { value: "closed", label: "Completed" },
            { value: "rejected", label: "Rejected" },
          ].map((filter) => (
            <Link
              key={filter.value}
              href={`/my-applications${filter.value !== "all" ? `?status=${filter.value}` : ""}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === filter.value
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No applications found</h3>
          <p className="text-slate-600 mb-4">
            {statusFilter === "all"
              ? "You haven't applied to any issues yet."
              : `No ${statusFilter.replace("_", " ")} applications found.`}
          </p>
          <Link
            href="/issues"
            className="btn-primary inline-flex"
          >
            Browse Issues
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Link
              key={application.id}
              href={`/issues/${application.issues?.id}`}
              className="block"
            >
              <Card padding="md" hover className="group cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 truncate group-hover:text-primary transition-colors">
                        {application.issues?.title || "Issue"}
                      </h3>
                      {getStatusBadge(application.status, application.issues?.status || "")}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {(application.issues?.business_id && businessMap[application.issues.business_id]) || "Business"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Applied {new Date(application.created_at).toLocaleDateString()}
                      </span>
                      <span className="capitalize">
                        {application.issues?.compensation_type || "N/A"}
                      </span>
                    </div>
                    {application.cover_message && (
                      <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                        &ldquo;{application.cover_message}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {application.status === "approved" ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : application.status === "rejected" ? (
                      <XCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <Clock className="w-6 h-6 text-amber-500" />
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

