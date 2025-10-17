import { supabase } from '@/lib/supabase';
import type {
  MoodCategory,
  MoodContext,
  MoodEntry,
  RoleType,
  TeamSummary,
  VisibilitySettings,
} from '@/types/mood';

type DbMoodCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  category_type: MoodCategory['categoryType'];
  icon?: string | null;
  order?: number | null;
  is_default?: boolean;
};

type DbMoodEntry = {
  id: number;
  mood_value: number;
  context: MoodContext;
  is_anonymous: boolean;
  reason_summary?: string | null;
  note?: string | null;
  logged_at: string;
  visibility: VisibilitySettings;
};

type DbMoodEntryRow = DbMoodEntry & {
  categories?: DbMoodCategory[];
  team?: { id: number; name: string; slug?: string | null } | null;
};

const mapCategory = (row: DbMoodCategory): MoodCategory => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description ?? undefined,
  categoryType: row.category_type ?? 'other',
  icon: row.icon ?? undefined,
  order: row.order ?? undefined,
  isDefault: row.is_default ?? undefined,
});

const mapMoodEntry = (row: DbMoodEntryRow): MoodEntry => ({
  id: row.id,
  moodValue: row.mood_value,
  context: row.context,
  isAnonymous: row.is_anonymous,
  reasonSummary: row.reason_summary ?? undefined,
  note: row.note ?? undefined,
  loggedAt: row.logged_at,
  visibility: row.visibility,
  categories: (row.categories ?? []).map(mapCategory),
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
  const categoriesRaw = (row.categories ?? []).map(
    (rel: any) => rel.mood_categories as DbMoodCategory,
  );
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
    categories: categoriesRaw,
    team,
  } as DbMoodEntryRow;
};

const moodEntrySelect =
  'id, mood_value, context, is_anonymous, reason_summary, note, logged_at, visibility, team:teams(id,name,slug), categories:mood_entry_categories(mood_categories(*))';

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
    .order('logged_at', { ascending: false })
    .limit(25) as any;

  if (adminIds.length > 0) {
    const inList = `(${adminIds.map((id) => `"${id}"`).join(',')})`;
    query = query.not('user_id', 'in', inList);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => mapMoodEntry(normalizeDbRow(row)));
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

export const fetchMoodCategories = async (): Promise<MoodCategory[]> => {
  const { data, error } = await supabase
    .from('mood_categories')
    .select('*')
    .order('order', { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapCategory);
};

export type CreateMoodEntryPayload = {
  moodValue: number;
  context: MoodContext;
  isAnonymous: boolean;
  reasonSummary?: string | null;
  note?: string | null;
  loggedAt?: string;
  categories: number[];
  visibility: VisibilitySettings;
  teamId?: number | null;
  userId?: string;
};

export const createMoodEntry = async (
  payload: CreateMoodEntryPayload,
): Promise<MoodEntry> => {
  const { categories, teamId: explicitTeamId, userId, ...rest } = payload;

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
  };

  const { data, error } = await supabase
    .from('mood_entries')
    .insert(insertPayload)
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Impossible de créer ton humeur.');
  }

  if (categories?.length) {
    const junctionRows = categories.map((categoryId) => ({
      mood_entry_id: data.id,
      mood_category_id: categoryId,
    }));
    const { error: relError } = await supabase
      .from('mood_entry_categories')
      .insert(junctionRows);
    if (relError) throw new Error(relError.message);
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

  return {
    role,
    team,
    moodsCount: count ?? 0,
  };
};

