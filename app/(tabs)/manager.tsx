import { useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Badge } from '@/components/ui/badge';
import { useMoodHistory } from '@/hooks/use-mood-history';

type DailyAverage = {
  date: string;
  score: number;
};

const formatDay = (date: string) => {
  try {
    return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch {
    return date;
  }
};

const getLastThirtyDays = (items: ReturnType<typeof useMoodHistory>['items']): DailyAverage[] => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dayMap = new Map<string, number[]>();

  items.forEach((item) => {
    const day = item.loggedAt.slice(0, 10);
    const loggedDate = new Date(item.loggedAt);
    if (loggedDate >= thirtyDaysAgo) {
      if (!dayMap.has(day)) {
        dayMap.set(day, []);
      }
      dayMap.get(day)?.push(item.moodValue);
    }
  });

  return Array.from(dayMap.entries())
    .map(([date, scores]) => ({
      date,
      score: scores.reduce((sum, value) => sum + value, 0) / scores.length,
    }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
};

export default function ManagerScreen() {
  const { items, isLoading, error, refresh } = useMoodHistory();

  const lastThirtyDays = useMemo(() => getLastThirtyDays(items), [items]);
  const teamAverage = useMemo(() => {
    if (!lastThirtyDays.length) return 0;
    return Math.round(
      (lastThirtyDays.reduce((sum, day) => sum + day.score, 0) / lastThirtyDays.length) * 10
    ) / 10;
  }, [lastThirtyDays]);

  const peopleMood = useMemo(() => {
    const map = new Map<string, number[]>();
    items.forEach((entry) => {
      const key = entry.loggedBy?.username ?? 'Anonyme';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(entry.moodValue);
    });

    return Array.from(map.entries())
      .map(([name, scores]) => ({
        name,
        average: Math.round((scores.reduce((acc, score) => acc + score, 0) / scores.length) * 10) / 10,
        entries: scores.length,
      }))
      .sort((a, b) => b.average - a.average);
  }, [items]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={peopleMood}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Vue manager</Text>
            <Text style={styles.subtitle}>
              Un graphique unique et modulable pour piloter le moral des 30 derniers jours.
            </Text>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.primarySummary]}>
                <Text style={styles.summaryLabel}>Moyenne équipe</Text>
                <Text style={styles.summaryValue}>{teamAverage || '—'}</Text>
                <Text style={styles.summaryHint}>Score moyen sur 30 jours</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Logs 30 derniers jours</Text>
                <Text style={styles.summaryValue}>{lastThirtyDays.length}</Text>
                <Text style={styles.summaryHint}>Jours avec humeur renseignée</Text>
              </View>
            </View>

            <View style={styles.graphCard}>
              <Text style={styles.graphTitle}>Mood trend (30 jours)</Text>
              <View style={styles.graphBaseline}>
                {lastThirtyDays.slice(-10).map((day) => {
                  const height = Math.max((day.score / 5) * 120, 8);
                  return (
                    <View key={day.date} style={styles.graphColumn}>
                      <View style={[styles.graphBar, { height }]} />
                      <Text style={styles.graphLabel}>{formatDay(day.date)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorTitle}>Données partielles</Text>
                <Text style={styles.errorMessage}>{error.message}</Text>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Focus collaborateurs</Text>
              <Text style={styles.sectionHint}>Classement par mood moyen</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.personRow}>
            <View style={styles.personDetails}>
              <Text style={styles.personName}>{item.name}</Text>
              <Text style={styles.personHint}>{item.entries} logs</Text>
            </View>
            <Badge label={String(item.average)} tone={item.average >= 4 ? 'success' : item.average >= 3 ? 'info' : 'warning'} />
          </View>
        )}
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Pas encore de données</Text>
              <Text style={styles.emptySubtitle}>
                Encourage ton équipe à loguer pour débloquer la vue manager.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    gap: 16,
    marginTop: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    gap: 6,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primarySummary: {
    backgroundColor: '#E0F2FE',
  },
  summaryLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryHint: {
    color: '#475569',
    fontSize: 12,
  },
  graphCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  graphBaseline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  graphColumn: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  graphBar: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#2563EB',
    minHeight: 6,
  },
  graphLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHint: {
    color: '#475569',
    fontSize: 12,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  personDetails: {
    gap: 4,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  personHint: {
    color: '#64748B',
    fontSize: 12,
  },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    color: '#475569',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  errorTitle: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: 12,
  },
});
