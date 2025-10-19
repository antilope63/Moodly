type MoodOption = {
  value: number;
  emoji: string;
  title: string;
  description: string;
  color: string;
};

export const MOOD_OPTIONS: MoodOption[] = [
  {
    value: 1,
    emoji: '😞',
    title: 'Horrible',
    description: 'Journée compliquée, besoin de soutien rapide.',
    color: '#DC2626',
  },
  {
    value: 2,
    emoji: '😕',
    title: 'Mauvais',
    description: 'Quelques blocages qui pèsent sur la journée.',
    color: '#F97316',
  },
  {
    value: 3,
    emoji: '😐',
    title: 'Stable',
    description: 'Journée neutre, rien de particulier à signaler.',
    color: '#FACC15',
  },
  {
    value: 4,
    emoji: '🙂',
    title: 'Bien',
    description: 'Bonnes choses en cours, énergie communicative.',
    color: '#22C55E',
  },
  {
    value: 5,
    emoji: '🤩',
    title: 'Excellent',
    description: 'Super vibe, envie de la partager à toute l’équipe.',
    color: '#6366F1',
  },
];

export const getMoodOptionByValue = (value: number): MoodOption =>
  MOOD_OPTIONS.find((option) => option.value === value) ?? MOOD_OPTIONS[2];
