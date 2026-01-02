"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, User, Phone, MapPin, Briefcase, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { businessProfileSchema, type BusinessProfileInput } from "shared/validation";
import { INDUSTRIES, EXPERTISE_AREAS } from "shared/constants";

export default function BusinessOnboardingPage() {
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
  } = useForm<BusinessProfileInput>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      industry: "Retail",
      looking_for: [],
    },
  });

  const selectedLookingFor = watch("looking_for") || [];

  const toggleLookingFor = (skill: string) => {
    const current = selectedLookingFor;
    if (current.includes(skill as typeof current[number])) {
      setValue("looking_for", current.filter((s) => s !== skill));
    } else {
      setValue("looking_for", [...current, skill as typeof current[number]]);
    }
  };

  const onSubmit = async (data: BusinessProfileInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Create business profile
      const { error: profileError } = await supabase.from("business_profiles").insert({
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
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Complete Your Business Profile
            </h1>
            <p className="text-slate-600">
              Tell us about your business so students can find you
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? "bg-emerald-500" : "bg-slate-200"
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
          {/* Step 1: Owner & Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Owner & Business Information
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    {...register("owner_name")}
                    placeholder="John Smith"
                    className={`input ${errors.owner_name ? "border-red-500" : ""}`}
                  />
                  {errors.owner_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.owner_name.message}</p>
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
                  Business Name *
                </label>
                <input
                  {...register("business_name")}
                  placeholder="Acme Coffee Shop"
                  className={`input ${errors.business_name ? "border-red-500" : ""}`}
                />
                {errors.business_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Industry *
                  </label>
                  <select
                    {...register("industry")}
                    className="input"
                  >
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Business Age (Years)
                  </label>
                  <input
                    {...register("business_age_years", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="5"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Address
                </label>
                <input
                  {...register("address")}
                  placeholder="123 Main St, City, Country"
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

          {/* Step 2: Description & Needs */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                About Your Business
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Description
                </label>
                <textarea
                  {...register("business_description")}
                  rows={4}
                  placeholder="Tell us about your business, what you do, your goals, and any challenges you're facing..."
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  What kind of help are you looking for?
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_AREAS.slice(0, 15).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleLookingFor(skill)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedLookingFor.includes(skill as typeof selectedLookingFor[number])
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
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










