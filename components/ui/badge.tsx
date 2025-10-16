import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

type BadgeProps = {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'info';
};

const toneStyles: Record<NonNullable<BadgeProps['tone']>, { backgroundColor: string; color: string }> = {
  default: { backgroundColor: Palette.bleuClairPastel, color: Palette.textPrimary },
  success: { backgroundColor: Palette.bleuPastel, color: Palette.textPrimary },
  warning: { backgroundColor: Palette.beigeRose, color: '#7A2F2F' },
  info: { backgroundColor: Palette.mauvePastel, color: Palette.textPrimary },
};

export const Badge = ({ label, tone = 'default' }: BadgeProps) => {
  const colors = toneStyles[tone] ?? toneStyles.default;
  return (
    <View style={[styles.base, { backgroundColor: colors.backgroundColor }]}>
      <Text style={[styles.text, { color: colors.color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
