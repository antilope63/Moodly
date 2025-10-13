import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MOOD_OPTIONS } from '@/constants/mood';

type MoodScaleProps = {
  value: number;
  onChange: (value: number) => void;
};

export const MoodScale = ({ value, onChange }: MoodScaleProps) => (
  <View style={styles.container}>
    {MOOD_OPTIONS.map((option) => {
      const isActive = option.value === value;

      return (
        <Pressable
          key={option.value}
          accessibilityLabel={option.title}
          style={[styles.item, isActive && [{ backgroundColor: option.color }]]}
          onPress={() => onChange(option.value)}>
          <Text style={[styles.emoji, isActive ? styles.emojiActive : styles.emojiInactive]}>
            {option.emoji}
          </Text>
          <Text style={[styles.label, isActive && styles.labelActive]}>{option.title}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  item: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  emoji: {
    fontSize: 24,
  },
  emojiActive: {
    color: '#fff',
  },
  emojiInactive: {
    color: '#1E293B',
  },
  label: {
    fontSize: 12,
    color: '#0F172A',
    textAlign: 'center',
    fontWeight: '600',
  },
  labelActive: {
    color: '#fff',
  },
});
