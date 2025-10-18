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
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

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

// --- Logique du Graphique Corrigée ---
const CHART_HEIGHT = 100;
const SVG_WIDTH = Dimensions.get("window").width - 32; // Largeur totale de la carte
const HORIZONTAL_PADDING = 10; // Marge pour que les points ne soient pas coupés
const CHART_DRAWING_WIDTH = SVG_WIDTH - HORIZONTAL_PADDING * 2;

const MoodEvolutionChart = ({
  data,
  activePeriod,
}: {
  data: MoodEntry[];
  activePeriod: string;
}) => {
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

  const points = useMemo(() => {
    if (chartData.length <= 1) {
      if (chartData.length === 1 && chartData[0].score > 0) {
        const y =
          CHART_HEIGHT - (chartData[0].score / 5) * (CHART_HEIGHT - 20) + 10;
        return [
          {
            x: CHART_DRAWING_WIDTH / 2 + HORIZONTAL_PADDING,
            y,
            score: chartData[0].score,
          },
        ];
      }
      return [];
    }
    return chartData.map((point, index) => {
      // CORRECTION : Calcul de X avec la marge de sécurité
      const x =
        HORIZONTAL_PADDING +
        (index / (chartData.length - 1)) * CHART_DRAWING_WIDTH;
      const y = CHART_HEIGHT - (point.score / 5) * (CHART_HEIGHT - 20) + 10;
      return { x, y, score: point.score };
    });
  }, [chartData]);

  const path = useMemo(() => {
    const visiblePoints = points.filter((p) => p.score > 0);
    if (visiblePoints.length < 2) return "";
    let d = `M${visiblePoints[0].x},${visiblePoints[0].y}`;
    for (let i = 1; i < visiblePoints.length; i++) {
      d += ` L${visiblePoints[i].x},${visiblePoints[i].y}`;
    }
    return d;
  }, [points]);

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
    <View style={styles.chartWrapper}>
      <Svg width={SVG_WIDTH} height={CHART_HEIGHT}>
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
      <View style={styles.graphLabelContainer}>
        {activePeriod === "Semaine" ? (
          chartData.map((day, index) => (
            <Text key={index} style={styles.chartLabelText}>
              {day.label}
            </Text>
          ))
        ) : (
          <>
            <Text style={[styles.chartLabelText, { textAlign: "left" }]}>
              {chartData[0]?.label}
            </Text>
            <Text style={[styles.chartLabelText, { textAlign: "center" }]}>
              {chartData[14]?.label}
            </Text>
            <Text style={[styles.chartLabelText, { textAlign: "right" }]}>
              {chartData[29]?.label}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

// Composant pour un item de la timeline, réutilisable
const TimelineItem = ({ item }: { item: MoodEntry }) => (
  <View style={styles.timelineItem}>
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
  </View>
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
  const defaultScope: "me" | "team" | "user" = isManager ? "team" : "me";
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
  const periods = ["Semaine", "Mois"];

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
                const list = await fetchTeamMembers(teamId);
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
      return user?.username ?? "moi";
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

  const openScopePicker = () => setScopePickerVisible(true);
  const closeScopePicker = () => setScopePickerVisible(false);

  const Container = embedded ? View : SafeAreaView;

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
            {isManager ? (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.cardTitlePrimary}>Vue manager</Text>
                  <Pressable onPress={openScopePicker}>
                    <Text style={styles.seeAllText}>Changer</Text>
                  </Pressable>
                </View>
                <Text style={{ color: theme.colors.subtleLight }}>
                  Vous voyez actuellement les données de :{" "}
                  <Text
                    style={{
                      color: theme.colors.foregroundLight,
                      fontWeight: "700",
                    }}
                  >
                    {currentViewerLabel}
                  </Text>
                </Text>
                <View style={styles.debugBanner}>
                  <Text style={styles.debugTitle}>Debug équipes</Text>
                  <Text style={styles.debugMessage}>
                    uuid: {user?.id} • équipes: {managedTeams.length}
                    {managedTeamsError ? ` • erreur: ${managedTeamsError}` : ""}
                  </Text>
                  <View style={{ gap: 4 }}>
                    {managedTeams.map((t) => {
                      const list = teamIdToMembers[t.id] ?? [];
                      return (
                        <View key={t.id}>
                          <Text style={styles.debugTitle}>
                            Équipe {t.name || "—"} ({list.length})
                          </Text>
                          {list.length > 0 ? (
                            list.map((m) => (
                              <Text key={m.id} style={styles.debugMessage}>
                                - {m.label}
                              </Text>
                            ))
                          ) : (
                            <Text style={styles.debugMessage}>
                              - aucun membre trouvé
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <View style={styles.profileHeader}>
                <UserAvatar
                  name={user?.username || "?"}
                  size={50}
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{user?.username}</Text>
                  <Text style={styles.email}>{user?.email}</Text>
                  <Text style={styles.role}>
                    {user?.rawRole ?? "Aucun rôle connu"}
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
                <Text style={styles.cardTitlePrimary}>Derniers logs</Text>
                <Pressable onPress={() => setHistoryModalVisible(true)}>
                  <Text style={styles.seeAllText}>Voir tout</Text>
                </Pressable>
              </View>
              <View style={styles.timelineContainer}>
                {historyItems.slice(0, 2).map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={[styles.cardTitlePrimary, { marginBottom: 16 }]}>
                Statistiques rapides
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
          </>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isHistoryModalVisible}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Historique des logs</Text>
              <Pressable onPress={() => setHistoryModalVisible(false)}>
                <Text style={styles.modalCloseButton}>Fermer</Text>
              </Pressable>
            </View>
            <FlatList
              data={historyItems}
              renderItem={({ item }) => <TimelineItem item={item} />}
              keyExtractor={(item) => item.id.toString()}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          </View>
        </View>
      </Modal>
      {/* Sélecteur de portée */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isScopePickerVisible}
        onRequestClose={closeScopePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pickerStep === 1
                  ? "Choisir l'équipe ou moi"
                  : "Choisir les données à voir"}
              </Text>
              <Pressable onPress={closeScopePicker}>
                <Text style={styles.modalCloseButton}>Fermer</Text>
              </Pressable>
            </View>
            <View style={{ gap: 8 }}>
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
                      Moi ({user?.username ?? "—"})
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
                            const list = await fetchTeamMembers(t.id);
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
                  {(pickerTeamId
                    ? teamIdToMembers[pickerTeamId] ?? []
                    : []
                  ).map((m) => (
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
                  ))}
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
          </View>
        </View>
      </Modal>
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
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
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
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
    paddingHorizontal: HORIZONTAL_PADDING,
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
    marginBottom: 12,
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
});
