import { StyleSheet, Text, View } from 'react-native';

type BadgeProps = {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'info';
};

const toneStyles: Record<NonNullable<BadgeProps['tone']>, { backgroundColor: string; color: string }> = {
  default: { backgroundColor: '#E2E8F0', color: '#0F172A' },
  success: { backgroundColor: '#DCFCE7', color: '#166534' },
  warning: { backgroundColor: '#FEF9C3', color: '#92400E' },
  info: { backgroundColor: '#DBEAFE', color: '#1E3A8A' },
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
