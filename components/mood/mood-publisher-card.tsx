import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { MOOD_OPTIONS } from '@/constants/mood';
import { Colors, Palette } from '@/constants/theme';
import { createMoodEntry } from '@/services/mood';
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
      Alert.alert('Mood partagé', "Ton emoji a été ajouté au feed de l'équipe.");
    } catch (err) {
      Alert.alert('Oups', (err as Error).message);
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
      <Text style={styles.hint}>Sélectionne l’emoji qui correspond le mieux à ta vibe du moment.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Palette.mauvePastel,
    borderRadius: 28,
    padding: 18,
    gap: 16,
    borderWidth: 2,
    borderColor: Palette.mauvePastel,
    shadowColor: Palette.bleuPastel,
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  greeting: {
    fontSize: 14,
    color: Palette.textSecondary,
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
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  moodButton: {
    flex: 1,
    backgroundColor: Palette.whiteBackground,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E4EA',
    height: 64,
    aspectRatio: 1,
  },
  moodButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodEmojiActive: {
    transform: [{ scale: 1.05 }],
  },
  hint: {
    textAlign: 'center',
    color: Palette.textSecondary,
    fontSize: 12,
  },
});
