import { supabase } from '@/lib/supabase';
import type {
  BasicUser,
  MoodContext,
  MoodEntry,
  RoleType,
  TeamSummary,
  VisibilitySettings,
} from '@/types/mood';

type DbMoodEntry = {
  id: number;
  mood_value: number;
  context: MoodContext;
  is_anonymous: boolean;
  reason_summary?: string | null;
  note?: string | null;
  logged_at: string;
  visibility: VisibilitySettings;
  freedom_choice?: string | null;
  support_choice?: string | null;
  energy_choice?: string | null;
  pride_percent?: number | null;
  user_id?: string; // pour enrichir loggedBy
  user_email?: string | null;
};

type DbMoodEntryRow = DbMoodEntry & {
  team?: { id: number; name: string; slug?: string | null } | null;
};

const mapMoodEntry = (row: DbMoodEntryRow): MoodEntry => ({
  id: row.id,
  moodValue: row.mood_value,
  context: row.context,
  isAnonymous: row.is_anonymous,
  reasonSummary: row.reason_summary ?? undefined,
  note: row.note ?? undefined,
  loggedAt: row.logged_at,
  visibility: row.visibility,
  categories: [],
  freedomChoice: row.freedom_choice ?? undefined,
  supportChoice: row.support_choice ?? undefined,
  energyChoice: row.energy_choice ?? undefined,
  pridePercent: row.pride_percent ?? undefined,
  loggedBy: null,
  additionalViewers: [],
  team: row.team
    ? {
        id: row.team.id,
        name: row.team.name,
        slug: row.team.slug ?? undefined,
      }
    : null,
});

// Normalise la forme renvoyée par Supabase (team parfois tableau si FK absente)
const normalizeDbRow = (row: any): DbMoodEntryRow => {
  const teamRaw = (row.team ?? null) as any;
  const team = Array.isArray(teamRaw)
    ? (teamRaw[0]
        ? {
            id: Number(teamRaw[0].id),
            name: String(teamRaw[0].name),
            slug: (teamRaw[0].slug as string | null) ?? null,
          }
        : null)
    : teamRaw
    ? {
        id: Number(teamRaw.id),
        name: String(teamRaw.name),
        slug: (teamRaw.slug as string | null) ?? null,
      }
    : null;

  return {
    id: row.id,
    mood_value: row.mood_value,
    mood_label: row.mood_label,
    context: row.context,
    is_anonymous: row.is_anonymous,
    reason_summary: row.reason_summary,
    note: row.note,
    logged_at: row.logged_at,
    visibility: row.visibility,
    freedom_choice: row.freedom_choice,
    support_choice: row.support_choice,
    energy_choice: row.energy_choice,
    pride_percent: row.pride_percent,
    team,
  } as DbMoodEntryRow;
};

const moodEntrySelect =
  'id, mood_value, context, is_anonymous, reason_summary, note, logged_at, visibility, freedom_choice, support_choice, energy_choice, pride_percent, user_id, user_email, team:teams(id,name,slug)';

