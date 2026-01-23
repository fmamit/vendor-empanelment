import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserType = "vendor" | "staff" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userType: UserType;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);

  const determineUserType = async (userId: string): Promise<UserType> => {
    console.log("[Auth] Determining user type for:", userId);
    
    try {
      // Check if user is internal staff
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      console.log("[Auth] Profile query result:", { profile, profileError });

      if (profileError) {
        console.error("[Auth] Profile query error:", profileError);
      }

      if (profile) {
        console.log("[Auth] Setting userType to 'staff'");
        return "staff";
      }

      // Check if user is vendor user
      const { data: vendorUser, error: vendorError } = await supabase
        .from("vendor_users")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      console.log("[Auth] Vendor query result:", { vendorUser, vendorError });

      if (vendorError) {
        console.error("[Auth] Vendor query error:", vendorError);
      }

      if (vendorUser) {
        console.log("[Auth] Setting userType to 'vendor'");
        return "vendor";
      }

      console.log("[Auth] No profile or vendor found, userType = null");
      return null;
    } catch (error) {
      console.error("[Auth] determineUserType failed:", error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    console.log("[Auth] Initializing auth state...");

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth] onAuthStateChange:", event, session?.user?.id);
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const type = await determineUserType(session.user.id);
          if (isMounted) {
            setUserType(type);
            console.log("[Auth] userType set to:", type);
          }
        } else {
          setUserType(null);
        }
        
        if (isMounted) {
          setLoading(false);
          console.log("[Auth] Loading set to false (onAuthStateChange)");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("[Auth] getSession result:", session?.user?.id);
      
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const type = await determineUserType(session.user.id);
        if (isMounted) {
          setUserType(type);
          console.log("[Auth] userType set to:", type);
        }
      }
      
      if (isMounted) {
        setLoading(false);
        console.log("[Auth] Loading set to false (getSession)");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, userType, loading, signOut }}>
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
