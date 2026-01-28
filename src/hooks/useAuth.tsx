import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserType = "vendor" | "staff" | null;

// Test mode constants
const TEST_MODE_KEY = "test_vendor_mode";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userType: UserType;
  loading: boolean;
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
      setUserType("vendor");
      setLoading(false);
      return;
    }

    // IMPORTANT: Set up listener BEFORE getting session to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Get initial session after listener is set up
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isTestMode]);

  // Determine user type when user changes
  useEffect(() => {
    // Skip if test mode
    if (isTestMode) {
      setUserType("vendor");
      return;
    }

    if (!user) {
      setUserType(null);
      return;
    }

    const checkUserType = async () => {
      // Check staff first
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
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
        setUserType("vendor");
        return;
      }

      setUserType(null);
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
    <AuthContext.Provider value={{ user, session, userType, loading, isTestMode, signOut, setTestMode }}>
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
