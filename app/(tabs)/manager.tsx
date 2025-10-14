import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase'; // <- assure-toi d'avoir un client supabase initialisé (auth à jour)
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type DailyAverage = { day: string; avg_score: number };
type PersonAverage = { display_name: string; avg_score: number; entries: number };

const formatDay = (isoDate: string) => {
  try {
    return new Date(isoDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch {
    return isoDate;
  }
};

export default function ManagerScreen() {
  const [daily, setDaily] = useState<DailyAverage[]>([]);
  const [people, setPeople] = useState<PersonAverage[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // RPC 1: daily trend (30j)
      const { data: d1, error: e1 } = await supabase.rpc('manager_daily_averages_30d');
      if (e1) throw e1;

      // RPC 2: people averages (30j)
      const { data: d2, error: e2 } = await supabase.rpc('manager_people_averages_30d');
      if (e2) throw e2;

      setDaily(d1 ?? []);
      setPeople(d2 ?? []);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lastTenDays = useMemo(() => {
    // on ne montre que les 10 plus récents pour garder un graph lisible
    return (daily ?? []).slice(-10);
  }, [daily]);

  const teamAverage = useMemo(() => {
    if (!daily?.length) return 0;
    const avg =
      daily.reduce((sum, d) => sum + (Number(d.avg_score) || 0), 0) / daily.length;
    return Math.round(avg * 10) / 10;
  }, [daily]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={people}
        keyExtractor={(item) => item.display_name}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchData} />}
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
                <Text style={styles.summaryLabel}>Jours avec logs</Text>
                <Text style={styles.summaryValue}>{daily?.length ?? 0}</Text>
                <Text style={styles.summaryHint}>Sur les 30 derniers jours</Text>
              </View>
            </View>

            <View style={styles.graphCard}>
              <Text style={styles.graphTitle}>Mood trend (30 jours)</Text>
              <View style={styles.graphBaseline}>
                {lastTenDays.map((d) => {
                  const height = Math.max(((Number(d.avg_score) || 0) / 5) * 120, 8);
                  return (
                    <View key={d.day} style={styles.graphColumn}>
                      <View style={[styles.graphBar, { height }]} />
                      <Text style={styles.graphLabel}>{formatDay(d.day)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorTitle}>Données partielles</Text>
                <Text style={styles.errorMessage}>{errorMsg}</Text>
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
              <Text style={styles.personName}>{item.display_name}</Text>
              <Text style={styles.personHint}>{item.entries} logs</Text>
            </View>
            <Badge
              label={String(item.avg_score)}
              tone={
                Number(item.avg_score) >= 4
                  ? 'success'
                  : Number(item.avg_score) >= 3
                  ? 'info'
                  : 'warning'
              }
            />
          </View>
        )}
        ListEmptyComponent={
          !isLoading && !errorMsg ? (
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
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  header: { gap: 16, marginTop: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#0F172A' },
  subtitle: { color: '#475569', fontSize: 14 },
  summaryRow: { flexDirection: 'row', gap: 12 },
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
  primarySummary: { backgroundColor: '#E0F2FE' },
  summaryLabel: { color: '#0F172A', fontSize: 14, fontWeight: '600' },
  summaryValue: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  summaryHint: { color: '#475569', fontSize: 12 },
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
  graphTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  graphBaseline: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  graphColumn: { alignItems: 'center', gap: 6, flex: 1 },
  graphBar: { width: '100%', borderRadius: 12, backgroundColor: '#2563EB', minHeight: 6 },
  graphLabel: { fontSize: 11, color: '#64748B' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  sectionHint: { color: '#475569', fontSize: 12 },
  personRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', padding: 16, borderRadius: 18,
    shadowColor: '#0F172A', shadowOpacity: 0.03, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  personDetails: { gap: 4 },
  personName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  personHint: { color: '#64748B', fontSize: 12 },
  empty: { backgroundColor: '#fff', borderRadius: 18, padding: 24, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  emptySubtitle: { color: '#475569', textAlign: 'center' },
  errorBanner: { backgroundColor: '#FEF2F2', borderRadius: 18, padding: 14, gap: 4 },
  errorTitle: { color: '#B91C1C', fontWeight: '700' },
  errorMessage: { color: '#EF4444', fontSize: 12 },
});