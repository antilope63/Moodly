export type ReflectionOption = {
  key: string;
  emoji: string;
  message: string;
};

export const FREEDOM_OPTIONS: ReflectionOption[] = [
  {
    key: "free",
    emoji: "🙌",
    message: "Je me sens libre de m’organiser comme je veux aujourd’hui.",
  },
  {
    key: "mixed",
    emoji: "😐",
    message:
      "J’ai eu un peu de liberté, mais certaines décisions étaient imposées.",
  },
  {
    key: "tight",
    emoji: "😩",
    message: "J’ai dû suivre des consignes sans pouvoir donner mon avis.",
  },
];

export const SUPPORT_OPTIONS: ReflectionOption[] = [
  {
    key: "supported",
    emoji: "🌟",
    message: "Je me sens soutenu(e) par mon équipe / mon manager.",
  },
  {
    key: "neutral",
    emoji: "🙂",
    message: "Je me suis senti légèrement délaissé.",
  },
  {
    key: "isolated",
    emoji: "😞",
    message: "Je me suis senti isolé ou ignoré.",
  },
];

export const ENERGY_OPTIONS: ReflectionOption[] = [
  {
    key: "fresh",
    emoji: "🌿",
    message:
      "J’ai eu le temps de souffler et de garder un bon rythme aujourd’hui.",
  },
  {
    key: "busy",
    emoji: "😐",
    message: "La journée a été chargée, mais encore gérable.",
  },
  {
    key: "overwhelmed",
    emoji: "🫠",
    message: "J’ai eu la tête sous l’eau toute la journée.",
  },
];

const grouped = [...FREEDOM_OPTIONS, ...SUPPORT_OPTIONS, ...ENERGY_OPTIONS].reduce<
  Record<string, ReflectionOption>
>((acc, option) => {
  acc[option.key] = option;
  return acc;
}, {});

export const getReflectionOption = (key?: string | null): ReflectionOption | null => {
  if (!key) {
    return null;
  }
  return grouped[key] ?? null;
};
