import { useState, useEffect, useCallback } from "react";
import type { SupabaseClient, Session, User } from "@supabase/supabase-js";
import type { UserRole } from "../types";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profileCompleted: boolean;
  isLoading: boolean;
}

export function useAuth(supabase: SupabaseClient) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    profileCompleted: false,
    isLoading: true,
  });

  const fetchUserData = useCallback(async (user: User) => {
    const { data: userData } = await supabase
      .from("users")
      .select("role, profile_completed")
      .eq("id", user.id)
      .single();

    return {
      role: (userData?.role as UserRole) || null,
      profileCompleted: userData?.profile_completed || false,
    };
  }, [supabase]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { role, profileCompleted } = await fetchUserData(session.user);
        setState({
          user: session.user,
          session,
          role,
          profileCompleted,
          isLoading: false,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { role, profileCompleted } = await fetchUserData(session.user);
          setState({
            user: session.user,
            session,
            role,
            profileCompleted,
            isLoading: false,
          });
        } else {
          setState({
            user: null,
            session: null,
            role: null,
            profileCompleted: false,
            isLoading: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchUserData]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, role: UserRole) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      });
      return { data, error };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, [supabase]);

  const resetPassword = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    },
    [supabase]
  );

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}


