import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserType = "vendor" | "staff" | null;

// Test mode constants
const TEST_MODE_KEY = "test_vendor_mode";

// Paths where we skip user type queries to avoid RLS issues
const SKIP_AUTH_PATHS = ["/vendor/register"];

// Helper to check if current path should skip auth
const shouldSkipAuth = () => {
  const pathname = window.location.pathname;
  return SKIP_AUTH_PATHS.some(path => pathname.startsWith(path));
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userType: UserType;
  loading: boolean;
  userTypeLoading: boolean;
  isTestMode: boolean;
  signOut: () => Promise<void>;
  setTestMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  // Start as true - we don't know the userType until we check
  const [userTypeLoading, setUserTypeLoading] = useState(true);
  const [isTestMode, setIsTestMode] = useState(() => {
    return sessionStorage.getItem(TEST_MODE_KEY) === "true";
  });

  const setTestMode = (enabled: boolean) => {
    setIsTestMode(enabled);
    if (enabled) {
      sessionStorage.setItem(TEST_MODE_KEY, "true");
      setUserType("vendor");
    } else {
      sessionStorage.removeItem(TEST_MODE_KEY);
      setUserType(null);
    }
  };

  useEffect(() => {
    // If test mode is active, skip real auth
    if (isTestMode) {
      console.log("[Auth] Test mode active, setting userType to vendor");
      setUserType("vendor");
      setLoading(false);
      setUserTypeLoading(false);
      return;
    }

    // IMPORTANT: Set up listener BEFORE getting session to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] onAuthStateChange:", event, "user:", session?.user?.email ?? "none");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Get initial session after listener is set up
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Auth] getSession:", session?.user?.email ?? "no session");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isTestMode]);

  // Determine user type when user changes
  useEffect(() => {
    // Skip all queries on registration paths to avoid RLS issues
    if (shouldSkipAuth()) {
      console.log("[Auth] On skip-auth path, not checking userType");
      setUserType(null);
      setUserTypeLoading(false);
      return;
    }

    // Skip if test mode
    if (isTestMode) {
      console.log("[Auth] Test mode - setting userType to vendor");
      setUserType("vendor");
      setUserTypeLoading(false);
      return;
    }

    if (!user) {
      console.log("[Auth] No user - clearing userType");
      setUserType(null);
      setUserTypeLoading(false);
      return;
    }

    // Start loading user type
    console.log("[Auth] User detected, checking userType for:", user.email);
    setUserTypeLoading(true);

    const checkUserType = async () => {
      try {
        // Check staff first
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          console.log("[Auth] User is staff");
          setUserType("staff");
          return;
        }

        // Check vendor
        const { data: vendorUser } = await supabase
          .from("vendor_users")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (vendorUser) {
          console.log("[Auth] User is vendor");
          setUserType("vendor");
          return;
        }

        console.log("[Auth] User has no role assigned");
        setUserType(null);
      } finally {
        console.log("[Auth] userTypeLoading complete");
        setUserTypeLoading(false);
      }
    };

    checkUserType();
  }, [user, isTestMode]);

  const signOut = async () => {
    // Clear test mode on sign out
    if (isTestMode) {
      setTestMode(false);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, userType, loading, userTypeLoading, isTestMode, signOut, setTestMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
