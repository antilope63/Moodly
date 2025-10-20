import { getAnonymizedAuthorToken, getAnonymizedEmailCipher } from '@/lib/anonymization';
import { supabase } from '@/lib/supabase';
import type {
  BasicUser,
  MoodContext,
  MoodEntry,
  MoodEntrySource,
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
  team_id?: number | null;
  user_id?: string; // pour enrichir loggedBy
  user_email?: string | null;
};

type DbMoodEntryRow = DbMoodEntry & {
  team?: { id: number; name: string; slug?: string | null } | null;
};

type AnonymousDbMoodEntry = Omit<DbMoodEntry, 'user_id' | 'user_email'> & {
  author_token: string;
  author_email_cipher?: string | null;
};

type AnonymousDbMoodEntryRow = AnonymousDbMoodEntry & {
  team?: { id: number; name: string; slug?: string | null } | null;
};

const normalizeTeam = (teamRaw: any) => {
  if (!teamRaw) return null;
  const team = Array.isArray(teamRaw) ? teamRaw[0] ?? null : teamRaw;
  if (!team) return null;
  return {
    id: Number(team.id),
    name: String(team.name),
    slug: (team.slug as string | null) ?? null,
  };
};

const mapDbRowToMoodEntry = (
  row: DbMoodEntryRow | AnonymousDbMoodEntryRow,
  source: MoodEntrySource,
  overrides: Partial<MoodEntry> = {},
): MoodEntry => {
  const base: MoodEntry = {
    id: row.id,
    moodValue: row.mood_value,
    context: row.context,
    isAnonymous: source === 'anonymous' ? true : row.is_anonymous,
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
    source,
  };
  return { ...base, ...overrides, source };
};

// Normalise la forme renvoyée par Supabase (team parfois tableau si FK absente)
const normalizeDbRow = (row: any): DbMoodEntryRow => {
  return {
    id: row.id,
    mood_value: row.mood_value,
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
  team_id: row.team_id,
  user_id: row.user_id,
  user_email: row.user_email,
  team: normalizeTeam(row.team),
  } as DbMoodEntryRow;
};

const normalizeAnonymousDbRow = (row: any): AnonymousDbMoodEntryRow => ({
  id: row.id,
  mood_value: row.mood_value,
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
  team_id: row.team_id,
  author_token: row.author_token,
  author_email_cipher: row.author_email_cipher,
  team: normalizeTeam(row.team),
});

const moodEntrySelect =
  'id, mood_value, context, is_anonymous, reason_summary, note, logged_at, visibility, freedom_choice, support_choice, energy_choice, pride_percent, team_id, user_id, user_email, team:teams(id,name,slug)';

const anonymousMoodEntrySelect =
  'id, mood_value, context, is_anonymous, reason_summary, note, logged_at, visibility, freedom_choice, support_choice, energy_choice, pride_percent, team_id, author_token, author_email_cipher, team:teams(id,name,slug)';

