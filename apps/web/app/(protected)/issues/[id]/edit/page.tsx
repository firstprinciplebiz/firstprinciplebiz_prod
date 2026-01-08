"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { issueSchema, type IssueInput, EXPERTISE_AREAS, COMPENSATION_TYPES } from "@repo/shared";
import { Button, Input, Textarea, Select, MultiSelect, Card } from "@/components/ui";
import { updateIssue } from "@/lib/issues/actions";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Lightbulb, DollarSign, Clock, Briefcase } from "lucide-react";
import Link from "next/link";

export default function EditIssuePage() {
  const router = useRouter();
  const params = useParams();
  const issueId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<IssueInput>({
    resolver: zodResolver(issueSchema),
  });

  const compensationType = watch("compensation_type");
  const selectedSkills = watch("required_skills") || [];

  useEffect(() => {
    async function fetchIssue() {
      const supabase = createClient();
      
      const { data: issue, error } = await supabase
        .from("issues")
        .select("*")
        .eq("id", issueId)
        .single();

      if (error || !issue) {
        router.push("/my-issues");
        return;
      }

      // Populate form with existing data
      reset({
        title: issue.title,
        description: issue.description,
        expectations: issue.expectations || "",
        compensation_type: issue.compensation_type,
        compensation_amount: issue.compensation_amount || undefined,
        duration_days: issue.duration_days || undefined,
        required_skills: issue.required_skills || [],
      });

      setIsLoading(false);
    }

    fetchIssue();
  }, [issueId, reset, router]);

  const onSubmit = async (data: IssueInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateIssue(issueId, data);
      
      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      router.push(`/issues/${issueId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
          <div className="h-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/issues/${issueId}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Issue
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Edit Issue</h1>
        <p className="text-slate-600 mt-2">
          Update your business challenge details.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Issue Details</h2>
              <p className="text-sm text-slate-600">What problem do you need help with?</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Issue Title"
              placeholder="e.g., Need help creating a social media strategy"
              error={errors.title?.message}
              {...register("title")}
            />

            <Textarea
              label="Description"
              placeholder="Describe your challenge in detail..."
              rows={6}
              error={errors.description?.message}
              {...register("description")}
            />

            <Textarea
              label="Expectations (Optional)"
              placeholder="What specific deliverables or outcomes are you expecting?"
              rows={4}
              error={errors.expectations?.message}
              {...register("expectations")}
            />
          </div>
        </Card>

        {/* Skills Required */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Required Skills</h2>
              <p className="text-sm text-slate-600">What expertise are you looking for?</p>
            </div>
          </div>

          <MultiSelect
            label="Select Skills"
            options={EXPERTISE_AREAS.map((skill) => ({ value: skill, label: skill }))}
            value={selectedSkills}
            onChange={(skills) => setValue("required_skills", skills)}
            placeholder="Select required skills..."
          />
        </Card>

        {/* Compensation */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Compensation</h2>
              <p className="text-sm text-slate-600">How will you compensate the student?</p>
            </div>
          </div>

          <div className="space-y-4">
            <Select
              label="Compensation Type"
              error={errors.compensation_type?.message}
              {...register("compensation_type")}
            >
              {COMPENSATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>

            {compensationType === "paid" && (
              <Input
                label="Amount (USD)"
                type="number"
                placeholder="e.g., 500"
                error={errors.compensation_amount?.message}
                {...register("compensation_amount", { valueAsNumber: true })}
              />
            )}
          </div>
        </Card>

        {/* Timeline */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
              <p className="text-sm text-slate-600">How long do you expect this to take?</p>
            </div>
          </div>

          <Input
            label="Estimated Duration (Days)"
            type="number"
            placeholder="e.g., 14"
            error={errors.duration_days?.message}
            {...register("duration_days", { valueAsNumber: true })}
          />
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}












