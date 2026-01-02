import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  GraduationCap,
  Calendar,
  Briefcase,
  Edit,
  BookOpen,
  DollarSign,
  Heart,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData) {
    redirect("/onboarding");
  }

  const role = userData.role;

  // Get profile based on role
  let profile: Record<string, unknown> | null = null;
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

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <Link href="/profile/edit">
          <Button variant="secondary" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Profile Card */}
      <Card padding="none" className="mb-6">
        {/* Cover / Header */}
        <div className={`h-32 ${role === "student" ? "bg-gradient-to-r from-indigo-500 to-purple-600" : "bg-gradient-to-r from-emerald-500 to-teal-600"}`} />
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden relative">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url as string}
                  alt="Profile"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <User className="w-12 h-12 text-slate-400" />
                </div>
              )}
            </div>
          </div>

          {/* Name & Role */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {role === "student" ? String(profile.full_name || "") : String(profile.owner_name || "")}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {role === "student" ? (
                <>
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span className="text-slate-600">
                    {String(profile.degree_name || "")} in {String(profile.major || "")}
                  </span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-600">
                    {String(profile.business_name || "")}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="w-5 h-5 text-slate-400" />
              {user.email}
            </div>
            {profile.phone ? (
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-5 h-5 text-slate-400" />
                {String(profile.phone)}
              </div>
            ) : null}
            {role === "student" && profile.university_name ? (
              <div className="flex items-center gap-3 text-slate-600">
                <BookOpen className="w-5 h-5 text-slate-400" />
                {String(profile.university_name)}
              </div>
            ) : null}
            {role === "business" && profile.address ? (
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="w-5 h-5 text-slate-400" />
                {String(profile.address)}
              </div>
            ) : null}
            {role === "business" && profile.industry ? (
              <div className="flex items-center gap-3 text-slate-600">
                <Briefcase className="w-5 h-5 text-slate-400" />
                {String(profile.industry)}
              </div>
            ) : null}
            {role === "business" && profile.business_age_years ? (
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar className="w-5 h-5 text-slate-400" />
                {String(profile.business_age_years)} years in business
              </div>
            ) : null}
          </div>

          {/* Bio / Description */}
          {(profile.bio || profile.business_description) ? (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                {role === "student" ? "About Me" : "About the Business"}
              </h3>
              <p className="text-slate-700">
                {role === "student" ? String(profile.bio || "") : String(profile.business_description || "")}
              </p>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Skills / Interests */}
      {role === "student" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Areas of Interest */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Areas of Interest
            </h3>
            <div className="flex flex-wrap gap-2">
              {(profile.areas_of_interest as string[] || []).length > 0 ? (
                (profile.areas_of_interest as string[]).map((interest: string) => (
                  <Badge key={interest} variant="primary">
                    {interest}
                  </Badge>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No interests added yet</p>
              )}
            </div>
          </Card>

          {/* Expertise */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {(profile.expertise as string[] || []).length > 0 ? (
                (profile.expertise as string[]).map((exp: string) => (
                  <Badge key={exp} variant="success">
                    {exp}
                  </Badge>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No expertise added yet</p>
              )}
            </div>
          </Card>

          {/* Work Preferences */}
          <Card padding="md" className="md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              Work Preferences
            </h3>
            <div className="flex flex-wrap gap-4">
              {Boolean(profile.open_to_paid) && (
                <Badge variant="success">Open to Paid Work</Badge>
              )}
              {Boolean(profile.open_to_voluntary) && (
                <Badge variant="primary">Open to Voluntary Work</Badge>
              )}
              {!Boolean(profile.open_to_paid) && !Boolean(profile.open_to_voluntary) && (
                <p className="text-slate-500 text-sm">No preferences set</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Business: Looking For */}
      {role === "business" && (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            Looking For Help With
          </h3>
          <div className="flex flex-wrap gap-2">
            {(profile.looking_for as string[] || []).length > 0 ? (
              (profile.looking_for as string[]).map((skill: string) => (
                <Badge key={skill} variant="success">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No preferences added yet</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

