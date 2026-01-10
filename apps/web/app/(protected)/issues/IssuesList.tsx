"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, X, ChevronLeft, ChevronRight, Building2, Clock, DollarSign, Briefcase, CheckCircle } from "lucide-react";
import { Card, Badge, Button, Input } from "@/components/ui";
import { EXPERTISE_AREAS, COMPENSATION_TYPES } from "shared";

interface Issue {
  id: string;
  title: string;
  description: string;
  compensation_type: string;
  compensation_amount: number | null;
  duration_days: number | null;
  required_skills: string[];
  created_at: string;
  business: {
    id: string;
    business_name: string;
    industry: string;
    avatar_url: string | null;
  };
}

interface IssuesListProps {
  issues: Issue[];
  totalPages: number;
  currentPage: number;
  appliedIssueIds: string[];
  initialSearch: string;
  initialCompensation: string;
  initialSkills: string[];
}

export function IssuesList({
  issues,
  totalPages,
  currentPage,
  appliedIssueIds,
  initialSearch,
  initialCompensation,
  initialSkills,
}: IssuesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(initialSearch);
  const [compensation, setCompensation] = useState(initialCompensation);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialSkills);
  const [showFilters, setShowFilters] = useState(false);

  const updateFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Reset to page 1 when filters change
    params.set("page", "1");
    
    router.push(`/issues?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handleCompensationChange = (value: string) => {
    setCompensation(value);
    updateFilters({ compensation: value });
  };

  const toggleSkill = (skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(newSkills);
    updateFilters({ skills: newSkills.join(",") });
  };

  const clearFilters = () => {
    setSearch("");
    setCompensation("");
    setSelectedSkills([]);
    router.push("/issues");
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/issues?${params.toString()}`);
  };

  const hasActiveFilters = search || compensation || selectedSkills.length > 0;

  const getCompensationLabel = (type: string) => {
    const comp = COMPENSATION_TYPES.find((c) => c.value === type);
    return comp?.label || type;
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Filters Sidebar */}
      <div className={`lg:w-72 flex-shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
        <Card padding="lg" className="sticky top-24">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Compensation Filter */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Compensation</h4>
            <div className="space-y-2">
              <button
                onClick={() => handleCompensationChange("")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !compensation ? "bg-primary/10 text-primary" : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                All
              </button>
              {COMPENSATION_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleCompensationChange(type.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    compensation === type.value
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Filter */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {EXPERTISE_AREAS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-2 py-1 rounded-full text-xs transition-colors ${
                    selectedSkills.includes(skill)
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issues..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <Button type="submit">Search</Button>
            <Button
              type="button"
              variant="outline"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-5 h-5" />
            </Button>
          </form>

          {/* Active Filters Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-700">
                  Search: {search}
                  <button onClick={() => { setSearch(""); updateFilters({ search: "" }); }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {compensation && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-700">
                  {getCompensationLabel(compensation)}
                  <button onClick={() => handleCompensationChange("")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-sm text-primary"
                >
                  {skill}
                  <button onClick={() => toggleSkill(skill)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Issues List */}
        {/* Filter out issues the student has already applied to */}
        {(() => {
          const filteredIssues = issues.filter((issue) => !appliedIssueIds.includes(issue.id));
          
          if (filteredIssues.length === 0) {
            return (
              <Card padding="lg" className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No issues found</h3>
                <p className="text-slate-600">
                  {hasActiveFilters
                    ? "Try adjusting your filters to find more issues."
                    : appliedIssueIds.length > 0
                    ? "You've already applied to all available issues. Check back later for new opportunities!"
                    : "Check back later for new opportunities!"}
                </p>
              </Card>
            );
          }
          
          return (
            <div className="space-y-4">
              {filteredIssues.map((issue) => {
                const hasApplied = appliedIssueIds.includes(issue.id);
                
                return (
                <Link key={issue.id} href={`/issues/${issue.id}`}>
                  <Card padding="lg" hover className="group cursor-pointer">
                    <div className="flex gap-4">
                      {/* Business Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative">
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
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors">
                              {issue.title}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {issue.business.business_name} • {issue.business.industry}
                            </p>
                          </div>
                          {hasApplied && (
                            <Badge variant="success">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Applied
                            </Badge>
                          )}
                        </div>

                        <p className="text-slate-600 mt-2 line-clamp-2">
                          {issue.description}
                        </p>

                        {/* Tags */}
                        {issue.required_skills && issue.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {issue.required_skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-600"
                              >
                                {skill}
                              </span>
                            ))}
                            {issue.required_skills.length > 4 && (
                              <span className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-500">
                                +{issue.required_skills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {getCompensationLabel(issue.compensation_type)}
                            {issue.compensation_type === "paid" && issue.compensation_amount && (
                              <span className="text-emerald-600 font-medium">
                                ${issue.compensation_amount}
                              </span>
                            )}
                          </span>
                          {issue.duration_days && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {issue.duration_days} days
                            </span>
                          )}
                          <span>{timeAgo(issue.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
            </div>
          );
        })()}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? "bg-primary text-white"
                        : "hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}










