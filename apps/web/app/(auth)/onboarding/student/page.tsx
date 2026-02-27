"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, User, Phone, Building, BookOpen, Briefcase, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { studentProfileSchema, type StudentProfileInput } from "shared/validation";
import { DEGREE_LEVELS, EXPERTISE_AREAS } from "shared/constants";

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<StudentProfileInput>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      degree_level: "undergraduate",
      areas_of_interest: [],
      expertise: [],
      open_to_paid: true,
      open_to_voluntary: true,
    },
  });

  const selectedInterests = watch("areas_of_interest") || [];
  const selectedExpertise = watch("expertise") || [];

  const toggleInterest = (interest: string) => {
    const current = selectedInterests;
    if (current.includes(interest)) {
      setValue("areas_of_interest", current.filter((i) => i !== interest));
    } else {
      setValue("areas_of_interest", [...current, interest]);
    }
  };

  const toggleExpertise = (exp: string) => {
    const current = selectedExpertise;
    if (current.includes(exp)) {
      setValue("expertise", current.filter((e) => e !== exp));
    } else {
      setValue("expertise", [...current, exp]);
    }
  };

  const onSubmit = async (data: StudentProfileInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Create student profile
      const { error: profileError } = await supabase.from("student_profiles").insert({
        user_id: user.id,
        ...data,
      });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Update user record
      await supabase.from("users").update({
        profile_completed: true,
      }).eq("id", user.id);

      router.push("/dashboard");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Complete Your Student Profile
            </h1>
            <p className="text-slate-600">
              Tell us about yourself so businesses can find you
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    {...register("full_name")}
                    placeholder="John Doe"
                    className={`input ${errors.full_name ? "border-red-500" : ""}`}
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    {...register("phone")}
                    placeholder="+1234567890"
                    className={`input ${errors.phone ? "border-red-500" : ""}`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date of Birth
                </label>
                <input
                  {...register("date_of_birth")}
                  type="date"
                  className="input"
                />
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep(2)}>
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Education */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Education
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  University Name *
                </label>
                <input
                  {...register("university_name")}
                  placeholder="Harvard Business School"
                  className={`input ${errors.university_name ? "border-red-500" : ""}`}
                />
                {errors.university_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.university_name.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Degree Name *
                  </label>
                  <input
                    {...register("degree_name")}
                    placeholder="MBA"
                    className={`input ${errors.degree_name ? "border-red-500" : ""}`}
                  />
                  {errors.degree_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.degree_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Major *
                  </label>
                  <input
                    {...register("major")}
                    placeholder="Marketing"
                    className={`input ${errors.major ? "border-red-500" : ""}`}
                  />
                  {errors.major && (
                    <p className="mt-1 text-sm text-red-600">{errors.major.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Degree Level *
                </label>
                <select
                  {...register("degree_level")}
                  className="input"
                >
                  {DEGREE_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  {...register("bio")}
                  rows={3}
                  placeholder="Tell us about yourself, your interests, and what you're looking for..."
                  className="input resize-none"
                />
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  Previous
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Interests & Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Interests & Preferences
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Areas of Interest
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_AREAS.slice(0, 15).map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleInterest(area)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedInterests.includes(area)
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Your Expertise
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_AREAS.slice(0, 15).map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => toggleExpertise(exp)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedExpertise.includes(exp)
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Work Preferences
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("open_to_paid")}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-slate-700">I&apos;m open to paid opportunities</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("open_to_voluntary")}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-slate-700">I&apos;m open to voluntary/unpaid work</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  Previous
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Complete Profile
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}












