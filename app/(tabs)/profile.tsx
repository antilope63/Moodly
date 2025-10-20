import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getReflectionOption } from "@/constants/reflection-options";
import { Palette } from "@/constants/theme";
import { useManagedMoodHistory } from "@/hooks/use-managed-mood-history";
import { useProfileSummary } from "@/hooks/use-profile-summary";
import { useAuth } from "@/providers/auth-provider";
import type { ManagedTeam, TeamMember } from "@/services/team";
import { fetchManagedTeams, fetchTeamMembers } from "@/services/team";
import type { MoodEntry } from "@/types/mood";
import { format, isSameDay, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
    primary: Palette.bleuMarin,
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
  const peers = entry.visibility?.showReasonToPeers;
  if (peers === "hidden") return "Raisons cachées aux collègues";
  if (peers === "anonymized") return "Raisons anonymisées pour les collègues";
  if (peers === "visible") return "Raisons visibles par les collègues";
  return "Visibilité inconnue";
};

// --- Logique du Graphique Corrigée ---
const CHART_HEIGHT = 100;
const DEFAULT_OUTER_PADDING = 16;
const DEFAULT_CARD_PADDING = 16;
const SVG_DEFAULT_WIDTH =
  Dimensions.get("window").width -
  (DEFAULT_OUTER_PADDING * 2 + DEFAULT_CARD_PADDING * 2); // Largeur utile intérieure à la carte
const LEFT_AXIS_PADDING = 44; // Laisse de l'espace pour les libellés verticaux sans marcher sur le tracé
const RIGHT_CHART_PADDING = 16; // Marge droite pour que les points ne soient pas coupés
const MOOD_LEVELS = [5, 4, 3, 2, 1];
const BOTTOM_SHEET_HEIGHT = Math.min(
  Dimensions.get("window").height * 0.75,
  620
);

