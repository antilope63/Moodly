import type { MoodLabel } from '@/types/mood';

type MoodOption = {
  label: MoodLabel;
  value: number;
  emoji: string;
  title: string;
  description: string;
  color: string;
};

export const MOOD_OPTIONS: MoodOption[] = [
  {
    label: 'awful',
    value: 1,
    emoji: '😞',
    title: 'Très difficile',
    description: 'Journée compliquée, besoin de soutien rapide.',
    color: '#DC2626',
  },
  {
    label: 'rough',
    value: 2,
    emoji: '😕',
    title: 'Pas au top',
    description: 'Quelques blocages qui pèsent sur la journée.',
    color: '#F97316',
  },
  {
    label: 'neutral',
    value: 3,
    emoji: '😐',
    title: 'Stable',
    description: 'Journée neutre, rien de particulier à signaler.',
    color: '#FACC15',
  },
  {
    label: 'positive',
    value: 4,
    emoji: '🙂',
    title: 'Positive',
    description: 'Bonnes choses en cours, énergie communicative.',
    color: '#22C55E',
  },
  {
    label: 'great',
    value: 5,
    emoji: '🤩',
    title: 'Excellente',
    description: 'Super vibe, envie de la partager à toute l’équipe.',
    color: '#6366F1',
  },
];

export const getMoodOptionByLabel = (label: MoodLabel): MoodOption =>
  MOOD_OPTIONS.find((option) => option.label === label) ?? MOOD_OPTIONS[2];

export const getMoodOptionByValue = (value: number): MoodOption =>
  MOOD_OPTIONS.find((option) => option.value === value) ?? MOOD_OPTIONS[2];
