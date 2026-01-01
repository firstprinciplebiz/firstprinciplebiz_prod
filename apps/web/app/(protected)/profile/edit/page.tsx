"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Textarea, Select, MultiSelect, AvatarUpload } from "@/components/ui";
import { DEGREE_LEVELS, INDUSTRIES, EXPERTISE_AREAS } from "shared/constants";

type UserRole = "student" | "business";

interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  university_name: string;
  degree_name: string;
  major: string;
  degree_level: string;
  bio: string | null;
  avatar_url: string | null;
  areas_of_interest: string[];
  expertise: string[];
  open_to_paid: boolean;
  open_to_voluntary: boolean;
}

interface BusinessProfile {
  id: string;
  user_id: string;
  owner_name: string;
  phone: string | null;
  business_name: string;
  business_description: string | null;
  industry: string;
  address: string | null;
  business_age_years: number | null;
  avatar_url: string | null;
  looking_for: string[];
}

export default function EditProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string>("");
  
  // Student form state
  const [studentProfile, setStudentProfile] = useState<Partial<StudentProfile>>({
    full_name: "",
    phone: "",
    date_of_birth: "",
    university_name: "",
    degree_name: "",
    major: "",
    degree_level: "undergraduate",
    bio: "",
    avatar_url: null,
    areas_of_interest: [],
    expertise: [],
    open_to_paid: true,
    open_to_voluntary: true,
  });

  // Business form state
  const [businessProfile, setBusinessProfile] = useState<Partial<BusinessProfile>>({
    owner_name: "",
    phone: "",
    business_name: "",
    business_description: "",
    industry: "Retail",
    address: "",
    business_age_years: undefined,
    avatar_url: null,
    looking_for: [],
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    // Get user role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData) {
      router.push("/onboarding");
      return;
    }

    setRole(userData.role);

    // Load profile based on role
    if (userData.role === "student") {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setStudentProfile({
          ...profile,
          date_of_birth: profile.date_of_birth || "",
          phone: profile.phone || "",
          bio: profile.bio || "",
        });
      }
    } else {
      const { data: profile } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setBusinessProfile({
          ...profile,
          phone: profile.phone || "",
          business_description: profile.business_description || "",
          address: profile.address || "",
        });
      }
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      if (role === "student") {
        const { error: updateError } = await supabase
          .from("student_profiles")
          .update({
            full_name: studentProfile.full_name,
            phone: studentProfile.phone || null,
            date_of_birth: studentProfile.date_of_birth || null,
            university_name: studentProfile.university_name,
            degree_name: studentProfile.degree_name,
            major: studentProfile.major,
            degree_level: studentProfile.degree_level,
            bio: studentProfile.bio || null,
            avatar_url: studentProfile.avatar_url,
            areas_of_interest: studentProfile.areas_of_interest,
            expertise: studentProfile.expertise,
            open_to_paid: studentProfile.open_to_paid,
            open_to_voluntary: studentProfile.open_to_voluntary,
          })
          .eq("user_id", userId);

        if (updateError) throw updateError;
      } else {
        const { error: updateError } = await supabase
          .from("business_profiles")
          .update({
            owner_name: businessProfile.owner_name,
            phone: businessProfile.phone || null,
            business_name: businessProfile.business_name,
            business_description: businessProfile.business_description || null,
            industry: businessProfile.industry,
            address: businessProfile.address || null,
            business_age_years: businessProfile.business_age_years || null,
            avatar_url: businessProfile.avatar_url,
            looking_for: businessProfile.looking_for,
          })
          .eq("user_id", userId);

        if (updateError) throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card padding="lg" className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Edit Profile</h1>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
          Profile saved successfully! Redirecting...
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <Card padding="lg">
        {/* Avatar Upload */}
        <div className="mb-8 flex justify-center">
          <AvatarUpload
            currentAvatarUrl={role === "student" ? studentProfile.avatar_url : businessProfile.avatar_url}
            userId={userId}
            onUploadComplete={(url) => {
              if (role === "student") {
                setStudentProfile((prev) => ({ ...prev, avatar_url: url }));
              } else {
                setBusinessProfile((prev) => ({ ...prev, avatar_url: url }));
              }
            }}
            onRemove={() => {
              if (role === "student") {
                setStudentProfile((prev) => ({ ...prev, avatar_url: null }));
              } else {
                setBusinessProfile((prev) => ({ ...prev, avatar_url: null }));
              }
            }}
          />
        </div>

        {/* Student Form */}
        {role === "student" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={studentProfile.full_name || ""}
                onChange={(e) => setStudentProfile((prev) => ({ ...prev, full_name: e.target.value }))}
              />
              <Input
                label="Phone Number"
                value={studentProfile.phone || ""}
                onChange={(e) => setStudentProfile((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                value={studentProfile.date_of_birth || ""}
                onChange={(e) => setStudentProfile((prev) => ({ ...prev, date_of_birth: e.target.value }))}
              />
              <Select
                label="Degree Level"
                value={studentProfile.degree_level || "undergraduate"}
                onChange={(e) => setStudentProfile((prev) => ({ ...prev, degree_level: e.target.value }))}
                options={DEGREE_LEVELS.map((d) => ({ value: d.value, label: d.label }))}
              />
            </div>

            <Input
              label="University Name"
              value={studentProfile.university_name || ""}
              onChange={(e) => setStudentProfile((prev) => ({ ...prev, university_name: e.target.value }))}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Degree Name"
                value={studentProfile.degree_name || ""}
                onChange={(e) => setStudentProfile((prev) => ({ ...prev, degree_name: e.target.value }))}
                placeholder="MBA, BCom, etc."
              />
              <Input
                label="Major"
                value={studentProfile.major || ""}
                onChange={(e) => setStudentProfile((prev) => ({ ...prev, major: e.target.value }))}
                placeholder="Marketing, Finance, etc."
              />
            </div>

            <Textarea
              label="Bio"
              value={studentProfile.bio || ""}
              onChange={(e) => setStudentProfile((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={4}
            />

            <MultiSelect
              label="Areas of Interest"
              options={EXPERTISE_AREAS.map((area) => ({ value: area, label: area }))}
              selected={studentProfile.areas_of_interest || []}
              onChange={(selected) => setStudentProfile((prev) => ({ ...prev, areas_of_interest: selected }))}
              maxItems={10}
            />

            <MultiSelect
              label="Your Expertise"
              options={EXPERTISE_AREAS.map((area) => ({ value: area, label: area }))}
              selected={studentProfile.expertise || []}
              onChange={(selected) => setStudentProfile((prev) => ({ ...prev, expertise: selected }))}
              maxItems={10}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Work Preferences
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={studentProfile.open_to_paid || false}
                    onChange={(e) => setStudentProfile((prev) => ({ ...prev, open_to_paid: e.target.checked }))}
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-slate-700">Open to paid opportunities</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={studentProfile.open_to_voluntary || false}
                    onChange={(e) => setStudentProfile((prev) => ({ ...prev, open_to_voluntary: e.target.checked }))}
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-slate-700">Open to voluntary work</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Business Form */}
        {role === "business" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Your Name"
                value={businessProfile.owner_name || ""}
                onChange={(e) => setBusinessProfile((prev) => ({ ...prev, owner_name: e.target.value }))}
              />
              <Input
                label="Phone Number"
                value={businessProfile.phone || ""}
                onChange={(e) => setBusinessProfile((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>

            <Input
              label="Business Name"
              value={businessProfile.business_name || ""}
              onChange={(e) => setBusinessProfile((prev) => ({ ...prev, business_name: e.target.value }))}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Select
                label="Industry"
                value={businessProfile.industry || "Retail"}
                onChange={(e) => setBusinessProfile((prev) => ({ ...prev, industry: e.target.value }))}
                options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
              />
              <Input
                label="Years in Business"
                type="number"
                min={0}
                value={businessProfile.business_age_years || ""}
                onChange={(e) => setBusinessProfile((prev) => ({ ...prev, business_age_years: parseInt(e.target.value) || undefined }))}
              />
            </div>

            <Input
              label="Business Address"
              value={businessProfile.address || ""}
              onChange={(e) => setBusinessProfile((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main St, City, Country"
            />

            <Textarea
              label="Business Description"
              value={businessProfile.business_description || ""}
              onChange={(e) => setBusinessProfile((prev) => ({ ...prev, business_description: e.target.value }))}
              placeholder="Tell us about your business..."
              rows={4}
            />

            <MultiSelect
              label="Looking for Help With"
              options={EXPERTISE_AREAS.map((area) => ({ value: area, label: area }))}
              selected={businessProfile.looking_for || []}
              onChange={(selected) => setBusinessProfile((prev) => ({ ...prev, looking_for: selected }))}
              maxItems={10}
            />
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-end gap-4">
          <Link href="/profile">
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button onClick={handleSave} isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}

