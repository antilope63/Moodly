import { APP_NAME } from '@/constants/config';
import { supabase } from '@/lib/supabase';
import type { BasicUser, RoleType } from '@/types/mood';
import { createURL } from 'expo-linking';

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

  const rawRole = (user.user_metadata as any)?.role ?? null;
  const role = resolveRoleTypeFromMetadata(rawRole);

  const basicUser: BasicUser = {
    id: user.id, // CORRIGÉ : On utilise le vrai ID string de Supabase
    username: user.email?.split('@')[0] ?? 'user',
    email: user.email ?? undefined,
    role,
    rawRole,
  };

  return {
    token: session.access_token,
    user: basicUser,
  };

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