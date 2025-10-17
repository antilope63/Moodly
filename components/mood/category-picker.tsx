import { StyleSheet, Text, View } from 'react-native';

import type { MoodCategory } from '@/types/mood';
import { Chip } from '@/components/ui/chip';
import { Palette } from '@/constants/theme';

type CategoryPickerProps = {
  categories: MoodCategory[];
  selected: number[];
  onChange: (nextSelected: number[]) => void;
};

export const CategoryPicker = ({ categories, selected, onChange }: CategoryPickerProps) => {
  const toggleCategory = (categoryId: number) => {
    if (selected.includes(categoryId)) {
      onChange(selected.filter((id) => id !== categoryId));
    } else {
      onChange([...selected, categoryId]);
    }
  };

  const sortedCategories = categories.slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pourquoi cette humeur ?</Text>
      <Text style={styles.subtitle}>
        Sélectionne une ou plusieurs raisons. Elles nous aident à détecter les tendances.
      </Text>
      <View style={styles.row}>
        {sortedCategories.map((category) => (
          <Chip
            key={category.id}
            label={`${category.icon ? `${category.icon} ` : ''}${category.name}`}
            selected={selected.includes(category.id)}
            onPress={() => toggleCategory(category.id)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    color: Palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: Palette.textSecondary,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