export const fetchMoodFeed = async (): Promise<MoodEntry[]> => {
  // Récupère l'utilisateur connecté (uuid/email)
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);

  // Si pas connecté, on retourne un feed vide
  const currentUser = authData?.user;
  if (!currentUser) {
    return [];
  }

  // Récupère l'équipe du user via table team_members
  const { data: membership, error: membershipError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', currentUser.id)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw new Error(membershipError.message);

  const teamId = membership?.team_id as number | null | undefined;
  if (!teamId) {
    // Pas d'équipe associée => pas de feed d'équipe
    return [];
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Exclut les posts des admins (si présents) sans casser le typage UUID
  const { data: adminMembers } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId)
    .eq('role', 'admin');
  const adminIds = (adminMembers ?? [])
    .map((r: any) => r.user_id as string)
    .filter((id) => Boolean(id));

  let query = supabase
    .from('mood_entries')
    .select(moodEntrySelect)
    .eq('team_id', teamId)
    .eq('is_anonymous', false)
    .neq('user_id', currentUser.id)
    .gte('logged_at', todayStart.toISOString())
    .lt('logged_at', todayEnd.toISOString())
    .order('logged_at', { ascending: false })
    .limit(25) as any;

  if (adminIds.length > 0) {
    const inList = `(${adminIds.map((id) => `"${id}"`).join(',')})`;
    query = query.not('user_id', 'in', inList);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as any[];
  const userIds = Array.from(
    new Set(
      rows
        .map((r) => r.user_id as string | undefined)
        .filter((v): v is string => Boolean(v))
    )
  );
  let profilesMap = new Map<string, { id: string; username?: string | null; email?: string | null }>();
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, email')
      .in('id', userIds);
    (profiles ?? []).forEach((p: any) => {
      profilesMap.set(p.id as string, {
        id: p.id as string,
        username: (p.username as string | null) ?? null,
        email: (p.email as string | null) ?? null,
      });
    });
  }

  return rows.map((row: any) => {
    const normalized = normalizeDbRow(row);
    const base = mapMoodEntry(normalized);
    const profile = row.user_id ? profilesMap.get(row.user_id as string) : undefined;
    const fallbackUsername = (row.user_email as string | null)?.split('@')[0] ?? 'Collègue';
    const loggedBy: BasicUser | null = row.user_id
      ? {
          id: row.user_id as string,
          username: profile?.username || fallbackUsername,
          email: profile?.email || (row.user_email as string | undefined),
          role: undefined,
          rawRole: null,
        }
      : null;
    return { ...base, loggedBy };
  });
};

export const fetchMyTodayMoodEntry = async (): Promise<MoodEntry | null> => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  const me = authData?.user;
  if (!me) return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data, error } = await supabase
    .from('mood_entries')
    .select(moodEntrySelect)
    .eq('user_id', me.id)
    .gte('logged_at', start.toISOString())
    .lt('logged_at', end.toISOString())
    .order('logged_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && (error as any).code !== 'PGRST116') throw new Error(error.message);
  if (!data) return null;
  return mapMoodEntry(normalizeDbRow(data));
};

export const updateMoodEntry = async (
  id: number,
  payload: UpdateMoodEntryPayload,
): Promise<MoodEntry> => {
  const updatePayload = {
    mood_value: payload.moodValue,
    context: payload.context,
    is_anonymous: payload.isAnonymous,
    reason_summary: payload.reasonSummary ?? null,
    note: payload.note ?? null,
    logged_at: payload.loggedAt ?? new Date().toISOString(),
    visibility: payload.visibility,
    freedom_choice: payload.freedomChoice ?? null,
    support_choice: payload.supportChoice ?? null,
    energy_choice: payload.energyChoice ?? null,
    pride_percent:
      typeof payload.pridePercent === 'number' ? payload.pridePercent : null,
  } as const;

  const { error: upError } = await supabase
    .from('mood_entries')
    .update(updatePayload)
    .eq('id', id);
  if (upError) throw new Error(upError.message);

  const { data, error } = await supabase
    .from('mood_entries')
    .select(moodEntrySelect)
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return mapMoodEntry(normalizeDbRow(data));
};

export const fetchMoodEntryById = async (id: number): Promise<MoodEntry | null> => {
  const { data, error } = await supabase
    .from('mood_entries')
    .select(moodEntrySelect)
    .eq('id', id)
    .maybeSingle();
  if (error && (error as any).code !== 'PGRST116') throw new Error(error.message);
  if (!data) return null;
  return mapMoodEntry(normalizeDbRow(data));
};

