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

export const fetchMoodFeed = async (): Promise<MoodEntry[]> => {
  const { data, error } = await supabase
    .from('mood_entries')
    .select(
      `id, mood_value, mood_label, context, is_anonymous, reason_summary, note, logged_at, visibility, categories:mood_entry_categories(mood_categories(*))`
    )
    .order('logged_at', { ascending: false })
    .limit(25);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const categoriesRaw = (row.categories ?? []).map((rel: any) => rel.mood_categories as DbMoodCategory);
    return mapMoodEntry({ ...row, categories: categoriesRaw });
  });
};

export const fetchMoodHistory = async (): Promise<MoodEntry[]> => {
  const { data, error } = await supabase
    .from('mood_entries')
    .select(
      `id, mood_value, mood_label, context, is_anonymous, reason_summary, note, logged_at, visibility, categories:mood_entry_categories(mood_categories(*))`
    )
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
  userId: string;
};

export const createMoodEntry = async (payload: CreateMoodEntryPayload): Promise<MoodEntry> => {
  const { categories, userId, ...rest } = payload;

  const insertPayload = {
    mood_value: rest.moodValue,
    mood_label: rest.moodLabel,
    context: rest.context,
    is_anonymous: rest.isAnonymous,
    reason_summary: rest.reasonSummary ?? null,
    note: rest.note ?? null,
    logged_at: rest.loggedAt ?? new Date().toISOString(),
    visibility: rest.visibility,
    user_id: userId,
  };

  const { data, error } = await supabase.from('mood_entries').insert(insertPayload).select('*').single();
  if (error || !data) throw new Error(error?.message ?? 'Unable to create mood entry.');

  if (categories && categories.length > 0) {
    const junctionRows = categories.map((categoryId) => ({
      mood_entry_id: data.id,
      mood_category_id: categoryId,
    }));
    const { error: relError } = await supabase.from('mood_entry_categories').insert(junctionRows);
    if (relError) throw new Error(relError.message);
  }

  const { data: fullRow, error: fetchError } = await supabase
    .from('mood_entries')
    .select(
      `id, mood_value, mood_label, context, is_anonymous, reason_summary, note, logged_at, visibility, categories:mood_entry_categories(mood_categories(*))`
    )
    .eq('id', data.id)
    .single();

  if (fetchError || !fullRow) throw new Error(fetchError?.message ?? 'Entry created but not retrievable.');

  const categoriesRaw = (fullRow.categories ?? []).map((rel: any) => rel.mood_categories as DbMoodCategory);
  return mapMoodEntry({ ...fullRow, categories: categoriesRaw });
};