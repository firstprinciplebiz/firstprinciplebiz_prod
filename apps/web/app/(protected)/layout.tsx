import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("role, profile_completed")
    .eq("id", user.id)
    .single();

  // If profile not completed, redirect to onboarding
  if (userData && !userData.profile_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} role={userData?.role} />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}










