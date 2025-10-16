import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { supabase } from '@/lib/supabase';
import type { BasicUser, RoleType } from '@/types/mood';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: BasicUser | null;
  role: RoleType | null;
  token: string | null;
  login: (user: BasicUser, token?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren<object>) => {
  const [user, setUser] = useState<BasicUser | null>(null);
  const [role, setRole] = useState<RoleType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('unauthenticated');

  const login = useCallback((userPayload: BasicUser, authToken?: string) => {
    setUser(userPayload);
    setRole(userPayload.role ?? 'employee');
    setToken(authToken ?? null);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    void supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setToken(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      role,
      token,
      login,
      logout,
    }),
    [status, user, role, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
