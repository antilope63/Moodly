import { apiFetch } from '@/lib/api';
import type { BasicUser, RoleType } from '@/types/mood';

type StrapiRole = {
  id: number;
  name: string;
  type: string;
  description?: string | null;
};

type StrapiAuthUser = {
  id: number;
  username: string;
  email?: string | null;
  role?: StrapiRole | null;
};

type StrapiAuthResponse = {
  jwt: string;
  user: StrapiAuthUser;
};

type StrapiMeResponse = StrapiAuthUser;

const resolveRoleType = (role?: StrapiRole | null): RoleType | null => {
  const normalized = role?.type?.toLowerCase();
  if (normalized === 'manager' || normalized === 'hr' || normalized === 'employee') {
    return normalized;
  }
  return null;
};

export const loginWithCredentials = async (
  identifier: string,
  password: string
): Promise<{ token: string; user: BasicUser }> => {
  const authResponse = await apiFetch<StrapiAuthResponse>('/api/auth/local', {
    method: 'POST',
    body: JSON.stringify({
      identifier,
      password,
    }),
  });

  let role = resolveRoleType(authResponse.user.role);

  if (!role) {
    const meResponse = await apiFetch<StrapiMeResponse>('/api/users/me', {
      headers: {
        Authorization: `Bearer ${authResponse.jwt}`,
      },
      query: {
        populate: 'role',
      },
    });

    role = resolveRoleType(meResponse.role);
  }

  const resolvedRole: RoleType = role ?? 'employee';

  const basicUser: BasicUser = {
    id: authResponse.user.id,
    username: authResponse.user.username,
    email: authResponse.user.email ?? undefined,
    role: resolvedRole,
  };

  return {
    token: authResponse.jwt,
    user: basicUser,
  };
};
