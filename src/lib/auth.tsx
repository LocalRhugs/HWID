import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getGateStatus, lockSite, unlockSite } from "@/lib/gate.functions";

type AuthState = {
  email: string | null;
  loading: boolean;
  allowed: boolean;
  unlock: (password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState>({
  email: null,
  loading: true,
  allowed: false,
  unlock: async () => ({ ok: false }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getGateStatus()
      .then((res) => {
        if (active) setAllowed(res.unlocked);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const unlock = useCallback(async (password: string) => {
    const res = await unlockSite({ data: { password } });
    if (res.ok) setAllowed(true);
    return res.ok ? { ok: true } : { ok: false, error: res.error };
  }, []);

  const signOut = useCallback(async () => {
    await lockSite();
    setAllowed(false);
  }, []);

  return (
    <AuthCtx.Provider value={{ email: null, loading, allowed, unlock, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
