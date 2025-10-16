import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MOOD_OPTIONS } from '@/constants/mood';
import { Palette } from '@/constants/theme';
import { createMoodEntry } from '@/services/mood';
import { useToastController } from '@tamagui/toast';
import type { VisibilitySettings } from '@/types/mood';

export const DEFAULT_VISIBILITY: VisibilitySettings = {
  shareMoodWithAll: true,
  showReasonToPeers: 'anonymized',
  showReasonToManagers: 'visible',
  showReasonToHr: 'visible',
  allowCustomRecipients: false,
};

type MoodPublisherCardProps = {
  greeting?: string;
  onPublished?: () => void | Promise<void>;
  onOpenForm?: () => void;
};

export const MoodPublisherCard = ({ greeting, onPublished, onOpenForm }: MoodPublisherCardProps) => {
  const toast = useToastController();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickPublish = async (value: number) => {
    const option = MOOD_OPTIONS.find((item) => item.value === value);
    if (!option) return;

    try {
      setSelectedMood(value);
      setIsSubmitting(true);
      await createMoodEntry({
        moodValue: option.value,
        moodLabel: option.label,
        context: 'professional',
        isAnonymous: false,
        reasonSummary: null,
        note: null,
        categories: [],
        visibility: DEFAULT_VISIBILITY,
      });

      if (onPublished) {
        await Promise.resolve(onPublished());
      }
      toast.show('Mood partagé', { description: "Ton emoji a été ajouté au feed de l'équipe." });
    } catch (err) {
      toast.show('Oups', { description: (err as Error).message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ton mood</Text>
        <Pressable onPress={onOpenForm} accessibilityRole="button">
          <Text style={styles.link}>Modifier</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Sélectionne l’emoji qui correspond le mieux à ta vibe du moment.</Text>
      <View style={styles.card}>
        {MOOD_OPTIONS.map((option) => {
          const isActive = selectedMood === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.moodButton, isActive && styles.moodButtonActive]}
              onPress={isSubmitting ? undefined : () => handleQuickPublish(option.value)}
              accessibilityLabel={option.title}
              accessibilityRole="button"
            >
              <Text style={[styles.moodEmoji, isActive && styles.moodEmojiActive]}>{option.emoji}</Text>
            </Pressable>
          );
        })}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#DED7FF',
    borderRadius: 32,
    padding: 24,
    gap: 18,
    shadowColor: '#00000022',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7165F2',
  },
  subtitle: {
    color: '#594F9F',
    fontSize: 13,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  moodButton: {
    flex: 1,
    backgroundColor: Palette.whiteBackground,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E4EA',
    height: 64,
    aspectRatio: 1,
    shadowColor: '#00000011',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  moodButtonActive: {
    backgroundColor: '#7165F2',
    borderColor: '#7165F2',
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodEmojiActive: {
    transform: [{ scale: 1.05 }],
  },
});
