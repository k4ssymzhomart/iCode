import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile, UserRole } from "../../../shared/types";
import { authService } from "../services/auth";
import { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
};

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  user: null, 
  profile: null, 
  isLoading: true,
  isAuthenticated: false,
  role: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const subscription = authService.onAuthStateChange((p, s, u, loading) => {
      if (p !== undefined) {
        setProfile(p);
      }
      setSession(s);
      setUser(u);
      setIsLoading(loading);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = !!session && !!profile;
  const role = profile?.role ?? null;

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, isAuthenticated, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
