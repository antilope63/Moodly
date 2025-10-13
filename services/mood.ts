import { apiFetch } from '@/lib/api';
import type { MoodEntry, MoodCategory, VisibilitySettings, MoodLabel, MoodContext } from '@/types/mood';
import type { StrapiCollectionResponse, StrapiCollectionItem, StrapiSingleResponse } from '@/types/strapi';

type MoodCategoryAttributes = {
  name: string;
  slug: string;
  description?: string | null;
  categoryType: MoodCategory['categoryType'];
  icon?: string | null;
  order?: number | null;
  isDefault?: boolean;
};

type BasicUserAttributes = {
  username: string;
  email?: string | null;
};

type TeamAttributes = {
  name: string;
  slug?: string | null;
};

type MoodEntryAttributes = {
  moodValue: number;
  moodLabel: MoodLabel;
  context: MoodContext;
  isAnonymous: boolean;
  reasonSummary?: string | null;
  note?: string | null;
  loggedAt: string;
  visibility: VisibilitySettings;
  categories: {
    data: Array<StrapiCollectionItem<MoodCategoryAttributes>>;
  };
  additionalViewers?: {
    data: Array<StrapiCollectionItem<BasicUserAttributes>>;
  } | null;
  loggedBy?: {
    data: StrapiCollectionItem<BasicUserAttributes> | null;
  } | null;
  team?: {
    data: StrapiCollectionItem<TeamAttributes> | null;
  } | null;
};

const mapCategory = (item?: StrapiCollectionItem<MoodCategoryAttributes>): MoodCategory => ({
  id: item?.id ?? 0,
  name: item?.attributes.name ?? 'Catégorie',
  slug: item?.attributes.slug ?? `category-${item?.id ?? 0}`,
  description: item?.attributes.description ?? undefined,
  categoryType: item?.attributes.categoryType ?? 'other',
  icon: item?.attributes.icon ?? undefined,
  order: item?.attributes.order ?? undefined,
  isDefault: item?.attributes.isDefault ?? undefined,
});

const mapUser = (item?: StrapiCollectionItem<BasicUserAttributes>) =>
  item
    ? {
        id: item.id,
        username: item.attributes.username,
        email: item.attributes.email ?? undefined,
      }
    : undefined;

const mapTeam = (item?: StrapiCollectionItem<TeamAttributes>) =>
  item
    ? {
        id: item.id,
        name: item.attributes.name,
        slug: item.attributes.slug ?? undefined,
      }
    : undefined;

const mapMoodEntry = ({ id, attributes }: StrapiCollectionItem<MoodEntryAttributes>): MoodEntry => ({
  id,
  moodValue: attributes.moodValue,
  moodLabel: attributes.moodLabel,
  context: attributes.context,
  isAnonymous: attributes.isAnonymous,
  reasonSummary: attributes.reasonSummary ?? undefined,
  note: attributes.note ?? undefined,
  loggedAt: attributes.loggedAt,
  visibility: attributes.visibility,
  categories: attributes.categories?.data?.map(mapCategory) ?? [],
  additionalViewers:
    (attributes.additionalViewers?.data
      ?.map(mapUser)
      .filter(Boolean) as MoodEntry['additionalViewers']) ?? [],
  loggedBy: mapUser(attributes.loggedBy?.data) ?? null,
  team: mapTeam(attributes.team?.data) ?? null,
});

export const fetchMoodFeed = async (): Promise<MoodEntry[]> => {
  const response = await apiFetch<StrapiCollectionResponse<MoodEntryAttributes>>('/api/mood-entries', {
    query: {
      'pagination[pageSize]': 25,
    },
  });

  return response.data.map(mapMoodEntry);
};

export const fetchMoodHistory = async (): Promise<MoodEntry[]> => {
  const response = await apiFetch<StrapiCollectionResponse<MoodEntryAttributes>>('/api/mood-entries', {
    query: {
      sort: 'loggedAt:desc',
      'pagination[pageSize]': 100,
    },
  });

  return response.data.map(mapMoodEntry);
};

export const fetchMoodCategories = async (): Promise<MoodCategory[]> => {
  const response = await apiFetch<StrapiCollectionResponse<MoodCategoryAttributes>>('/api/mood-categories', {
    query: {
      sort: 'order:asc',
    },
  });

  return response.data.map(mapCategory);
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
  additionalViewers?: number[];
  team?: number | null;
};

export const createMoodEntry = async (payload: CreateMoodEntryPayload): Promise<MoodEntry> => {
  const { categories, additionalViewers, team, ...rest } = payload;

  const body = {
    data: {
      ...rest,
      categories,
      additionalViewers,
      team,
    },
  };

  const response = await apiFetch<StrapiSingleResponse<MoodEntryAttributes>>('/api/mood-entries', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.data) {
    throw new Error('Unable to create mood entry.');
  }

  return mapMoodEntry(response.data);
};
