import { supabase } from '@/lib/supabase';
import type { BasicUser, RoleType } from '@/types/mood';

const resolveRoleTypeFromMetadata = (role?: string | null): RoleType => {
  const normalized = (role ?? '').toLowerCase();
  if (normalized === 'manager' || normalized === 'hr' || normalized === 'employee') {
    return normalized as RoleType;
  }
  return 'employee';
};

export const loginWithCredentials = async (
  email: string,
  password: string
): Promise<{ token: string; user: BasicUser }> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }

  const session = data.session;
  const user = data.user;
  if (!session || !user) {
    throw new Error("Authentification Supabase invalide.");
  }

  const role = resolveRoleTypeFromMetadata((user.user_metadata as any)?.role);

  const basicUser: BasicUser = {
    // Supabase utilise des UUID string; nous convertissons en number placeholder 0
    id: 0,
    username: user.email?.split('@')[0] ?? 'user',
    email: user.email ?? undefined,
    role,
  };

  return {
    token: session.access_token,
    user: basicUser,
  };
};
