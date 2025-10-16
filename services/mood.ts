import { supabase } from '@/lib/supabase';
import type {
  MoodCategory,
  MoodContext,
  MoodEntry,
  MoodLabel,
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
  mood_label: MoodLabel;
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
  moodLabel: row.mood_label,
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

const moodEntrySelect =
  'id, mood_value, mood_label, context, is_anonymous, reason_summary, note, logged_at, visibility, team:teams(id,name,slug), categories:mood_entry_categories(mood_categories(*))';

export const fetchMoodFeed = async (): Promise<MoodEntry[]> => {
  const { data, error } = await supabase
    .from('mood_entries')
    .select(moodEntrySelect)
    .order('logged_at', { ascending: false })
    .limit(25);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const categoriesRaw = (row.categories ?? []).map(
      (rel: any) => rel.mood_categories as DbMoodCategory,
    );
    return mapMoodEntry({ ...row, categories: categoriesRaw });
  });
};

export const fetchMoodHistory = async (): Promise<MoodEntry[]> => {
  const { data, error } = await supabase
    .from('mood_entries')
    .select(moodEntrySelect)
    .order('logged_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const categoriesRaw = (row.categories ?? []).map(
      (rel: any) => rel.mood_categories as DbMoodCategory,
    );
    return mapMoodEntry({ ...row, categories: categoriesRaw });
  });
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
  moodLabel: MoodLabel;
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
      .select('team_id')
      .eq('user_id', resolvedUserId)
      .limit(1)
      .maybeSingle();
    if (membershipError) throw new Error(membershipError.message);
    teamId = membership?.team_id ?? null;
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
    mood_label: rest.moodLabel,
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

  const categoriesRaw = (fullRow.categories ?? []).map(
    (rel: any) => rel.mood_categories as DbMoodCategory,
  );
  return mapMoodEntry({ ...fullRow, categories: categoriesRaw });
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

  return {
    role,
    team: (membership?.team as TeamSummary | null) ?? null,
    moodsCount: count ?? 0,
  };
};

