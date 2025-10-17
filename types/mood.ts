export type MoodContext = 'personal' | 'professional' | 'mixed';

export type VisibilityLevel = 'hidden' | 'anonymized' | 'visible';

export type RoleType = 'employee' | 'manager' | 'hr' | 'admin';

export interface VisibilitySettings {
  shareMoodWithAll: boolean;
  showReasonToPeers: VisibilityLevel;
  showReasonToManagers: VisibilityLevel;
  showReasonToHr: VisibilityLevel;
  allowCustomRecipients: boolean;
}

export interface MoodCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  categoryType: 'personal' | 'professional' | 'wellbeing' | 'other';
  icon?: string | null;
  order?: number;
  isDefault?: boolean;
}

export interface BasicUser {
  id: string; // CORRIGÉ : Doit être un string pour l'UUID de Supabase
  username: string;
  email?: string;
  role?: RoleType;
  rawRole?: string | null; // Valeur brute renvoyée par Supabase (développement)
}

export interface TeamSummary {
  id: number;
  name: string;
  slug?: string;
}

export interface MoodEntry {
  id: number;
  moodValue: number;
  context: MoodContext;
  isAnonymous: boolean;
  reasonSummary?: string | null;
  note?: string | null;
  loggedAt: string;
  visibility: VisibilitySettings;
  categories: MoodCategory[];
  loggedBy?: BasicUser | null;
  additionalViewers?: BasicUser[];
  team?: TeamSummary | null;
}

export interface MoodTrend {
  label: string;
  averageScore: number;
  change: number;
}