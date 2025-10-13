import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { MoodCard } from '@/components/mood/mood-card';
import { useMoodFeed } from '@/hooks/use-mood-feed';
import { useAuth } from '@/providers/auth-provider';

const Header = ({
  name,
  lastUpdated,
  totalPosts,
}: {
  name?: string;
  lastUpdated?: Date;
  totalPosts: number;
}) => (
  <View style={styles.header}>
    <Text style={styles.greeting}>Bonjour {name ?? 'Moodlover'} 👋</Text>
    <Text style={styles.subtitle}>Voici le pouls de ton équipe aujourd’hui.</Text>
    <View style={styles.summaryRow}>
      <Badge label={`${totalPosts} humeurs loguées`} tone="info" />
      {lastUpdated ? <Text style={styles.updatedAt}>Mise à jour {lastUpdated.toLocaleTimeString()}</Text> : null}
    </View>
  </View>
);

const EmptyPlaceholder = () => (
  <View style={styles.empty}>
    <Text style={styles.emptyTitle}>Aucun log pour l’instant</Text>
    <Text style={styles.emptySubtitle}>Encourage ton équipe à partager son humeur aujourd’hui.</Text>
  </View>
);

const ErrorBanner = ({ message }: { message: string }) => (
  <View style={styles.errorBanner}>
    <Text style={styles.errorTitle}>Impossible de charger le feed</Text>
    <Text style={styles.errorMessage}>{message}</Text>
  </View>
);

export default function FeedScreen() {
  const { user } = useAuth();
  const { moods, isLoading, error, refresh, lastUpdated } = useMoodFeed();

  const highlightId = useMemo(() => moods.at(0)?.id, [moods]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={moods}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <MoodCard mood={item} highlightReason={item.id === highlightId && Boolean(item.reasonSummary)} />
        )}
        ListHeaderComponent={
          <>
            <Header name={user?.username} lastUpdated={lastUpdated} totalPosts={moods.length} />
            {error ? <ErrorBanner message={error.message} /> : null}
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Fil des humeurs</Text>
              <Text style={styles.sectionSubtitle}>Dernières 24h</Text>
            </View>
          </>
        }
        ListEmptyComponent={!isLoading && !error ? <EmptyPlaceholder /> : null}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    paddingTop: 12,
    gap: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  updatedAt: {
    color: '#475569',
    fontSize: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  separator: {
    height: 20,
  },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 20,
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
    borderRadius: 20,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorMessage: {
    color: '#B91C1C',
    fontSize: 13,
  },
});