type ManagerPillOption =
  | { key: "self"; label: string; type: "me" }
  | {
      key: string;
      label: string;
      type: "user";
      userId: string;
      teamId: number;
    };

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
  const drawingWidth = Math.max(
    0,
    currentWidth - LEFT_AXIS_PADDING - RIGHT_CHART_PADDING
  );
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
      return [LEFT_AXIS_PADDING + drawingWidth / 2];
    }
    const step = drawingWidth / (chartData.length - 1);
    return chartData.map((_, index) => LEFT_AXIS_PADDING + step * index);
  }, [chartData, drawingWidth]);

  const points = useMemo(() => {
    if (chartData.length <= 1) {
      if (chartData.length === 1 && chartData[0].score > 0) {
        const y = getYForMoodValue(chartData[0].score);
        return [
          {
            x: labelPositions[0] ?? drawingWidth / 2 + LEFT_AXIS_PADDING,
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
      return { x: x ?? LEFT_AXIS_PADDING, y, score: point.score };
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
                x1={LEFT_AXIS_PADDING}
                y1={y}
                x2={currentWidth - RIGHT_CHART_PADDING}
                y2={y}
                stroke={theme.colors.borderLight}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <SvgText
                x={LEFT_AXIS_PADDING - 6}
                y={y + 3}
                fill={theme.colors.subtleLight}
                fontSize={10}
                textAnchor="end"
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
          const xPosition = labelPositions[chartIndex] ?? LEFT_AXIS_PADDING;
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
  showAuthor = false,
}: {
  item: MoodEntry;
  onPress?: (entry: MoodEntry) => void;
  showAuthor?: boolean;
}) => {
  const authorLabel =
    item.source === "anonymous" || item.isAnonymous
      ? "Anonyme"
      : item.loggedBy?.username ?? "Anonyme";
  const notePreview = item.note?.trim() ?? "";
  const hasNote = notePreview.length > 0;

  return (
    <Pressable
      onPress={onPress ? () => onPress(item) : undefined}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [
        styles.timelineItem,
        pressed && onPress ? styles.timelineItemPressed : null,
      ]}
    >
      <Text style={styles.timelineEmoji}>
        {moodValueToEmoji(item.moodValue)}
      </Text>
      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineMood}>Mood: {item.moodValue}/5</Text>
          <Text style={styles.timelineDate}>
            {format(new Date(item.loggedAt), "d MMM yyyy", { locale: fr })}
          </Text>
        </View>
        {showAuthor ? (
          <Text style={styles.timelineAuthor}>{authorLabel}</Text>
        ) : null}
        {hasNote ? (
          <Text style={styles.timelineNote} numberOfLines={1}>
            {notePreview}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

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
  const showAuthorNames = scope === "team";

  // Gestion des feuilles (historique + sélection de portée)
  const openHistoryModal = useCallback(() => {
    setHistoryModalVisible(true);
    setSelectedHistoryItem(null);
  }, []);

  const closeHistoryModal = useCallback(() => {
    setHistoryModalVisible(false);
    setSelectedHistoryItem(null);
  }, []);

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
    if (!selectedHistoryItem) return;
    if (!historyItems.some((item) => item.id === selectedHistoryItem.id)) {
      setSelectedHistoryItem(null);
    }
  }, [historyItems, selectedHistoryItem]);

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
        const results: (readonly [number, TeamMember[]])[] = await Promise.all(
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

  const openScopePicker = useCallback(() => {
    setScopePickerVisible(true);
  }, []);
  const closeScopePicker = useCallback(() => {
    setScopePickerVisible(false);
  }, []);

  const Container = embedded ? View : SafeAreaView;

  const managerSelfLabel = summary?.username ?? user?.username ?? "Moi";

  const managerUserPills = useMemo<ManagerPillOption[]>(() => {
    if (!isManager) return [];

    const targetTeamIds: number[] = [];
    if ((scope === "team" || scope === "user") && selectedTeamId != null) {
      targetTeamIds.push(selectedTeamId);
    }
    if (
      targetTeamIds.length === 0 &&
      selectedTeamId != null &&
      !targetTeamIds.includes(selectedTeamId)
    ) {
      targetTeamIds.push(selectedTeamId);
    }
    if (targetTeamIds.length === 0 && managedTeams.length === 1) {
      targetTeamIds.push(managedTeams[0].id);
    }
    if (targetTeamIds.length === 0 && managedTeams.length > 1) {
      targetTeamIds.push(...managedTeams.map((team) => team.id));
    }

    const seenMembers = new Set<string>();
    const memberPills: ManagerPillOption[] = [];
    targetTeamIds.forEach((teamId) => {
      const members = teamIdToMembers[teamId] ?? [];
      members.forEach((member) => {
        if (seenMembers.has(member.id)) return;
        seenMembers.add(member.id);
        memberPills.push({
          key: `${teamId}:${member.id}`,
          label: member.label,
          userId: member.id,
          teamId,
          type: "user",
        });
      });
    });

    memberPills.sort((a, b) => a.label.localeCompare(b.label));

    return [
      { key: "self", label: managerSelfLabel, type: "me" as const },
      ...memberPills,
    ];
  }, [
    isManager,
    managedTeams,
    teamIdToMembers,
    managerSelfLabel,
    scope,
    selectedTeamId,
  ]);

  const managerSelectedTeamName = useMemo(() => {
    if (!isManager) return null;

    const fallbackTeamFromSummary = summary?.team?.name ?? null;
    if (selectedTeamId != null) {
      const selectedTeam = managedTeams.find(
        (team) => team.id === selectedTeamId
      );
      if (selectedTeam) {
        return selectedTeam.name;
      }
    }

    if (managedTeams.length === 1) {
      return managedTeams[0]?.name ?? null;
    }

    return fallbackTeamFromSummary;
  }, [isManager, managedTeams, selectedTeamId, summary?.team?.name]);

  const handleSelectManagerPill = useCallback((option: ManagerPillOption) => {
    if (option.type === "me") {
      setScope("me");
      setSelectedTeamId(null);
      setTargetUserId(null);
      return;
    }
    setScope("user");
    setSelectedTeamId(option.teamId);
    setTargetUserId(option.userId);
  }, []);

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

  const handleShowHistoryDetail = useCallback((entry: MoodEntry) => {
    setSelectedHistoryItem(entry);
  }, []);

  const handleHideHistoryDetail = useCallback(() => {
    setSelectedHistoryItem(null);
  }, []);

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
                  <Text style={styles.managerContextText}>
                    {managerSelectedTeamName
                      ? `Données de l'équipe ${managerSelectedTeamName}`
                      : "Sélectionnez une équipe"}
                  </Text>
                  <Pressable onPress={openScopePicker}>
                    <Text style={styles.seeAllText}>Changer</Text>
                  </Pressable>
                </View>
                {/* Debug view désactivée */}
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
              {showManagerPills ? (
                <View style={styles.managerPillSection}>
                  <Text style={styles.managerPillLabel}>
                    Voir les données de
                  </Text>
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
                          accessibilityRole="button"
                        >
                          <UserAvatar
                            name={option.label}
                            size={18}
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
                </View>
              ) : null}
            </View>

            <View style={styles.card}>
              <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
                <Text style={styles.cardTitlePrimary}>
                  Historique des moods
                </Text>
                <Pressable onPress={openHistoryModal}>
                  <Text style={styles.seeAllText}>Voir tout</Text>
                </Pressable>
              </View>
              <View style={styles.timelineContainer}>
                {historyItems.slice(0, 2).map((item) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    showAuthor={showAuthorNames}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <BottomSheetModal
        visible={isHistoryModalVisible}
        onClose={closeHistoryModal}
        sheetStyle={styles.bottomSheet}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.modalHeader}>
            {selectedHistoryItem ? (
              <Pressable
                style={styles.historyBackButton}
                onPress={handleHideHistoryDetail}
                accessibilityRole="button"
              >
                <Text style={styles.historyBackIcon}>←</Text>
                <Text style={styles.historyBackLabel}>Voir tout</Text>
              </Pressable>
            ) : (
              <Text style={[styles.modalTitle, { flex: 1, flexShrink: 1 }]}>
                Historique des moods
              </Text>
            )}
            <Pressable onPress={closeHistoryModal} accessibilityRole="button">
              <Text style={styles.modalCloseButton}>Fermer</Text>
            </Pressable>
          </View>
          {selectedHistoryItem ? (
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
                  <Text style={styles.historySectionTitle}>Catégories</Text>
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

              {selectedHistoryItem.freedomChoice != null ? (
                <View style={styles.historySection}>
                  <Text style={styles.historySectionTitle}>
                    Sentiment de liberté
                  </Text>
                  <Text style={styles.historySectionText}>
                    {getReflectionOption(selectedHistoryItem.freedomChoice)
                      ?.message ?? selectedHistoryItem.freedomChoice}
                  </Text>
                </View>
              ) : null}

              {selectedHistoryItem.supportChoice != null ? (
                <View style={styles.historySection}>
                  <Text style={styles.historySectionTitle}>
                    Sentiment de soutien
                  </Text>
                  <Text style={styles.historySectionText}>
                    {getReflectionOption(selectedHistoryItem.supportChoice)
                      ?.message ?? selectedHistoryItem.supportChoice}
                  </Text>
                </View>
              ) : null}

              {selectedHistoryItem.energyChoice != null ? (
                <View style={styles.historySection}>
                  <Text style={styles.historySectionTitle}>Énergie perçue</Text>
                  <Text style={styles.historySectionText}>
                    {getReflectionOption(selectedHistoryItem.energyChoice)
                      ?.message ?? selectedHistoryItem.energyChoice}
                  </Text>
                </View>
              ) : null}

              {selectedHistoryItem.pridePercent != null ? (
                <View style={styles.historySection}>
                  <Text style={styles.historySectionTitle}>Fierté (en %)</Text>
                  <Text style={styles.historySectionText}>
                    Je me sens efficace à {selectedHistoryItem.pridePercent}%
                    aujourd’hui.
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          ) : historyItems.length === 0 ? (
            <View style={styles.historyEmptyState}>
              <Text style={styles.historyEmptyText}>
                Aucun mood enregistré pour cette sélection.
              </Text>
            </View>
          ) : (
            <FlatList
              data={historyItems}
              renderItem={({ item }) => (
                <TimelineItem
                  item={item}
                  onPress={handleShowHistoryDetail}
                  showAuthor={showAuthorNames}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              style={styles.historyListScrollable}
              contentContainerStyle={styles.historyList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </BottomSheetModal>
      {/* Sélecteur de portée */}
      <BottomSheetModal
        visible={isScopePickerVisible}
        onClose={closeScopePicker}
        sheetStyle={styles.bottomSheet}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { flex: 1, flexShrink: 1 }]}>
              Choisissez la vue à afficher
            </Text>
            <Pressable onPress={closeScopePicker} accessibilityRole="button">
              <Text style={styles.modalCloseButton}>Fermer</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.bottomSheetScrollArea}
            contentContainerStyle={styles.modalOptionList}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              style={[
                styles.timelineItem,
                scope === "me" ? styles.timelineItemActive : null,
              ]}
              onPress={() => {
                setScope("me");
                setSelectedTeamId(null);
                setTargetUserId(null);
                closeScopePicker();
              }}
            >
              <Text style={styles.timelineMood}>
                Moi ({summary?.username ?? user?.username ?? "—"})
              </Text>
            </Pressable>
            {managedTeams.map((team) => {
              const isActive = selectedTeamId === team.id && scope !== "me";
              return (
                <Pressable
                  key={team.id}
                  style={[
                    styles.timelineItem,
                    isActive ? styles.timelineItemActive : null,
                  ]}
                  onPress={() => {
                    setScope("team");
                    setSelectedTeamId(team.id);
                    setTargetUserId(null);
                    closeScopePicker();
                  }}
                >
                  <Text style={styles.timelineMood}>Équipe {team.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
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
  managerPillSection: {
    marginTop: 20,
    gap: 10,
  },
  managerPillLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.subtleLight,
  },
  managerPillScroll: { marginTop: 4 },
  managerPillContent: { paddingVertical: 2, paddingRight: 10 },
  managerPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(241, 245, 249, 0.9)",
  },
  managerPillAvatar: { marginRight: 6, borderRadius: 999 },
  managerPillActive: { backgroundColor: theme.colors.primary },
  managerPillInactive: {
    backgroundColor: "rgba(248, 250, 252, 0.95)",
  },
  managerPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.subtleLight,
    maxWidth: 96,
    flexShrink: 1,
  },
  managerPillTextActive: { color: "white" },
  managerContextText: {
    flex: 1,
    color: theme.colors.foregroundLight,
    fontSize: 14,
    fontWeight: "600",
  },
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
  timelineItemActive: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(75, 147, 242, 0.08)",
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
  timelineAuthor: {
    marginTop: 2,
    fontSize: 13,
    color: theme.colors.foregroundLight,
    fontWeight: "500",
  },
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
  modalOptionList: {
    gap: 8,
    paddingBottom: 44,
  },
  bottomSheetScrollArea: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 0,
    paddingBottom: 32,
    height: BOTTOM_SHEET_HEIGHT,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  bottomSheetContent: {
    gap: 18,
    flex: 1,
    paddingHorizontal: 20,
  },
  historyBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
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
  historyList: {
    paddingBottom: 32,
    paddingTop: 8,
  },
  historyListScrollable: {
    flex: 1,
  },
  historyEmptyState: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  historyEmptyText: {
    fontSize: 14,
    color: theme.colors.subtleLight,
  },
  historyDetailScroll: {
    flex: 1,
  },
  historyDetailContent: {
    gap: 20,
    paddingBottom: 32,
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