export const fetchMoodHistory = async (): Promise<MoodEntry[]> => {
  const { data, error } = await supabase
    .from('mood_entries')
    .select(moodEntrySelect)
    .order('logged_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => mapMoodEntry(normalizeDbRow(row)));
};

export type CreateMoodEntryPayload = {
  moodValue: number;
  context: MoodContext;
  isAnonymous: boolean;
  reasonSummary?: string | null;
  note?: string | null;
  loggedAt?: string;
  visibility: VisibilitySettings;
  teamId?: number | null;
  userId?: string;
  freedomChoice?: string | null;
  supportChoice?: string | null;
  energyChoice?: string | null;
  pridePercent?: number | null;
};

export type UpdateMoodEntryPayload = {
  moodValue: number;
  context: MoodContext;
  isAnonymous: boolean;
  reasonSummary?: string | null;
  note?: string | null;
  loggedAt?: string;
  visibility: VisibilitySettings;
  freedomChoice?: string | null;
  supportChoice?: string | null;
  energyChoice?: string | null;
  pridePercent?: number | null;
};

export const createMoodEntry = async (
  payload: CreateMoodEntryPayload,
): Promise<MoodEntry> => {
  const { teamId: explicitTeamId, userId, ...rest } = payload;

  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(authError.message);
    if (!authData?.user) {
      throw new Error('Connecte-toi pour partager ton humeur.');
    }
    resolvedUserId = authData.user.id;
  }

  let teamId = explicitTeamId ?? null;

  if (!teamId) {
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', resolvedUserId)
      .limit(1)
      .maybeSingle();
    if (membershipError) throw new Error(membershipError.message);
    teamId = membership?.team_id ?? null;
    const role = (membership?.role as string | null)?.toLowerCase() ?? null;
    if (role === 'admin') {
      throw new Error("Les administrateurs ne peuvent pas publier des humeurs.");
    }
  }

  if (!teamId) {
    throw new Error(
      "Ton compte n'est associé à aucune équipe. Contacte ton manager pour rejoindre une équipe.",
    );
  }

  const insertPayload = {
    user_id: resolvedUserId,
    team_id: teamId,
    mood_value: rest.moodValue,
    context: rest.context,
    is_anonymous: rest.isAnonymous,
    reason_summary: rest.reasonSummary ?? null,
    note: rest.note ?? null,
    logged_at: rest.loggedAt ?? new Date().toISOString(),
    visibility: rest.visibility,
    freedom_choice: rest.freedomChoice ?? null,
    support_choice: rest.supportChoice ?? null,
    energy_choice: rest.energyChoice ?? null,
    pride_percent:
      typeof rest.pridePercent === 'number' ? rest.pridePercent : null,
  };

  const { data, error } = await supabase
    .from('mood_entries')
    .insert(insertPayload)
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Impossible de créer ton humeur.');
  }

  const { data: fullRow, error: fetchError } = await supabase
    .from('mood_entries')
    .select(moodEntrySelect)
    .eq('id', data.id)
    .single();
  if (fetchError || !fullRow) {
    throw new Error(
      fetchError?.message ??
        'Humeur enregistrée mais impossible de la relire.',
    );
  }

  return mapMoodEntry(normalizeDbRow(fullRow));
};

export type ProfileSummary = {
  role?: RoleType | null;
  team?: TeamSummary | null;
  moodsCount: number;
  username?: string | null;
  email?: string | null;
};

export const fetchProfileSummary = async (): Promise<ProfileSummary> => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!authData?.user) {
    throw new Error('Connecte-toi pour afficher ton profil.');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('team_members')
    .select('role, team:teams(id,name,slug)')
    .eq('user_id', authData.user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw new Error(membershipError.message);

  const { count, error: countError } = await supabase
    .from('mood_entries')
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', authData.user.id);
  if (countError) throw new Error(countError.message);

  let role: RoleType | null = null;
  const membershipRole = (membership?.role as string | null) ?? null;
  if (membershipRole) {
    const normalized = membershipRole.toLowerCase();
    if (
      normalized === 'manager' ||
      normalized === 'hr' ||
      normalized === 'employee'
    ) {
      role = normalized as RoleType;
    }
  }

  // Normalise le champ team qui peut être un objet ou un tableau
  let team: TeamSummary | null = null;
  const rawTeam = (membership as any)?.team;
  if (Array.isArray(rawTeam)) {
    const t = rawTeam[0];
    team = t
      ? { id: Number(t.id), name: String(t.name), slug: t.slug ?? undefined }
      : null;
  } else if (rawTeam) {
    team = {
      id: Number(rawTeam.id),
      name: String(rawTeam.name),
      slug: rawTeam.slug ?? undefined,
    };
  }

  // Récupère le username/email depuis la table profiles
  let username: string | null = null;
  let email: string | null = authData.user.email ?? null;
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('id, username, email')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (profileRow) {
    username = (profileRow.username as string | null) ?? null;
    email = (profileRow.email as string | null) ?? email;
  }

  return {
    role,
    team,
    moodsCount: count ?? 0,
    username,
    email,
  };
};
