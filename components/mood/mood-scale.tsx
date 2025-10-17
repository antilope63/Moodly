import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MOOD_OPTIONS } from '@/constants/mood';
import { Palette } from '@/constants/theme';

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
          style={[styles.item, isActive && styles.itemActive]}
          onPress={() => onChange(option.value)}>
          <View style={[styles.emojiBox, isActive && styles.emojiBoxActive]}>
            <Text style={styles.emoji}>{option.emoji}</Text>
          </View>
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
    alignItems: 'center',
    gap: 8,
  },
  itemActive: {},
  emojiBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Palette.whiteBackground,
    borderWidth: 1,
    borderColor: '#E0E4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiBoxActive: {
    backgroundColor: Palette.mauvePastel,
    borderColor: Palette.mauvePastel,
  },
  emoji: {
    fontSize: 26,
  },
  label: {
    fontSize: 12,
    color: Palette.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  labelActive: {
    color: Palette.textPrimary,
  },
});
