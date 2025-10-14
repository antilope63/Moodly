import { supabase } from '@/lib/supabase';
import type { MoodCategory, MoodContext, MoodEntry, MoodLabel, VisibilitySettings } from '@/types/mood';

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

const mapMoodEntry = (row: DbMoodEntry & { categories?: DbMoodCategory[] }): MoodEntry => ({
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
  team: null,
});

/** Sélection imbriquée explicite pour éviter toute ambiguïté d'ID */
const MOOD_WITH_CATEGORIES_SELECT = `
  id,
  mood_value,
  mood_label,
  context,
  is_anonymous,
  reason_summary,
  note,
  logged_at,
  visibility,
  categories:mood_entry_categories(
    mood_category_id,
    mood_categories(
      id,
      name,
      slug,
      description,
      category_type,
      icon,
      "order",
      is_default
    )
  )
`;

export const fetchMoodFeed = async (): Promise<MoodEntry[]> => {
  const { data, error } = await supabase
    .from('mood_entries')
    .select(MOOD_WITH_CATEGORIES_SELECT)
    .order('logged_at', { ascending: false })
    .limit(25);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const categoriesRaw = (row.categories ?? []).map((rel: any) => rel.mood_categories as DbMoodCategory);
    return mapMoodEntry({ ...row, categories: categoriesRaw });
  });
};

export const fetchMoodHistory = async (): Promise<MoodEntry[]> => {
  // 1) Récupérer l'utilisateur courant (auth obligatoire)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  if (!user) throw new Error('Not authenticated');

  // 2) Sélection explicite + filtre strict sur ton user_id
  const { data, error } = await supabase
    .from('mood_entries')
    .select(`
      id,
      mood_value,
      mood_label,
      context,
      is_anonymous,
      reason_summary,
      note,
      logged_at,
      visibility,
      categories:mood_entry_categories(
        mood_category_id,
        mood_categories(
          id,
          name,
          slug,
          description,
          category_type,
          icon,
          "order",
          is_default
        )
      )
    `)
    .eq('user_id', user.id)         // ✅ ne ramène que tes logs
    .order('logged_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const categoriesRaw = (row.categories ?? []).map((rel: any) => rel.mood_categories as DbMoodCategory);
    return mapMoodEntry({ ...row, categories: categoriesRaw });
  });
};

export const fetchMoodCategories = async (): Promise<MoodCategory[]> => {
  const { data, error } = await supabase
    .from('mood_categories')
    .select('id, name, slug, description, category_type, icon, "order", is_default') // explicite aussi ici
    .order('order', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapCategory);
};

export type CreateMoodEntryPayload = {
  teamId?: number | null;
  moodValue: number;
  moodLabel: MoodLabel;      // ⚠️ doit matcher EXACTEMENT l’ENUM DB
  context: MoodContext;      // ⚠️ idem (ex: 'pro' / 'perso' selon ta DB)
  isAnonymous: boolean;
  reasonSummary?: string | null;
  note?: string | null;
  loggedAt?: string;         // (non utilisé côté RPC; la DB timestamp)
  categories: number[];
  visibility: VisibilitySettings; // mets null si tu veux laisser le DEFAULT côté DB
};

export const createMoodEntry = async (payload: CreateMoodEntryPayload): Promise<MoodEntry> => {
  const {
    teamId = null,
    moodValue,
    moodLabel,
    context,
    isAnonymous,
    reasonSummary = null,
    note = null,
    categories,
    visibility,
  } = payload;

  // 1) Insert via RPC (SECURITY DEFINER)
  const { data: rpcData, error: rpcError } = await supabase.rpc('log_mood_full', {
    _team_id: teamId,
    _mood_value: moodValue,
    _mood_label: moodLabel as any,  // adapte si tes enums diffèrent côté DB
    _context: context as any,       // idem
    _is_anonymous: isAnonymous,
    _reason_summary: reasonSummary,
    _note: note,
    _visibility: visibility ?? null,
    _categories: (categories && categories.length > 0) ? categories : null,
  });

  if (rpcError || !rpcData || rpcData.length === 0) {
    throw new Error(rpcError?.message ?? 'Unable to create mood entry (RPC).');
  }

  const entryId = rpcData[0].id;

  // 2) Re-fetch avec sélection explicite (évite id ambigu)
  const { data: fullRow, error: fetchError } = await supabase
    .from('mood_entries')
    .select(MOOD_WITH_CATEGORIES_SELECT)
    .eq('id', entryId)
    .single();

  if (fetchError || !fullRow) {
    throw new Error(fetchError?.message ?? 'Entry created but not retrievable.');
  }

  const categoriesRaw = (fullRow.categories ?? []).map((rel: any) => rel.mood_categories as DbMoodCategory);
  return mapMoodEntry({ ...fullRow, categories: categoriesRaw });
};