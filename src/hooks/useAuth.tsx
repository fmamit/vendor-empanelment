import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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

async function determineUserType(userId: string): Promise<UserType> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile) return "staff";

  const { data: vendorUser } = await supabase
    .from("vendor_users")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (vendorUser) return "vendor";

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted.current) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const type = await determineUserType(session.user.id);
          if (!isMounted.current) return;
          setUserType(type);
        } else {
          setUserType(null);
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted.current = false;
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
