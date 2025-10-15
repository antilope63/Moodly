import { useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MoodCard } from '@/components/mood/mood-card';
import { useMoodHistory } from '@/hooks/use-mood-history';
import { Palette } from '@/constants/theme';

const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return date;
  }
};

const computeAverageMood = (scores: number[]): number => {
  if (!scores.length) return 0;
  return Math.round((scores.reduce((acc, score) => acc + score, 0) / scores.length) * 10) / 10;
};

export default function HistoryScreen() {
  const { items, isLoading, error, refresh } = useMoodHistory();

  const groupedHistory = useMemo(() => {
    const groups = new Map<string, typeof items>();

    items.forEach((entry) => {
      const day = entry.loggedAt.slice(0, 10);
      if (!groups.has(day)) {
        groups.set(day, []);
      }
      groups.get(day)?.push(entry);
    });

    return Array.from(groups.entries())
      .map(([date, entries]) => ({ date, entries }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [items]);

  const averageScore = useMemo(() => computeAverageMood(items.map((item) => item.moodValue)), [items]);
  const positiveDays = useMemo(
    () => new Set(items.filter((item) => item.moodValue >= 4).map((item) => item.loggedAt.slice(0, 10))).size,
    [items]
  );
  const totalDays = new Set(items.map((item) => item.loggedAt.slice(0, 10))).size;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={groupedHistory}
        keyExtractor={(item) => item.date}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Mon historique</Text>
            <Text style={styles.subtitle}>Visualise tes humeurs et détecte les tendances.</Text>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.primarySummary]}>
                <Text style={styles.summaryLabel}>Mood moyen</Text>
                <Text style={styles.summaryValue}>{averageScore || '—'}</Text>
                <Text style={styles.summaryHint}>Basé sur {items.length} logs</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Journées positives</Text>
                <Text style={styles.summaryValue}>{positiveDays}</Text>
                <Text style={styles.summaryHint}>Sur {totalDays || '—'} jours logués</Text>
              </View>
            </View>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorTitle}>Impossible d’obtenir l’historique</Text>
                <Text style={styles.errorMessage}>{error.message}</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.dayCard}>
            <Text style={styles.dayTitle}>{formatDate(item.date)}</Text>
            {item.entries.map((entry) => (
              <View key={entry.id} style={styles.moodEntry}>
                <MoodCard mood={entry} />
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Commence à loguer</Text>
              <Text style={styles.emptySubtitle}>
                Ton historique apparaîtra ici dès ton premier enregistrement.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.whiteBackground,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    gap: 12,
    marginTop: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  subtitle: {
    color: Palette.textSecondary,
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Palette.mauvePastel,
    borderRadius: 20,
    padding: 18,
    gap: 6,
    shadowColor: Palette.bleuPastel,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  primarySummary: {
    backgroundColor: Palette.mauvePastel,
  },
  summaryLabel: {
    color: Palette.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  summaryHint: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
  dayCard: {
    gap: 12,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textPrimary,
    textTransform: 'capitalize',
  },
  moodEntry: {
    marginTop: 8,
  },
  empty: {
    backgroundColor: Palette.mauvePastel,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Palette.bleuClairPastel,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  emptySubtitle: {
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorMessage: {
    color: '#B91C1C',
    fontSize: 12,
  },
});
