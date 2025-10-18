import { APP_NAME, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/constants/config';
import { supabase } from '@/lib/supabase';
import type { BasicUser, RoleType } from '@/types/mood';
import { createClient } from '@supabase/supabase-js';
import { createURL } from 'expo-linking';

const resolveRoleTypeFromMetadata = (role?: string | null): RoleType => {
  const normalized = (role ?? '').toLowerCase();
  if (normalized === 'manager' || normalized === 'hr' || normalized === 'employee' || normalized === 'admin') {
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

  // 1) Essaie de déduire le rôle via l'appartenance d'équipe (manager/admin/hr/employee)
  let roleFromMembership: RoleType | null = null;
  try {
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    const raw = (membership?.role as string | null) ?? null;
    roleFromMembership = raw ? resolveRoleTypeFromMetadata(raw) : null;
  } catch {
    roleFromMembership = null;
  }

  // 2) Fallback sur les metadata (app/user)
  const rawRoleMeta = ((user as any)?.app_metadata?.role ?? (user as any)?.user_metadata?.role) ?? null;
  const role = roleFromMembership ?? resolveRoleTypeFromMetadata(rawRoleMeta);

  const basicUser: BasicUser = {
    id: user.id, // CORRIGÉ : On utilise le vrai ID string de Supabase
    username: user.email?.split('@')[0] ?? 'user',
    email: user.email ?? undefined,
    role,
    rawRole: role,
  };

  return {
    token: session.access_token,
    user: basicUser,
  };

};

// Admin-only client (dev): do not include in production builds
export const getAdminClient = () => {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    throw new Error('Admin indisponible en production.');
  }
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL manquant. Ajoutez-le à votre .env');
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant. Ajoutez-le à votre .env (dev uniquement)');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};

export type AdminUpsertUserPayload = {
  id?: string;
  email: string;
  password?: string;
  role: string; // raw role e.g. 'super_admin' | 'manager' | 'hr' | 'employee'
};

export const adminUpsertUser = async ({ id, email, password, role }: AdminUpsertUserPayload) => {
  const admin = getAdminClient();
  if (id) {
    const { data, error } = await admin.auth.admin.updateUserById(id, {
      email,
      password,
      app_metadata: { role },
    } as any);
    if (error) throw new Error(error.message);
    return data;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    app_metadata: { role },
    email_confirm: true,
  } as any);
  if (error) throw new Error(error.message);
  return data;
};

export const adminFindUsersByEmail = async (email: string) => {
  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(error.message);
  const lower = email.toLowerCase();
  return (data.users || []).filter((u: any) => (u.email || '').toLowerCase().includes(lower));
};

/**
 * Envoie un email de réinitialisation du mot de passe via Supabase.
 * Retourne true si l'envoi a été initié correctement.
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  // Redirige vers l'écran forgot-password (même écran pour initier et finaliser)
  const redirectTo = createURL('/forgot-password');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) {
    throw new Error(error.message || `Échec d'envoi de l'email ${APP_NAME}.`);
  }
  return true;
};