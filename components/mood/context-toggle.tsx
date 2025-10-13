import { StyleSheet, Text, View } from 'react-native';

import type { MoodContext } from '@/types/mood';
import { Chip } from '@/components/ui/chip';

type MoodContextToggleProps = {
  value: MoodContext;
  onChange: (context: MoodContext) => void;
};

const OPTIONS: { value: MoodContext; label: string; emoji: string; description: string }[] = [
  { value: 'professional', label: 'Pro', emoji: '💼', description: 'Contexte lié au travail.' },
  { value: 'personal', label: 'Perso', emoji: '🏠', description: 'Contexte personnel ou familial.' },
  { value: 'mixed', label: 'Mixte', emoji: '⚖️', description: 'Mélange pro/perso.' },
];

export const MoodContextToggle = ({ value, onChange }: MoodContextToggleProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>Quel contexte ?</Text>
    <Text style={styles.subtitle}>Tu peux préciser si ton ressenti est plutôt pro, perso ou mixte.</Text>
    <View style={styles.row}>
      {OPTIONS.map((option) => (
        <Chip
          key={option.value}
          label={`${option.emoji} ${option.label}`}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
    <Text style={styles.description}>{OPTIONS.find((option) => option.value === value)?.description}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#475569',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  description: {
    color: '#475569',
    fontSize: 12,
  },
});
