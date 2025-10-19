import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useManagedMoodHistory } from "@/hooks/use-managed-mood-history";
import { useProfileSummary } from "@/hooks/use-profile-summary";
import { useAuth } from "@/providers/auth-provider";
import type { ManagedTeam, TeamMember } from "@/services/team";
import { fetchManagedTeams, fetchTeamMembers } from "@/services/team";
import type { MoodEntry } from "@/types/mood";
import { format, isSameDay, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

const theme = {
  colors: {
    primary: "#4B93F2",
    backgroundLight: "#f6f8f8",
    foregroundLight: "#111827",
    subtleLight: "#6b7280",
    borderLight: "rgba(226, 232, 240, 1)",
  },
};

const moodValueToEmoji = (value: number) => {
  switch (value) {
    case 5:
      return "😊";
    case 4:
      return "🙂";
    case 3:
      return "😐";
    case 2:
      return "😟";
    case 1:
      return "😢";
    default:
      return "🤔";
  }
};

const contextLabelFromMood = (context: MoodEntry["context"]) => {
  if (context === "professional") return "Travail";
  if (context === "personal") return "Personnel";
  if (context === "mixed") return "Mixte";
  return "Mood";
};

const formatFullDateTime = (value: string) => {
  try {
    return format(new Date(value), "d MMM yyyy 'à' HH:mm", { locale: fr });
  } catch {
    return value;
  }
};

const describeVisibility = (entry: MoodEntry) => {
  if (entry.isAnonymous) return "Partagé en anonyme";
  const peers = entry.visibility.showReasonToPeers;
  if (peers === "hidden") return "Raisons cachées aux collègues";
  if (peers === "anonymized") return "Raisons anonymisées pour les collègues";
  return "Raisons visibles par les collègues";
};

// --- Logique du Graphique Corrigée ---
const CHART_HEIGHT = 100;
const DEFAULT_OUTER_PADDING = 16;
const DEFAULT_CARD_PADDING = 16;
const SVG_DEFAULT_WIDTH =
  Dimensions.get("window").width -
  (DEFAULT_OUTER_PADDING * 2 + DEFAULT_CARD_PADDING * 2); // Largeur utile intérieure à la carte
const HORIZONTAL_PADDING = 16; // Marge de sécurité pour éviter la coupe des points
const MOOD_LEVELS = [5, 4, 3, 2, 1];

type ManagerPillOption =
  | { key: "self"; label: string; type: "me" }
  | { key: string; label: string; type: "user"; userId: string; teamId: number };

const getYForMoodValue = (value: number) =>
  CHART_HEIGHT - (value / 5) * (CHART_HEIGHT - 20) + 10;

const MoodEvolutionChart = ({
  data,
  activePeriod,
}: {
  data: MoodEntry[];
  activePeriod: string;
}) => {
  const [chartWidth, setChartWidth] = useState<number>(SVG_DEFAULT_WIDTH);
  const [labelWidths, setLabelWidths] = useState<Record<number, number>>({});
  const currentWidth = Math.max(0, chartWidth || SVG_DEFAULT_WIDTH);
  const drawingWidth = Math.max(0, currentWidth - HORIZONTAL_PADDING * 2);
  const chartData = useMemo(() => {
    const today = new Date();
    const daysToShow = activePeriod === "Mois" ? 30 : 7;
    const days = Array.from({ length: daysToShow }).map((_, i) =>
      subDays(today, daysToShow - 1 - i)
    );

    return days.map((date) => {
      const entryForDay = data.find((entry) =>
        isSameDay(new Date(entry.loggedAt), date)
      );
      return {
        // CORRECTION : On affiche juste le jour pour la vue "Mois"
        label: format(date, "d", { locale: fr }),
        score: entryForDay ? entryForDay.moodValue : 0,
      };
    });
  }, [data, activePeriod]);

  useEffect(() => {
    setLabelWidths({});
  }, [activePeriod, chartData.length]);

  const labelPositions = useMemo(() => {
    if (chartData.length === 0) return [];
    if (chartData.length === 1) {
      return [HORIZONTAL_PADDING + drawingWidth / 2];
    }
    const step = drawingWidth / (chartData.length - 1);
    return chartData.map((_, index) => HORIZONTAL_PADDING + step * index);
  }, [chartData, drawingWidth]);

  const points = useMemo(() => {
    if (chartData.length <= 1) {
      if (chartData.length === 1 && chartData[0].score > 0) {
        const y = getYForMoodValue(chartData[0].score);
        return [
          {
            x: labelPositions[0] ?? drawingWidth / 2 + HORIZONTAL_PADDING,
            y,
            score: chartData[0].score,
          },
        ];
      }
      return [];
    }
    return chartData.map((point, index) => {
      const x = labelPositions[index];
      const y = getYForMoodValue(point.score);
      return { x: x ?? HORIZONTAL_PADDING, y, score: point.score };
    });
  }, [chartData, labelPositions]);

  const path = useMemo(() => {
    const visiblePoints = points.filter((p) => p.score > 0);
    if (visiblePoints.length < 2) return "";
    let d = `M${visiblePoints[0].x},${visiblePoints[0].y}`;
    for (let i = 1; i < visiblePoints.length; i++) {
      d += ` L${visiblePoints[i].x},${visiblePoints[i].y}`;
    }
    return d;
  }, [points]);

  const handleLabelLayout = useCallback((index: number, width: number) => {
    setLabelWidths((prev) => {
      if (prev[index] === width) return prev;
      return { ...prev, [index]: width };
    });
  }, []);

  const visibleLabelIndices = useMemo(() => {
    if (activePeriod === "Semaine") {
      return chartData.map((_, index) => index);
    }
    if (chartData.length === 0) return [];
    const first = 0;
    const middle = Math.floor(chartData.length / 2);
    const last = chartData.length - 1;
    return Array.from(new Set([first, middle, last])).filter(
      (index) => index >= 0 && index < chartData.length
    );
  }, [activePeriod, chartData]);

  if (data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartPlaceholder}>
          Pas de données pour le graphique.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.chartWrapper}
      onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
    >
      <Svg width={currentWidth} height={CHART_HEIGHT}>
        {MOOD_LEVELS.map((level) => {
          const y = getYForMoodValue(level);
          return (
            <React.Fragment key={level}>
              <Line
                x1={HORIZONTAL_PADDING}
                y1={y}
                x2={currentWidth - HORIZONTAL_PADDING}
                y2={y}
                stroke={theme.colors.borderLight}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <SvgText
                x={HORIZONTAL_PADDING + 4}
                y={y + 3}
                fill={theme.colors.subtleLight}
                fontSize={10}
                textAnchor="start"
              >
                {`${level}/5`}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Path
          d={path}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {points.map((point, index) =>
          point.score > 0 ? (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="white"
              stroke={theme.colors.primary}
              strokeWidth="2"
            />
          ) : null
        )}
      </Svg>
      <View
        style={[
          styles.graphLabelContainer,
          { height: activePeriod === "Semaine" ? 18 : 20 },
        ]}
        pointerEvents="none"
      >
        {visibleLabelIndices.map((chartIndex) => {
          const label = chartData[chartIndex]?.label;
          const xPosition = labelPositions[chartIndex] ?? HORIZONTAL_PADDING;
          const measuredWidth = labelWidths[chartIndex] ?? 0;
          return (
            <View
              key={`${chartIndex}-${label}`}
              style={[
                styles.chartLabelMarker,
                {
                  left: xPosition,
                  transform: [{ translateX: -measuredWidth / 2 }],
                },
              ]}
            >
              <Text
                style={styles.chartLabelText}
                onLayout={(event) =>
                  handleLabelLayout(chartIndex, event.nativeEvent.layout.width)
                }
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Composant pour un item de la timeline, réutilisable
const TimelineItem = ({
  item,
  onPress,
}: {
  item: MoodEntry;
  onPress?: (entry: MoodEntry) => void;
}) => (
  <Pressable
    onPress={onPress ? () => onPress(item) : undefined}
    disabled={!onPress}
    accessibilityRole={onPress ? "button" : undefined}
    style={({ pressed }) => [
      styles.timelineItem,
      pressed && onPress ? styles.timelineItemPressed : null,
    ]}
  >
    <Text style={styles.timelineEmoji}>{moodValueToEmoji(item.moodValue)}</Text>
    <View style={styles.timelineContent}>
      <View style={styles.timelineHeader}>
        <Text style={styles.timelineMood}>Mood: {item.moodValue}/5</Text>
        <Text style={styles.timelineDate}>
          {format(new Date(item.loggedAt), "d MMM yyyy", { locale: fr })}
        </Text>
      </View>
      <Text style={styles.timelineNote} numberOfLines={1}>
        {item.reasonSummary || "Aucune note"}
      </Text>
    </View>
  </Pressable>
);

type ProfileDashboardProps = {
  embedded?: boolean;
  refreshKey?: number;
};

export function ProfileDashboard({
  embedded = false,
  refreshKey,
}: ProfileDashboardProps) {
  const { user, logout } = useAuth();
  const { summary } = useProfileSummary();
  const isManager =
    user?.role === "manager" ||
    user?.role === "admin" ||
    user?.rawRole === "manager" ||
    user?.rawRole === "admin";
  const defaultScope: "me" | "team" | "user" = "me";
  const [scope, setScope] = useState<"me" | "team" | "user">(defaultScope);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [managedTeams, setManagedTeams] = useState<ManagedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamIdToMembers, setTeamIdToMembers] = useState<
    Record<number, TeamMember[]>
  >({});
  const [pickerStep, setPickerStep] = useState<1 | 2>(1);
  const [pickerTeamId, setPickerTeamId] = useState<number | null>(null);
  const [managedTeamsError, setManagedTeamsError] = useState<string | null>(
    null
  );
  const [isScopePickerVisible, setScopePickerVisible] = useState(false);

  const {
    items: historyItems,
    isLoading,
    error,
    refresh,
  } = useManagedMoodHistory({
    scope,
    teamId: scope === "me" ? null : selectedTeamId,
    teamIds: undefined,
    targetUserId,
  });
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState("Semaine");
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<MoodEntry | null>(null);
  const periods = ["Semaine", "Mois"];

  // Animations bottom sheet (histoire + scope picker)
  const historyDetailProgress = useRef(new Animated.Value(0)).current;

  const openHistoryModal = useCallback(() => {
    historyDetailProgress.stopAnimation();
    historyDetailProgress.setValue(0);
    setSelectedHistoryItem(null);
    setHistoryModalVisible(true);
  }, [historyDetailProgress]);

  const closeHistoryModal = useCallback(() => {
    historyDetailProgress.stopAnimation();
    historyDetailProgress.setValue(0);
    setSelectedHistoryItem(null);
    setHistoryModalVisible(false);
  }, [historyDetailProgress]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const statsData = useMemo(() => {
    if (!historyItems || historyItems.length === 0) {
      return { averageMood: 0, positiveDays: 0 };
    }
    const totalValue = historyItems.reduce(
      (sum, item) => sum + item.moodValue,
      0
    );
    const averageMood = parseFloat(
      (totalValue / historyItems.length).toFixed(1)
    );
    const positiveDays = historyItems.filter(
      (item) => item.moodValue >= 4
    ).length;
    return { averageMood, positiveDays };
  }, [historyItems]);

  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      void refresh();
    }
  }, [refreshKey, refresh]);

  useEffect(() => {
    if (isManager && user?.id) {
      setManagedTeamsError(null);
      fetchManagedTeams(user.id)
        .then((teams) => {
          setManagedTeams(teams);
        })
        .catch((e) => {
          setManagedTeams([]);
          setManagedTeamsError(e instanceof Error ? e.message : String(e));
        });
    }
  }, [isManager, user?.id]);

  // Précharge (debug) les membres pour chaque équipe gérée afin de pouvoir les afficher dans le bandeau
  useEffect(() => {
    const loadAllMembers = async () => {
      if (!isManager || managedTeams.length === 0) return;
      const missingTeamIds = managedTeams
        .map((t) => t.id)
        .filter((id) => !teamIdToMembers[id]);
      if (missingTeamIds.length === 0) return;
      try {
        const results: Array<readonly [number, TeamMember[]]> =
          await Promise.all(
            missingTeamIds.map(async (teamId) => {
              try {
                const list = await fetchTeamMembers(teamId, {
                  excludeUserId: user?.id ?? undefined,
                });
                return [teamId, list] as const;
              } catch {
                return [teamId, [] as TeamMember[]] as const;
              }
            })
          );
        setTeamIdToMembers((prev) => {
          const next: Record<number, TeamMember[]> = { ...prev };
          results.forEach(([id, list]) => {
            next[id] = list;
          });
          return next;
        });
      } catch {
        // ignore debug prefetch errors
      }
    };
    void loadAllMembers();
  }, [isManager, managedTeams, teamIdToMembers]);

  const currentViewerLabel = useMemo(() => {
    if (scope === "team") {
      if (managedTeams.length === 1) {
        return `équipe ${managedTeams[0].name}`;
      }
      if (managedTeams.length > 1) {
        return "toutes mes équipes";
      }
      return summary?.team?.name
        ? `équipe ${summary.team.name}`
        : "toute l'équipe";
    }
    if (scope === "me") {
      return summary?.username ?? user?.username ?? "moi";
    }
    const list: TeamMember[] = selectedTeamId
      ? teamIdToMembers[selectedTeamId] ?? []
      : [];
    const found = list.find((m) => m.id === targetUserId);
    return (
      found?.label ??
      (targetUserId
        ? `Utilisateur ${String(targetUserId).slice(0, 8)}`
        : "utilisateur")
    );
  }, [
    scope,
    summary?.team?.name,
    user?.username,
    selectedTeamId,
    teamIdToMembers,
    targetUserId,
  ]);

  const openScopePicker = useCallback(() => {
    setScopePickerVisible(true);
  }, []);
  const closeScopePicker = useCallback(() => {
    setScopePickerVisible(false);
  }, []);

  const Container = embedded ? View : SafeAreaView;

  const managerSelfLabel =
    summary?.username ?? user?.username ?? "Moi";

  const managerUserPills = useMemo<ManagerPillOption[]>(() => {
    if (!isManager) return [];
    const uniqueMembers = new Map<string, { member: TeamMember; teamId: number }>();
    managedTeams.forEach((team) => {
      const members = teamIdToMembers[team.id] ?? [];
      members.forEach((member) => {
        if (!uniqueMembers.has(member.id)) {
          uniqueMembers.set(member.id, { member, teamId: team.id });
        }
      });
    });
    const members = Array.from(uniqueMembers.values())
      .map(({ member, teamId }) => ({
        key: `${teamId}:${member.id}`,
        label: member.label,
        userId: member.id,
        teamId,
        type: "user" as const,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [
      { key: "self", label: managerSelfLabel, type: "me" as const },
      ...members,
    ];
  }, [isManager, managedTeams, teamIdToMembers, managerSelfLabel]);

  const handleSelectManagerPill = useCallback(
    (option: ManagerPillOption) => {
      if (option.type === "me") {
        setScope("me");
        setSelectedTeamId(null);
        setTargetUserId(null);
        setPickerStep(1);
        setPickerTeamId(null);
        return;
      }
      setScope("user");
      setSelectedTeamId(option.teamId);
      setTargetUserId(option.userId);
      setPickerStep(1);
      setPickerTeamId(null);
    },
    []
  );

  const isPillActive = useCallback(
    (option: ManagerPillOption) => {
      if (option.type === "me") {
        return scope === "me";
      }
      return scope === "user" && targetUserId === option.userId;
    },
    [scope, targetUserId]
  );

  const showManagerPills = isManager && managerUserPills.length > 0;

  const showHistoryDetail = useCallback(
    (entry: MoodEntry) => {
      historyDetailProgress.stopAnimation();
      historyDetailProgress.setValue(0);
      setSelectedHistoryItem(entry);
      Animated.timing(historyDetailProgress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [historyDetailProgress]
  );

  const hideHistoryDetail = useCallback(() => {
    historyDetailProgress.stopAnimation();
    Animated.timing(historyDetailProgress, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSelectedHistoryItem(null);
    });
  }, [historyDetailProgress]);

  const historyListOpacity = historyDetailProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const historyListTranslateX = historyDetailProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -32],
  });
  const historyDetailOpacity = historyDetailProgress;
  const historyDetailTranslateX = historyDetailProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [32, 0],
  });

  return (
    <Container style={embedded ? styles.embeddedSafeArea : styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : error ? (
          <Text style={styles.errorText}>Erreur: {error.message}</Text>
        ) : (
          <>
            {isManager ? null : null}

            <Text style={styles.headline}>Profil</Text>

            <View style={styles.card}>
              <View style={styles.profileHeader}>
                <UserAvatar
                  name={summary?.username || user?.username || "?"}
                  size={50}
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.username}>
                    {summary?.username ?? user?.username}
                  </Text>
                  <Text style={styles.email}>
                    {summary?.email ?? user?.email}
                  </Text>
                  <Text style={styles.role}>
                    {summary?.roleLabel ?? user?.rawRole ?? "Aucun rôle connu"}
                  </Text>
                </View>
                <Pressable onPress={handleLogout} style={styles.logoutButton}>
                  <IconSymbol
                    name="rectangle.portrait.and.arrow.right"
                    size={24}
                    color={theme.colors.subtleLight}
                  />
                </Pressable>
              </View>
            </View>

            <Text style={styles.headline}>Données</Text>

            {isManager ? (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={{ color: theme.colors.subtleLight, flex: 1 }}>
                    Données de :{" "}
                    <Text
                      style={{
                        color: theme.colors.foregroundLight,
                        fontWeight: "700",
                      }}
                    >
                      {currentViewerLabel}
                    </Text>
                  </Text>
                  <Pressable onPress={openScopePicker}>
                    <Text style={styles.seeAllText}>Changer</Text>
                  </Pressable>
                </View>
                {/* Debug view désactivée */}
                {showManagerPills ? (
                  <ScrollView
                    horizontal
                    style={styles.managerPillScroll}
                    contentContainerStyle={styles.managerPillContent}
                    showsHorizontalScrollIndicator={false}
                  >
                    {managerUserPills.map((option) => {
                      const active = isPillActive(option);
                      return (
                        <Pressable
                          key={option.key}
                          onPress={() => handleSelectManagerPill(option)}
                          style={[
                            styles.managerPill,
                            active
                              ? styles.managerPillActive
                              : styles.managerPillInactive,
                          ]}
                        >
                          <UserAvatar
                            name={option.label}
                            size={28}
                            style={styles.managerPillAvatar}
                          />
                          <Text
                            style={[
                              styles.managerPillText,
                              active && styles.managerPillTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={[styles.cardTitlePrimary, { marginBottom: 16 }]}>
                Statistiques
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{statsData.averageMood}</Text>
                  <Text style={styles.statLabel}>Mood moyen</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{statsData.positiveDays}</Text>
                  <Text style={styles.statLabel}>Jours positifs</Text>
                </View>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitlePrimary}>Mood Evolution</Text>
              </View>
              <View style={styles.periodFilterContainer}>
                {periods.map((period) => (
                  <Pressable
                    key={period}
                    style={[
                      styles.periodButton,
                      activePeriod === period
                        ? styles.periodButtonActive
                        : styles.periodButtonInactive,
                    ]}
                    onPress={() => setActivePeriod(period)}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        activePeriod === period
                          ? styles.periodButtonTextActive
                          : styles.periodButtonTextInactive,
                      ]}
                    >
                      {period}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <MoodEvolutionChart
                data={historyItems}
                activePeriod={activePeriod}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.cardTitlePrimary}>
                  Historique des moods
                </Text>
                <Pressable onPress={openHistoryModal}>
                  <Text style={styles.seeAllText}>Voir tout</Text>
                </Pressable>
              </View>
              <View style={styles.timelineContainer}>
                {historyItems.slice(0, 2).map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <BottomSheetModal
        visible={isHistoryModalVisible}
        onClose={closeHistoryModal}
        sheetStyle={styles.historySheet}
        showHandle={false}
      >
        <View style={styles.sheetHandle} />

        <View style={styles.historyContentWrapper}>
          <Animated.View
            style={[
              styles.historyListContainer,
              {
                opacity: historyListOpacity,
                transform: [{ translateX: historyListTranslateX }],
              },
            ]}
            pointerEvents={selectedHistoryItem ? "none" : "auto"}
          >
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Historique des moods</Text>
              <Pressable
                onPress={closeHistoryModal}
                accessibilityRole="button"
              >
                <Text style={styles.historyCloseLabel}>Fermer</Text>
              </Pressable>
            </View>
            <FlatList
              data={historyItems}
              renderItem={({ item }) => (
                <TimelineItem item={item} onPress={showHistoryDetail} />
              )}
              keyExtractor={(item) => item.id.toString()}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              contentContainerStyle={styles.historyList}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.historyDetailContainer,
              {
                opacity: historyDetailOpacity,
                transform: [{ translateX: historyDetailTranslateX }],
              },
            ]}
            pointerEvents={selectedHistoryItem ? "auto" : "none"}
          >
            {selectedHistoryItem ? (
              <>
                <View style={styles.historyDetailHeader}>
                  <Pressable
                    onPress={hideHistoryDetail}
                    style={styles.historyBackButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.historyBackIcon}>←</Text>
                    <Text style={styles.historyBackLabel}>Voir tout</Text>
                  </Pressable>
                  <Pressable
                    onPress={closeHistoryModal}
                    accessibilityRole="button"
                  >
                    <Text style={styles.historyCloseLabel}>Fermer</Text>
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.historyDetailScroll}
                  contentContainerStyle={styles.historyDetailContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.historyDetailMoodRow}>
                    <View style={styles.historyDetailEmojiSurface}>
                      <Text style={styles.historyDetailEmoji}>
                        {moodValueToEmoji(selectedHistoryItem.moodValue)}
                      </Text>
                    </View>
                    <View style={styles.historyDetailTexts}>
                      <Text style={styles.historyDetailMoodTitle}>
                        Mood {selectedHistoryItem.moodValue}/5
                      </Text>
                      <Text style={styles.historyDetailSubtitle}>
                        {formatFullDateTime(selectedHistoryItem.loggedAt)}
                      </Text>
                    </View>
                  </View>

                  {selectedHistoryItem.reasonSummary ? (
                    <View style={styles.historySection}>
                      <Text style={styles.historySectionTitle}>Résumé</Text>
                      <Text style={styles.historySectionText}>
                        {selectedHistoryItem.reasonSummary}
                      </Text>
                    </View>
                  ) : null}

                  {selectedHistoryItem.note ? (
                    <View style={styles.historySection}>
                      <Text style={styles.historySectionTitle}>Note</Text>
                      <Text style={styles.historySectionText}>
                        {selectedHistoryItem.note}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.historySection}>
                    <Text style={styles.historySectionTitle}>Contexte</Text>
                    <Text style={styles.historySectionText}>
                      {contextLabelFromMood(selectedHistoryItem.context)}
                    </Text>
                  </View>

                  <View style={styles.historySection}>
                    <Text style={styles.historySectionTitle}>Visibilité</Text>
                    <Text style={styles.historySectionText}>
                      {describeVisibility(selectedHistoryItem)}
                    </Text>
                  </View>

                  {selectedHistoryItem.categories?.length ? (
                    <View style={styles.historySection}>
                      <Text style={styles.historySectionTitle}>
                        Catégories
                      </Text>
                      <View style={styles.historyTagRow}>
                        {selectedHistoryItem.categories.map((category) => (
                          <View key={category.id} style={styles.historyTag}>
                            <Text style={styles.historyTagText}>
                              {category.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </ScrollView>
              </>
            ) : null}
          </Animated.View>
        </View>
      </BottomSheetModal>
      {/* Sélecteur de portée */}
      <BottomSheetModal
        visible={isScopePickerVisible}
        onClose={closeScopePicker}
        sheetStyle={styles.historySheet}
        showHandle={false}
      >
        <View style={styles.sheetHandle} />
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { flex: 1, flexShrink: 1 }]}>
            {pickerStep === 1
              ? "De qui voulez-vous voir les données ?"
              : "De quel employé voulez-vous voir les données ?"}
          </Text>
          <Pressable onPress={closeScopePicker}>
            <Text style={styles.modalCloseButton}>Fermer</Text>
          </Pressable>
        </View>
        <View style={{ gap: 8, paddingBottom: 44 }}>
          {pickerStep === 1 ? (
            <>
              <Pressable
                style={styles.timelineItem}
                onPress={() => {
                  setScope("me");
                  setSelectedTeamId(null);
                  setTargetUserId(null);
                  setPickerStep(1);
                  closeScopePicker();
                }}
              >
                <Text style={styles.timelineMood}>
                  Moi ({summary?.username ?? user?.username ?? "—"})
                </Text>
              </Pressable>
              {managedTeams.map((t) => (
                <Pressable
                  key={t.id}
                  style={styles.timelineItem}
                  onPress={async () => {
                    setPickerTeamId(t.id);
                    if (!teamIdToMembers[t.id]) {
                      try {
                        const list = await fetchTeamMembers(t.id, {
                          excludeUserId: user?.id ?? undefined,
                        });
                        setTeamIdToMembers((prev) => ({
                          ...prev,
                          [t.id]: list,
                        }));
                      } catch {
                        setTeamIdToMembers((prev) => ({
                          ...prev,
                          [t.id]: [],
                        }));
                      }
                    }
                    setPickerStep(2);
                  }}
                >
                  <Text style={styles.timelineMood}>Équipe {t.name}</Text>
                </Pressable>
              ))}
            </>
          ) : (
            <>
              <Pressable
                style={styles.timelineItem}
                onPress={() => {
                  setScope("team");
                  setSelectedTeamId(pickerTeamId);
                  setTargetUserId(null);
                  setPickerStep(1);
                  setPickerTeamId(null);
                  closeScopePicker();
                }}
              >
                <Text style={styles.timelineMood}>Toute l'équipe</Text>
              </Pressable>
              {(pickerTeamId ? teamIdToMembers[pickerTeamId] ?? [] : []).map(
                (m) => (
                  <Pressable
                    key={m.id}
                    style={styles.timelineItem}
                    onPress={() => {
                      setScope("user");
                      setSelectedTeamId(pickerTeamId);
                      setTargetUserId(m.id);
                      setPickerStep(1);
                      setPickerTeamId(null);
                      closeScopePicker();
                    }}
                  >
                    <Text style={styles.timelineMood}>{m.label}</Text>
                  </Pressable>
                )
              )}
              <Pressable
                style={[styles.timelineItem, { justifyContent: "center" }]}
                onPress={() => {
                  setPickerStep(1);
                  setPickerTeamId(null);
                }}
              >
                <Text style={styles.timelineMood}>← Retour</Text>
              </Pressable>
            </>
          )}
        </View>
      </BottomSheetModal>
    </Container>
  );
}

export default function ProfileScreen() {
  return <ProfileDashboard />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.backgroundLight },
  embeddedSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  mainContent: { padding: 16, gap: 16 },
  headline: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.foregroundLight,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 1,
  },
  profileHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { marginRight: 12 },
  userInfo: { flex: 1 },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.foregroundLight,
  },
  email: { fontSize: 14, color: theme.colors.subtleLight },
  role: { fontSize: 12, color: theme.colors.subtleLight },
  teamListLabel: {
    fontSize: 12,
    color: theme.colors.subtleLight,
    fontWeight: "600",
  },
  teamListItem: { fontSize: 12, color: theme.colors.subtleLight },
  logoutButton: { padding: 8 },
  periodFilterContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    alignSelf: "center",
  },
  periodButton: {
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  periodButtonActive: { backgroundColor: theme.colors.primary },
  periodButtonInactive: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: "rgba(107, 114, 128, 0.2)",
  },
  periodButtonText: { fontSize: 14 },
  periodButtonTextActive: { color: "white", fontWeight: "600" },
  periodButtonTextInactive: {
    color: theme.colors.subtleLight,
    fontWeight: "500",
  },
  managerPillScroll: { marginTop: 16 },
  managerPillContent: { paddingVertical: 4, paddingRight: 12 },
  managerPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 8,
  },
  managerPillAvatar: { marginRight: 8 },
  managerPillActive: { backgroundColor: theme.colors.primary },
  managerPillInactive: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.5)",
  },
  managerPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.subtleLight,
    maxWidth: 120,
    flexShrink: 1,
  },
  managerPillTextActive: { color: "white" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  cardTitlePrimary: {
    color: theme.colors.foregroundLight,
    fontSize: 16,
    fontWeight: "600",
  },
  chartWrapper: { alignItems: "center", marginTop: 16, paddingBottom: 8 },
  chartContainer: { height: CHART_HEIGHT, justifyContent: "center" },
  chartPlaceholder: {
    color: theme.colors.subtleLight,
    fontSize: 14,
    textAlign: "center",
  },
  graphLabelContainer: {
    position: "relative",
    width: "100%",
    marginTop: 8,
  },
  chartLabelMarker: {
    position: "absolute",
    alignItems: "center",
  },
  chartLabelText: {
    fontSize: 11,
    color: theme.colors.subtleLight,
    textTransform: "capitalize",
    // On retire flex: 1 pour que le texte prenne sa largeur naturelle
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  seeAllText: { color: theme.colors.primary, fontSize: 14, fontWeight: "600" },
  timelineContainer: { gap: 8 },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundLight,
  },
  timelineItemPressed: {
    opacity: 0.85,
  },
  timelineEmoji: { fontSize: 24 },
  timelineContent: { flex: 1 },
  timelineHeader: { flexDirection: "row", justifyContent: "space-between" },
  timelineMood: {
    fontWeight: "600",
    color: theme.colors.foregroundLight,
    textTransform: "capitalize",
  },
  timelineDate: { fontSize: 14, color: theme.colors.subtleLight },
  timelineNote: {
    marginTop: 4,
    fontSize: 14,
    color: theme.colors.subtleLight,
    flexShrink: 1,
  },
  statsGrid: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700", color: theme.colors.primary },
  statLabel: { fontSize: 14, color: theme.colors.subtleLight },
  errorText: { color: "red", textAlign: "center", marginTop: 20 },
  debugBanner: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    marginTop: 8,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#991B1B",
  },
  debugMessage: {
    fontSize: 12,
    color: "#B91C1C",
  },
  // Styles pour la modale
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.foregroundLight,
  },
  modalCloseButton: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  historyOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.35)",
    justifyContent: "flex-end",
  },
  historyBackdrop: StyleSheet.absoluteFillObject,
  historySheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 18,
    maxHeight: "80%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.foregroundLight,
  },
  historyCloseLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  historyContentWrapper: {
    flex: 1,
    position: "relative",
  },
  historyListContainer: {
    flex: 1,
  },
  historyDetailContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
  },
  historyList: {
    paddingBottom: 32,
    paddingTop: 8,
  },
  historyDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyBackIcon: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  historyBackLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  historyDetailContent: {
    gap: 20,
  },
  historyDetailScroll: {
    flexGrow: 0,
  },
  historyDetailMoodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  historyDetailEmojiSurface: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  historyDetailEmoji: {
    fontSize: 32,
  },
  historyDetailTexts: {
    flex: 1,
    gap: 4,
  },
  historyDetailMoodTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.foregroundLight,
  },
  historyDetailSubtitle: {
    fontSize: 14,
    color: theme.colors.subtleLight,
  },
  historySection: {
    gap: 8,
  },
  historySectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.foregroundLight,
  },
  historySectionText: {
    fontSize: 14,
    color: theme.colors.subtleLight,
    lineHeight: 20,
  },
  historyTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  historyTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.backgroundLight,
  },
  historyTagText: {
    fontSize: 12,
    color: theme.colors.subtleLight,
  },
});
