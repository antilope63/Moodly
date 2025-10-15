import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Palette } from '@/constants/theme';
import { MoodCard } from '@/components/mood/mood-card';
import { MoodPublisherCard } from '@/components/mood/mood-publisher-card';
import { useMoodFeed } from '@/hooks/use-mood-feed';
import { useProfileSummary } from '@/hooks/use-profile-summary';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'expo-router';

const sections = [
  { key: 'feed', title: 'Moodboard' },
  { key: 'profile', title: 'Profil' },
];

const formatRoleLabel = (role?: string | null) => {
  switch (role) {
    case 'manager':
      return 'Manager';
    case 'hr':
      return 'RH';
    case 'employee':
      return 'Employé';
    default:
      return role ?? undefined;
  }
};

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

type MoodFeedItem = ReturnType<typeof useMoodFeed>['moods'][number];
type MoodEntryData = { kind: 'heading' } | { kind: 'mood'; entry: MoodFeedItem };
type FeedListProps = {
  listRef: React.RefObject<FlatList<MoodEntryData>>;
  moods: MoodFeedItem[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  greeting: string;
  onOpenForm: () => void;
  onMoodPublished: () => Promise<void>;
};

const PINNED_CARD_HEIGHT = 200;

const FeedList = ({
  listRef,
  moods,
  isLoading,
  error,
  refresh,
  greeting,
  onOpenForm,
  onMoodPublished,
}: FeedListProps) => {
  const highlightId = useMemo(() => moods.at(0)?.id, [moods]);
  const data = useMemo<MoodEntryData[]>(
    () => [{ kind: 'heading' as const }, ...moods.map((entry) => ({ kind: 'mood' as const, entry }))],
    [moods]
  );

  return (
    <View style={styles.feedWrapper}>
      <View style={styles.fixedMoodCard}>
        <MoodPublisherCard greeting={greeting} onPublished={onMoodPublished} onOpenForm={onOpenForm} />
      </View>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item, index) => (item.kind === 'mood' ? String(item.entry.id) : `heading-${index}`)}
        renderItem={({ item }) =>
          item.kind === 'heading' ? (
            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>Mood des collègues</Text>
              <Text style={styles.feedSubtitle}>Dernières humeurs partagées</Text>
              {error ? <ErrorBanner message={error.message} /> : null}
              {!isLoading && !error && moods.length === 0 ? <EmptyPlaceholder /> : null}
            </View>
          ) : (
            <MoodCard
              mood={item.entry}
              highlightReason={item.entry.id === highlightId && Boolean(item.entry.reasonSummary)}
            />
          )
        }
        contentContainerStyle={[styles.listContent, { paddingTop: PINNED_CARD_HEIGHT + 24 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const ProfilePanel = ({
  userName,
  email,
  role,
  teamName,
  moodCount,
  isLoadingSummary,
  summaryError,
  onLogout,
  scrollRef,
}: {
  userName?: string | null;
  email?: string | null;
  role?: string | null;
  teamName?: string | null;
  moodCount?: number | null;
  isLoadingSummary?: boolean;
  summaryError?: Error | null;
  onLogout: () => void;
  scrollRef: React.RefObject<ScrollView>;
}) => (
  <ScrollView
    ref={scrollRef}
    contentContainerStyle={styles.profileContent}
    showsVerticalScrollIndicator={false}
    nestedScrollEnabled
  >
    <View style={styles.profileCard}>
      <Text style={styles.profileLabel}>Profil</Text>
      <Text style={styles.profileName}>{userName ?? 'Moodlover'}</Text>
      {email ? <Text style={styles.profileInfo}>{email}</Text> : null}
      <View style={styles.profileMeta}>
        <Text style={styles.profileInfo}>Rôle : {role ?? 'Non défini'}</Text>
        <Text style={styles.profileInfo}>Équipe : {teamName ?? 'Non renseignée'}</Text>
        <Text style={styles.profileInfo}>
          Humeurs loguées : {isLoadingSummary ? '—' : moodCount ?? 0}
        </Text>
        {summaryError ? (
          <Text style={styles.profileError}>Profil partiel : {summaryError.message}</Text>
        ) : null}
      </View>
    </View>

    <View style={styles.profileCard}>
      <Text style={styles.profileLabel}>Statut</Text>
      <Text style={styles.profileInfo}>
        Ta dernière humeur sera visible ici une fois publiée. Continue à partager pour alimenter le feed de l’équipe.
      </Text>
    </View>

    <Pressable style={styles.logoutButton} onPress={onLogout} accessibilityRole="button">
      <Text style={styles.logoutLabel}>Se déconnecter</Text>
    </Pressable>
  </ScrollView>
);

export default function FeedScreen() {
  const { user, logout } = useAuth();
  const { moods, isLoading, error, refresh } = useMoodFeed();
  const {
    summary,
    isLoading: isLoadingSummary,
    error: summaryError,
    refresh: refreshSummary,
  } = useProfileSummary();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const feedListRef = useRef<FlatList<MoodEntryData>>(null);
  const profileScrollRef = useRef<ScrollView>(null);
  const { width } = Dimensions.get('window');
  const profileRoleLabel = useMemo(
    () => summary?.roleLabel ?? formatRoleLabel(summary?.role ?? user?.role ?? undefined),
    [summary?.roleLabel, summary?.role, user?.role]
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), refreshSummary()]);
  }, [refresh, refreshSummary]);

  const handleMoodPublished = useCallback(async () => {
    await handleRefresh();
  }, [handleRefresh]);

  const handleOpenForm = useCallback(() => {
    router.push('/(tabs)/log');
  }, [router]);

  const resetScroll = useCallback(
    (index: number) => {
      if (index === 0) {
        feedListRef.current?.scrollToOffset({ offset: 0, animated: false });
      } else {
        profileScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      }
    },
    []
  );

  const handleSelectSection = useCallback(
    (index: number) => {
      setActiveIndex(index);
      pagerRef.current?.scrollTo({ x: width * index, animated: true });
      resetScroll(index);
    },
    [resetScroll, width]
  );

  const handleMomentumEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / width);
      if (nextIndex !== activeIndex) {
        setActiveIndex(nextIndex);
        resetScroll(nextIndex);
      }
    },
    [activeIndex, resetScroll, width]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topTabs}>
        {sections.map((section, index) => (
          <Pressable
            key={section.key}
            style={[styles.topTab, activeIndex === index && styles.topTabActive]}
            onPress={() => handleSelectSection(index)}
          >
            <Text style={[styles.topTabLabel, activeIndex === index && styles.topTabLabelActive]}>{section.title}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ flexGrow: 1 }}
        style={styles.pager}
      >
        <View style={[styles.page, { width }]}>
          <FeedList
            listRef={feedListRef}
            moods={moods}
            isLoading={isLoading}
            error={error}
            refresh={handleRefresh}
            greeting={`Bonjour ${user?.username ?? 'Moodlover'} 👋`}
            onOpenForm={handleOpenForm}
            onMoodPublished={handleMoodPublished}
          />
        </View>
        <View style={[styles.page, { width }]}>
          <ProfilePanel
            scrollRef={profileScrollRef}
            userName={user?.username}
            email={user?.email}
            role={profileRoleLabel ?? undefined}
            teamName={summary?.team?.name ?? null}
            moodCount={summary?.moodsCount ?? null}
            isLoadingSummary={isLoadingSummary}
            summaryError={summaryError}
            onLogout={logout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.whiteBackground,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  topTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#E2E6EE',
  },
  topTabActive: {
    backgroundColor: '#1C1C1F',
  },
  topTabLabel: {
    color: '#1C1C1F',
    fontSize: 16,
    fontWeight: '600',
  },
  topTabLabelActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  feedWrapper: {
    flex: 1,
  },
  fixedMoodCard: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    zIndex: 10,
    height: PINNED_CARD_HEIGHT,
    elevation: 6,
  },
  feedHeader: {
    gap: 4,
    marginBottom: 16,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  feedSubtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
  },
  separator: {
    height: 20,
  },
  empty: {
    backgroundColor: Palette.whiteBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
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
  profileContent: {
    padding: 24,
    gap: 16,
  },
  profileCard: {
    backgroundColor: Palette.mauvePastel,
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  profileInfo: {
    color: Palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  profileMeta: {
    gap: 4,
    marginTop: 8,
  },
  profileError: {
    color: '#D14343',
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: '#1C1C1F',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
