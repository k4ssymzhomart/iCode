import { UserProfile, UserRole } from "../../../shared/types";
import { supabase } from "../lib/supabase";
import { User, Session } from "@supabase/supabase-js";

export const authService = {
  /**
   * Listens to Supabase auth state and hits backend to sync profile.
   */
  onAuthStateChange(callback: (profile: UserProfile | null | undefined, session: Session | null, user: User | null, loading: boolean) => void) {
    callback(null, null, null, true);
    
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session || !session.user) {
        callback(null, null, null, false);
        return;
      }

      const user = session.user;
      const cachedRole = localStorage.getItem("iCode_onboarding_role") as UserRole | null;
      if (cachedRole) {
        localStorage.removeItem("iCode_onboarding_role");
      }
      
      try {
        // Sync profile with our true backend
        const response = await fetch("/api/auth/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
             role: cachedRole,
             fullName: user.user_metadata?.full_name,
             avatarUrl: user.user_metadata?.avatar_url,
             email: user.email
          })
        });
        
        if (response.ok) {
           const { profile } = await response.json();
           callback(profile, session, user, false);
        } else {
           console.error("Failed to sync profile");
           // Notice: Do NOT clear the flag here. A concurrent 'SIGNED_IN' event might be reading it while 'INITIAL_SESSION' failed or vice-versa!
           callback(undefined, session, user, false);
        }
      } catch (err) {
        console.error("Error connecting to backend auth sync:", err);
        callback(undefined, session, user, false);
      }
    });

    return data.subscription;
  },

  /**
   * Initiates Supabase Google OAuth
   */
  async signInWithGoogle(role: UserRole) {
    localStorage.setItem("iCode_onboarding_role", role);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      }
    });

    if (error) {
      throw error;
    }
  },

  async signOut() {
    await supabase.auth.signOut();
  }
};
