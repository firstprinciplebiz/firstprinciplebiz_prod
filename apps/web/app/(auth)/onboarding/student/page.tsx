"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, User, BookOpen, Briefcase, CheckCircle2, Gift } from "lucide-react";
import { Button, PhoneInput, AvatarUpload } from "@/components/ui";
import { isValidPhoneNumber } from "@/components/ui/PhoneInput";
import { createClient } from "@/lib/supabase/client";
import { studentProfileSchema, type StudentProfileInput } from "shared/validation";
import { DEGREE_LEVELS, EXPERTISE_AREAS } from "shared/constants";

export default function StudentOnboardingPage() {
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
    trigger,
    getValues,
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
  const openToPaid = watch("open_to_paid");
  const openToVoluntary = watch("open_to_voluntary");

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

  // Handle phone input changes
  const handlePhoneChange = useCallback((value: string) => {
    setValue("phone", value);
  }, [setValue]);

  // Validate step 1 before proceeding
  const validateStep1 = async () => {
    setStepError(null);
    const values = getValues();
    
    // Check full name
    if (!values.full_name || values.full_name.trim().length < 2) {
      setStepError("Full name is required (minimum 2 characters)");
      return false;
    }
    
    // Check phone - must be exactly 10 digits after country code
    if (!values.phone || !isValidPhoneNumber(values.phone)) {
      setStepError("Phone number is required (exactly 10 digits)");
      return false;
    }
    
    // Check date of birth
    if (!values.date_of_birth) {
      setStepError("Date of birth is required");
      return false;
    }
    
    // Check age >= 18
    const dob = new Date(values.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    if (age < 18) {
      setStepError("You must be at least 18 years old to use this platform");
      return false;
    }
    
    return true;
  };

  // Validate step 2 before proceeding
  const validateStep2 = async () => {
    setStepError(null);
    const values = getValues();
    
    if (!values.university_name || values.university_name.trim().length < 2) {
      setStepError("University name is required");
      return false;
    }
    
    if (!values.degree_name || values.degree_name.trim().length < 2) {
      setStepError("Degree name is required");
      return false;
    }
    
    if (!values.major || values.major.trim().length < 2) {
      setStepError("Major is required");
      return false;
    }
    
    if (!values.degree_level) {
      setStepError("Degree level is required");
      return false;
    }
    
    if (!values.bio || values.bio.trim().length < 25) {
      setStepError("Bio is required (minimum 25 characters)");
      return false;
    }
    
    return true;
  };

  // Validate step 3 before submitting
  const validateStep3 = () => {
    setStepError(null);
    const values = getValues();
    
    if (!values.areas_of_interest || values.areas_of_interest.length === 0) {
      setStepError("Please select at least one area of interest");
      return false;
    }
    
    if (!values.expertise || values.expertise.length === 0) {
      setStepError("Please select at least one expertise area");
      return false;
    }
    
    if (!values.open_to_paid && !values.open_to_voluntary) {
      setStepError("Please select at least one work preference");
      return false;
    }
    
    return true;
  };

  const handleNextStep = async (nextStep: number) => {
    if (step === 1) {
      const isValid = await validateStep1();
      if (!isValid) return;
    } else if (step === 2) {
      const isValid = await validateStep2();
      if (!isValid) return;
    }
    setStepError(null);
    setStep(nextStep);
  };

  const onSubmit = async (data: StudentProfileInput) => {
    // Validate step 3 first
    if (!validateStep3()) return;

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

      // Create student profile
      const { error: profileError } = await supabase.from("student_profiles").insert({
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
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
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
                  Date of Birth <span className="text-red-500">*</span>
                  <span className="text-slate-500 font-normal"> (Must be 18+)</span>
                </label>
                <input
                  {...register("date_of_birth")}
                  type="date"
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
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
                <Button type="button" onClick={() => handleNextStep(2)}>
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
                Education & Profile Photo
              </h2>

              {/* Profile Photo Upload */}
              {userId && (
                <div className="flex flex-col items-center py-4">
                  <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                    Profile Photo
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
                  University Name <span className="text-red-500">*</span>
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
                    Degree Name <span className="text-red-500">*</span>
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
                    Major <span className="text-red-500">*</span>
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
                  Degree Level <span className="text-red-500">*</span>
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
                  Bio <span className="text-red-500">*</span>
                  <span className="text-slate-500 font-normal"> (Minimum 25 characters)</span>
                </label>
                <textarea
                  {...register("bio")}
                  rows={3}
                  placeholder="Tell us about yourself, your interests, and what you're looking for..."
                  className="input resize-none"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {(watch("bio") || "").length}/25 characters minimum
                </p>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  Previous
                </Button>
                <Button type="button" onClick={() => handleNextStep(3)}>
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
                  Areas of Interest <span className="text-red-500">*</span>
                  <span className="text-slate-500 font-normal"> (Select at least one)</span>
                </label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl">
                  {EXPERTISE_AREAS.map((area) => (
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
                <p className="mt-1 text-xs text-slate-500">
                  {selectedInterests.length} selected
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Your Expertise <span className="text-red-500">*</span>
                  <span className="text-slate-500 font-normal"> (Select at least one)</span>
                </label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl">
                  {EXPERTISE_AREAS.map((exp) => (
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
                <p className="mt-1 text-xs text-slate-500">
                  {selectedExpertise.length} selected
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Work Preferences <span className="text-red-500">*</span>
                  <span className="text-slate-500 font-normal"> (Select at least one)</span>
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
                {!openToPaid && !openToVoluntary && (
                  <p className="mt-2 text-sm text-amber-600">Please select at least one preference</p>
                )}
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
