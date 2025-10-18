import { useCallback, useMemo, useRef, useState } from "react";
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
} from "react-native";

import { MoodCard } from "@/components/mood/mood-card";
import { MoodPublisherCard } from "@/components/mood/mood-publisher-card";
import { Palette } from "@/constants/theme";
import { useMoodFeed } from "@/hooks/use-mood-feed";
import { useAuth } from "@/providers/auth-provider";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AdminScreen from "./admin";
import { ProfileDashboard } from "./profile";

const BASE_SECTIONS = [
  { key: "feed", title: "Moodboard" },
  { key: "profile", title: "Profil" },
];

const EmptyPlaceholder = () => (
  <View style={styles.empty}>
    <Text style={styles.emptyTitle}>Aucun log pour l’instant</Text>
    <Text style={styles.emptySubtitle}>
      Encourage ton équipe à partager son humeur aujourd’hui.
    </Text>
  </View>
);

const ErrorBanner = ({ message }: { message: string }) => (
  <View style={styles.errorBanner}>
    <Text style={styles.errorTitle}>Impossible de charger le feed</Text>
    <Text style={styles.errorMessage}>{message}</Text>
  </View>
);

type MoodFeedItem = ReturnType<typeof useMoodFeed>["moods"][number];
type FeedListProps = {
  listRef: React.RefObject<FlatList<MoodFeedItem> | null>;
  moods: MoodFeedItem[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  greeting: string;
  onOpenForm: () => void;
  canPublish: boolean;
};

const FeedList = ({
  listRef,
  moods,
  isLoading,
  error,
  refresh,
  greeting,
  onOpenForm,
  canPublish = true,
}: FeedListProps) => {
  const highlightId = useMemo(() => moods.at(0)?.id, [moods]);

  return (
    <FlatList
      ref={listRef}
      data={moods}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <MoodCard
            mood={item}
            highlightReason={
              item.id === highlightId && Boolean(item.reasonSummary)
            }
          />
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          {Boolean(canPublish) ? (
            <View style={styles.publisherSection}>
              <Text style={styles.greetingHeadline}>{greeting}</Text>
              <MoodPublisherCard onOpenForm={onOpenForm} />
            </View>
          ) : null}
          <View style={styles.feedHeader}>
            <Text style={styles.feedTitle}>Mood des collègues</Text>
            <Text style={styles.feedSubtitle}>Dernières humeurs partagées</Text>
            {error ? <ErrorBanner message={error.message} /> : null}
          </View>
        </View>
      }
      ListEmptyComponent={!isLoading && !error ? <EmptyPlaceholder /> : null}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

export default function FeedScreen() {
  const { user } = useAuth();
  const { moods, isLoading, error, refresh } = useMoodFeed();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const feedListRef = useRef<FlatList<MoodFeedItem>>(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const { width } = Dimensions.get("window");

  const sections = useMemo(() => {
    const base = BASE_SECTIONS.slice();
    const raw = user?.rawRole?.toLowerCase();
    const role = user?.role?.toLowerCase();
    if (raw === "super_admin" || raw === "admin" || role === "admin") {
      base.push({ key: "admin", title: "Admin" });
    }
    return base;
  }, [user?.rawRole, user?.role]);

  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
    } finally {
      setProfileRefreshKey((value) => value + 1);
    }
  }, [refresh]);

  // Rafraîchit le feed à chaque retour sur cet onglet
  useFocusEffect(
    useCallback(() => {
      void handleRefresh();
    }, [handleRefresh])
  );

  const resetScroll = useCallback((index: number) => {
    if (index === 0) {
      feedListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, []);

  const handleOpenForm = useCallback(() => {
    router.push("/(tabs)/log");
  }, [router]);

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
            style={[
              styles.topTab,
              activeIndex === index && styles.topTabActive,
            ]}
            onPress={() => handleSelectSection(index)}
          >
            <Text
              style={[
                styles.topTabLabel,
                activeIndex === index && styles.topTabLabelActive,
              ]}
            >
              {section.title}
            </Text>
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
            greeting={`Bonjour ${user?.username ?? "Moodlover"} 👋`}
            onOpenForm={handleOpenForm}
            canPublish={user?.role !== "admin" && user?.rawRole !== "admin"}
          />
        </View>
        <View style={[styles.page, { width }]}>
          <ProfileDashboard embedded refreshKey={profileRefreshKey} />
        </View>
        {(() => {
          const raw = user?.rawRole?.toLowerCase();
          const role = user?.role?.toLowerCase();
          return raw === "super_admin" || raw === "admin" || role === "admin";
        })() ? (
          <View style={[styles.page, { width }]}>
            <AdminScreen />
          </View>
        ) : null}
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
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#E2E6EE",
  },
  topTabActive: {
    backgroundColor: "#1C1C1F",
  },
  topTabLabel: {
    color: "#1C1C1F",
    fontSize: 16,
    fontWeight: "600",
  },
  topTabLabelActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 24,
  },
  listHeader: {
    gap: 24,
    marginBottom: 12,
  },
  publisherSection: {
    gap: 16,
  },
  greetingHeadline: {
    fontSize: 24,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  feedHeader: {
    gap: 6,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  feedSubtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
  },
  empty: {
    backgroundColor: Palette.whiteBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  separator: {
    height: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  emptySubtitle: {
    color: Palette.textSecondary,
    textAlign: "center",
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#991B1B",
  },
  errorMessage: {
    color: "#B91C1C",
    fontSize: 13,
  },
});
