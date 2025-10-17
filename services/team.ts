import { supabase } from '@/lib/supabase';

export type TeamMember = {
  id: string;
  label: string;
  email?: string;
};

export type ManagedTeam = {
  id: number;
  name: string;
  slug?: string | null;
};

export const fetchManagedTeams = async (managerUserId: string): Promise<ManagedTeam[]> => {
  // Essaie de trouver les équipes gérées par l'utilisateur connecté.
  // On teste plusieurs conventions de colonnes possibles: Manager, manager, manager_id, manager_uuid
  const candidateColumns = ['Manager', 'manager', 'manager_id', 'manager_uuid, slug'] as const;
  let rows: any[] = [];
  for (const col of candidateColumns) {
    const { data, error } = await supabase
      .from('teams')
      .select('id,name,slug')
      .eq(col, managerUserId);
    if (error) {
      // On ignore l'erreur pour ce col et on tente les suivants
      continue;
    }
    if (data && data.length) {
      rows = data as any[];
      break;
    }
  }

  // Fallback: si aucune équipe via colonne Manager, on tente via team_members avec role manager
  if (!rows.length) {
    const { data: memberships, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', managerUserId)
      .eq('role', 'manager');
    if (membershipError) throw new Error(membershipError.message);
    const ids = (memberships ?? []).map((m: any) => m.team_id).filter(Boolean);
    if (ids.length) {
      const { data: teamsByMembership, error: teamsErr } = await supabase
        .from('teams')
        .select('id,name,slug')
        .in('id', ids);
      if (teamsErr) throw new Error(teamsErr.message);
      rows = (teamsByMembership ?? []) as any[];
    }
  }

  return rows.map((r) => ({ id: r.id as number, name: r.name as string, slug: r.slug as string | null }));
};

export const fetchTeamMembers = async (teamId: number): Promise<TeamMember[]> => {
  // Essaie d'utiliser une RPC si disponible pour récupérer les profils (auth.users)
  try {
    const { data: rpcData } = await supabase.rpc('get_team_members_with_profile', {
      team_id_input: teamId,
    });
    if (rpcData && Array.isArray(rpcData)) {
      return (rpcData as any[]).map((row, index) => ({
        id: row.user_id as string,
        label: (row.display_name as string) || (row.email as string) || `Employé ${index + 1}`,
        email: row.email as string | undefined,
      }));
    }
  } catch {
    // on retombe sur la version simple ci-dessous
  }
  const { data, error } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId);
  if (error) throw new Error(error.message);

  const members = (data ?? []) as { user_id: string }[];
  const ids = members.map((m) => m.user_id);
  // Tentative de récup email/nom via views publiques ou table profiles
  try {
    // Si vous avez une vue publique 'profiles' qui mappe auth.users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, email')
      .in('id', ids);
    if (profiles && Array.isArray(profiles) && profiles.length) {
      const map = new Map<string, any>();
      profiles.forEach((p: any) => map.set(p.id, p));
      return members.map((m, index) => {
        const p = map.get(m.user_id);
        const display = p?.username || p?.email || `Employé ${index + 1}`;
        return { id: m.user_id, label: display, email: p?.email as string | undefined };
      });
    }
  } catch {
    // ignore
  }

  // Fallback: labels génériques
  return members.map((m, index) => {
    const suffix = m.user_id.slice(0, 8);
    return { id: m.user_id, label: `Employé ${index + 1} (${suffix})` };
  });
};

export const fetchTeamMembersForTeams = async (teamIds: number[]): Promise<TeamMember[]> => {
  if (!teamIds.length) return [];
  const { data, error } = await supabase
    .from('team_members')
    .select('user_id, team_id')
    .in('team_id', teamIds);
  if (error) throw new Error(error.message);
  const seen = new Set<string>();
  const result: TeamMember[] = [];
  (data ?? []).forEach((row: any, idx: number) => {
    const id = row.user_id as string;
    if (seen.has(id)) return;
    seen.add(id);
    const suffix = id.slice(0, 8);
    result.push({ id, label: `Employé ${result.length + 1} (${suffix})` });
  });
  return result;
};