export const fetchMoodFeed = async (): Promise<MoodEntry[]> => {
  // Récupère l'utilisateur connecté (uuid/email)
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);

  // Si pas connecté, on retourne un feed vide
  const currentUser = authData?.user;
  if (!currentUser) {
    return [];
  }

  const currentUserAnonToken = await getAnonymizedAuthorToken(currentUser.id).catch((error) => {
    throw error;
  });

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
    .neq('user_id', currentUser.id)
    .gte('logged_at', todayStart.toISOString())
    .lt('logged_at', todayEnd.toISOString())
    .order('logged_at', { ascending: false })
    .limit(25) as any;

  if (adminIds.length > 0) {
    const inList = `(${adminIds.map((id) => `"${id}"`).join(',')})`;
    query = query.not('user_id', 'in', inList);
  }

  const [{ data, error }, { data: anonymousData, error: anonymousError }] = await Promise.all([
    query,
    supabase
      .from('anonymous_mood_entries')
      .select(anonymousMoodEntrySelect)
      .eq('team_id', teamId)
      .gte('logged_at', todayStart.toISOString())
      .lt('logged_at', todayEnd.toISOString())
      .order('logged_at', { ascending: false })
      .limit(25)
      .neq('author_token', currentUserAnonToken),
  ]);

  if (error) throw new Error(error.message);
  if (anonymousError) throw new Error(anonymousError.message);

  const rows = (data ?? []) as any[];
  const anonymousRows = (anonymousData ?? []) as any[];
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

  const standardEntries = rows.map((row: any) => {
    const normalized = normalizeDbRow(row);
    const profile = row.user_id ? profilesMap.get(row.user_id as string) : undefined;
    const fallbackUsername = (row.user_email as string | null)?.split('@')[0] ?? 'Anonyme';
    const loggedBy: BasicUser | null = row.user_id
      ? {
          id: row.user_id as string,
          username: profile?.username || fallbackUsername,
          email: profile?.email || (row.user_email as string | undefined),
          role: undefined,
          rawRole: null,
        }
      : null;
    return mapDbRowToMoodEntry(normalized, 'standard', { loggedBy });
  });

  const anonymousEntries = anonymousRows.map((row: any) => {
    const normalized = normalizeAnonymousDbRow(row);
    return mapDbRowToMoodEntry(normalized, 'anonymous', { loggedBy: null });
  });

  const combined = [...standardEntries, ...anonymousEntries];
  combined.sort(
    (a, b) =>
      new Date(b.loggedAt).getTime() -
      new Date(a.loggedAt).getTime(),
  );
  return combined.slice(0, 25);
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

  const authorToken = await getAnonymizedAuthorToken(me.id);

  const [{ data, error }, { data: anonymousData, error: anonymousError }] = await Promise.all([
    supabase
      .from('mood_entries')
      .select(moodEntrySelect)
      .eq('user_id', me.id)
      .gte('logged_at', start.toISOString())
      .lt('logged_at', end.toISOString())
      .order('logged_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('anonymous_mood_entries')
      .select(anonymousMoodEntrySelect)
      .eq('author_token', authorToken)
      .gte('logged_at', start.toISOString())
      .lt('logged_at', end.toISOString())
      .order('logged_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (error && (error as any).code !== 'PGRST116') throw new Error(error.message);
  if (anonymousError && (anonymousError as any).code !== 'PGRST116') throw new Error(anonymousError.message);

  if (data) {
    return mapDbRowToMoodEntry(normalizeDbRow(data), 'standard');
  }
  if (anonymousData) {
    return mapDbRowToMoodEntry(normalizeAnonymousDbRow(anonymousData), 'anonymous');
  }
  return null;
};
export const updateMoodEntry = async (
  id: number,
  payload: UpdateMoodEntryPayload,
): Promise<MoodEntry> => {
  const source: MoodEntrySource = payload.source ?? 'standard';
  const targetIsAnonymous = payload.isAnonymous;

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

  if (source === 'standard' && !targetIsAnonymous) {
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
    return mapDbRowToMoodEntry(normalizeDbRow(data), 'standard');
  }

  if (source === 'anonymous' && targetIsAnonymous) {
    const { error: upError } = await supabase
      .from('anonymous_mood_entries')
      .update(updatePayload)
      .eq('id', id);
    if (upError) throw new Error(upError.message);

    const { data, error } = await supabase
      .from('anonymous_mood_entries')
      .select(anonymousMoodEntrySelect)
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return mapDbRowToMoodEntry(normalizeAnonymousDbRow(data), 'anonymous');
  }

  if (source === 'standard' && targetIsAnonymous) {
    const { data: existing, error: existingError } = await supabase
      .from('mood_entries')
      .select('team_id, user_id, user_email')
      .eq('id', id)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (!existing) throw new Error("Publication introuvable pour la convertir en anonyme.");

    const authorToken = await getAnonymizedAuthorToken(existing.user_id as string);
    const emailCipher = await getAnonymizedEmailCipher(
      payload.userEmail ?? (existing.user_email as string | null) ?? null,
    );

    const insertPayload = {
      team_id: existing.team_id,
      author_token: authorToken,
      author_email_cipher: emailCipher,
      ...updatePayload,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('anonymous_mood_entries')
      .insert(insertPayload)
      .select(anonymousMoodEntrySelect)
      .single();
    if (insertError || !inserted) throw new Error(insertError?.message ?? 'Conversion impossible.');

    const { error: deleteError } = await supabase
      .from('mood_entries')
      .delete()
      .eq('id', id);
    if (deleteError) {
      await supabase.from('anonymous_mood_entries').delete().eq('id', inserted.id).catch(() => {});
      throw new Error(deleteError.message);
    }

    return mapDbRowToMoodEntry(normalizeAnonymousDbRow(inserted), 'anonymous');
  }

  if (source === 'anonymous' && !targetIsAnonymous) {
    const { data: existing, error: existingError } = await supabase
      .from('anonymous_mood_entries')
      .select('team_id')
      .eq('id', id)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (!existing) throw new Error("Publication anonyme introuvable pour la convertir.");

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(authError.message);
    const me = authData?.user;
    if (!me) {
      throw new Error("Utilisateur non authentifié pour convertir la publication.");
    }

    const insertPayload = {
      team_id: existing.team_id,
      user_id: me.id,
      user_email: payload.userEmail ?? me.email ?? null,
      ...updatePayload,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('mood_entries')
      .insert(insertPayload)
      .select(moodEntrySelect)
      .single();
    if (insertError || !inserted) throw new Error(insertError?.message ?? 'Conversion impossible.');

    const { error: deleteError } = await supabase
      .from('anonymous_mood_entries')
      .delete()
      .eq('id', id);
    if (deleteError) {
      await supabase.from('mood_entries').delete().eq('id', inserted.id).catch(() => {});
      throw new Error(deleteError.message);
    }

    return mapDbRowToMoodEntry(normalizeDbRow(inserted), 'standard');
  }

  throw new Error("Type de publication inconnu ou non pris en charge.");
};

export const fetchMoodEntryById = async (id: number): Promise<MoodEntry | null> => {
  const { data, error } = await supabase
    .from('mood_entries')
    .select(moodEntrySelect)
    .eq('id', id)
    .maybeSingle();
  if (error && (error as any).code !== 'PGRST116') throw new Error(error.message);
  if (data) {
    return mapDbRowToMoodEntry(normalizeDbRow(data), 'standard');
  }

  const { data: anonymousData, error: anonymousError } = await supabase
    .from('anonymous_mood_entries')
    .select(anonymousMoodEntrySelect)
    .eq('id', id)
    .maybeSingle();
  if (anonymousError && (anonymousError as any).code !== 'PGRST116') {
    throw new Error(anonymousError.message);
  }
  if (!anonymousData) return null;
  return mapDbRowToMoodEntry(normalizeAnonymousDbRow(anonymousData), 'anonymous');
};

export const fetchMoodHistory = async (): Promise<MoodEntry[]> => {
  const [{ data, error }, { data: anonymousData, error: anonymousError }] = await Promise.all([
    supabase
      .from('mood_entries')
      .select(moodEntrySelect)
      .order('logged_at', { ascending: false })
      .limit(100),
    supabase
      .from('anonymous_mood_entries')
      .select(anonymousMoodEntrySelect)
      .order('logged_at', { ascending: false })
      .limit(100),
  ]);
  if (error) throw new Error(error.message);
  if (anonymousError) throw new Error(anonymousError.message);

  const standardEntries = (data ?? []).map((row: any) =>
    mapDbRowToMoodEntry(normalizeDbRow(row), 'standard'),
  );
  const anonymousEntries = (anonymousData ?? []).map((row: any) =>
    mapDbRowToMoodEntry(normalizeAnonymousDbRow(row), 'anonymous'),
  );
  const combined = [...standardEntries, ...anonymousEntries];
  combined.sort(
    (a, b) =>
      new Date(b.loggedAt).getTime() -
      new Date(a.loggedAt).getTime(),
  );
  return combined;
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
  userEmail?: string | null;
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
  source?: MoodEntrySource;
  userEmail?: string | null;
};

export const createMoodEntry = async (
  payload: CreateMoodEntryPayload,
): Promise<MoodEntry> => {
  const { teamId: explicitTeamId, userId, userEmail, ...rest } = payload;

  let resolvedUserId = userId;
  let resolvedEmail = userEmail ?? null;
  if (!resolvedUserId) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(authError.message);
    if (!authData?.user) {
      throw new Error('Connecte-toi pour partager ton humeur.');
    }
    resolvedUserId = authData.user.id;
    resolvedEmail = authData.user.email ?? null;
  } else if (!resolvedEmail) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (!authError && authData?.user?.id === resolvedUserId) {
      resolvedEmail = authData.user.email ?? null;
    }
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

  const commonPayload = {
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

  if (rest.isAnonymous) {
    const authorToken = await getAnonymizedAuthorToken(resolvedUserId);
    const emailCipher = await getAnonymizedEmailCipher(resolvedEmail);
    const insertPayload = {
      ...commonPayload,
      author_token: authorToken,
      author_email_cipher: emailCipher,
    };

    const { data, error } = await supabase
      .from('anonymous_mood_entries')
      .insert(insertPayload)
      .select(anonymousMoodEntrySelect)
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? 'Impossible de créer ton humeur.');
    }

    return mapDbRowToMoodEntry(normalizeAnonymousDbRow(data), 'anonymous');
  }

  const insertPayload = {
    ...commonPayload,
    user_id: resolvedUserId,
    user_email: resolvedEmail,
  };

  const { data, error } = await supabase
    .from('mood_entries')
    .insert(insertPayload)
    .select(moodEntrySelect)
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Impossible de créer ton humeur.');
  }

  return mapDbRowToMoodEntry(normalizeDbRow(data), 'standard');
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

  let anonymousCount = 0;
  try {
    const authorToken = await getAnonymizedAuthorToken(authData.user.id);
    const { count: aCount, error: anonCountError } = await supabase
      .from('anonymous_mood_entries')
      .select('id', { head: true, count: 'exact' })
      .eq('author_token', authorToken);
    if (anonCountError) {
      throw anonCountError;
    }
    anonymousCount = aCount ?? 0;
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }

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
    moodsCount: (count ?? 0) + anonymousCount,
    username,
    email,
  };
};
