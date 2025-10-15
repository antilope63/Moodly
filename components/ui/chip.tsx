import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { Palette } from '@/constants/theme';

type ChipProps = PressableProps & {
  label: string;
  selected?: boolean;
  leadingEmoji?: string;
};

export const Chip = ({ label, selected = false, leadingEmoji, style, ...rest }: ChipProps) => (
  <Pressable style={[styles.base, selected ? styles.selected : styles.unselected, style]} {...rest}>
    {leadingEmoji ? <Text style={[styles.emoji, selected && styles.selectedText]}>{leadingEmoji}</Text> : null}
    <Text style={[styles.label, selected && styles.selectedText]}>{label}</Text>
  </Pressable>
);

export const ChipGroup = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.group}>
    {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
    <View style={styles.groupRow}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unselected: {
    borderColor: Palette.bleuClairPastel,
    backgroundColor: '#FFFFFF',
  },
  selected: {
    borderColor: Palette.bleuMarin,
    backgroundColor: Palette.bleuMarin,
  },
  label: {
    color: Palette.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  emoji: {
    fontSize: 16,
  },
  group: {
    gap: 12,
  },
  groupTitle: {
    color: Palette.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  groupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
