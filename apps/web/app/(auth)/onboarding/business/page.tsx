"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, User, Briefcase, CheckCircle2, MapPin, Gift } from "lucide-react";
import { Button, PhoneInput, AvatarUpload } from "@/components/ui";
import { isValidPhoneNumber } from "@/components/ui/PhoneInput";
import { createClient } from "@/lib/supabase/client";
import { businessProfileSchema, type BusinessProfileInput } from "shared/validation";
import { INDUSTRIES, EXPERTISE_AREAS } from "shared/constants";

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount for avatar upload
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
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

  // Handle phone input changes
  const handlePhoneChange = useCallback((value: string) => {
    setValue("phone", value);
  }, [setValue]);

  // Validate step 1 before proceeding
  const validateStep1 = () => {
    setStepError(null);
    const values = getValues();
    
    // Check owner name
    if (!values.owner_name || values.owner_name.trim().length < 2) {
      setStepError("Owner name is required (minimum 2 characters)");
      return false;
    }
    
    // Check phone - must be exactly 10 digits after country code
    if (!values.phone || !isValidPhoneNumber(values.phone)) {
      setStepError("Phone number is required (exactly 10 digits)");
      return false;
    }
    
    // Check business name
    if (!values.business_name || values.business_name.trim().length < 2) {
      setStepError("Business name is required");
      return false;
    }
    
    // Check industry
    if (!values.industry) {
      setStepError("Industry is required");
      return false;
    }
    
    // Check business age
    if (values.business_age_years === undefined || values.business_age_years === null || values.business_age_years < 0) {
      setStepError("Business age is required");
      return false;
    }
    
    // Check address
    if (!values.address || values.address.trim().length < 5) {
      setStepError("Business address is required");
      return false;
    }
    
    // Check city
    if (!values.city || values.city.trim().length < 2) {
      setStepError("City is required");
      return false;
    }
    
    return true;
  };

  // Validate step 2 before submitting
  const validateStep2 = () => {
    setStepError(null);
    const values = getValues();
    
    if (!values.business_description || values.business_description.trim().length < 25) {
      setStepError("Business description is required (minimum 25 characters)");
      return false;
    }
    
    if (!values.looking_for || values.looking_for.length === 0) {
      setStepError("Please select at least one type of help you're looking for");
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      const isValid = validateStep1();
      if (!isValid) return;
    }
    setStepError(null);
    setStep(2);
  };

  const onSubmit = async (data: BusinessProfileInput) => {
    // Validate step 2 first
    if (!validateStep2()) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Generate a unique referral code for this user (simple 6-char alphanumeric)
      const { data: referralData } = await supabase.rpc('generate_referral_code');
      const newReferralCode = referralData || user.id.slice(0, 6).toUpperCase();

      // Create business profile
      const { error: profileError } = await supabase.from("business_profiles").insert({
        user_id: user.id,
        ...data,
        avatar_url: avatarUrl,
        referral_code: newReferralCode,
        referred_by_code: referralCode || null,
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

        {/* Error messages */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        {stepError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            {stepError}
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Owner Name <span className="text-red-500">*</span>
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
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  value={watch("phone") || ""}
                  onChange={handlePhoneChange}
                  error={!!errors.phone}
                  placeholder="1234567890"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Name <span className="text-red-500">*</span>
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
                    Industry <span className="text-red-500">*</span>
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
                    Business Age (Years) <span className="text-red-500">*</span>
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
                  Business Address <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("address")}
                  placeholder="123 Main St, Suite 100"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("city")}
                  placeholder="New York"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Gift className="w-4 h-4 inline mr-1" />
                  Referral Code
                  <span className="text-slate-500 font-normal"> (Optional)</span>
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="Enter referral code (e.g., A3B7X9)"
                  className="input"
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-slate-500">
                  If someone referred you, enter their code here
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={handleNextStep}>
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
                About Your Business & Logo
              </h2>

              {/* Profile/Logo Upload */}
              {userId && (
                <div className="flex flex-col items-center py-4">
                  <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                    Business Logo / Photo
                    <span className="text-slate-500 font-normal"> (Optional)</span>
                  </label>
                  <AvatarUpload
                    currentAvatarUrl={avatarUrl}
                    onUploadComplete={(url) => setAvatarUrl(url)}
                    onRemove={() => setAvatarUrl(null)}
                    userId={userId}
                    size="lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Description <span className="text-red-500">*</span>
                  <span className="text-slate-500 font-normal"> (Minimum 25 characters)</span>
                </label>
                <textarea
                  {...register("business_description")}
                  rows={4}
                  placeholder="Tell us about your business, what you do, your goals, and any challenges you're facing..."
                  className="input resize-none"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {(watch("business_description") || "").length}/25 characters minimum
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  What kind of help are you looking for? <span className="text-red-500">*</span>
                  <span className="text-slate-500 font-normal"> (Select at least one)</span>
                </label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl">
                  {EXPERTISE_AREAS.map((skill) => (
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
                <p className="mt-1 text-xs text-slate-500">
                  {selectedLookingFor.length} selected
                </p>
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
