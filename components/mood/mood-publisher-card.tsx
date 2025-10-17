import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getMoodOptionByValue } from "@/constants/mood";
import { Palette } from "@/constants/theme";
import { fetchMyTodayMoodEntry } from "@/services/mood";
import type { MoodEntry, VisibilitySettings } from "@/types/mood";
import { useFocusEffect } from "@react-navigation/native";

export const DEFAULT_VISIBILITY: VisibilitySettings = {
  shareMoodWithAll: true,
  showReasonToPeers: "anonymized",
  showReasonToManagers: "visible",
  showReasonToHr: "visible",
  allowCustomRecipients: false,
};

const formatLoggedAt = (value?: string) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
};

const getContextLabel = (context: MoodEntry["context"] | undefined) => {
  switch (context) {
    case "professional":
      return "Travail";
    case "personal":
      return "Personnel";
    case "mixed":
      return "Mixte";
    default:
      return null;
  }
};

type MoodPublisherCardProps = {
  onOpenForm?: () => void;
};

export const MoodPublisherCard = ({
  onOpenForm,
}: MoodPublisherCardProps) => {
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);

  const loadTodayMood = useCallback(async () => {
    try {
      const entry = await fetchMyTodayMoodEntry();
      setTodayMood(entry);
    } catch {
      setTodayMood(null);
    }
  }, []);

  // Charge l'entrée du jour (s'il y en a une) pour décider publier/modifier
  useEffect(() => {
    void loadTodayMood();
  }, [loadTodayMood]);

  useFocusEffect(
    useCallback(() => {
      void loadTodayMood();
    }, [loadTodayMood])
  );

  const moodOption = useMemo(
    () => (todayMood ? getMoodOptionByValue(todayMood.moodValue) : null),
    [todayMood]
  );

  const accentColor = moodOption?.color ?? "#7C6CF6";
  const detailText =
    todayMood?.reasonSummary?.trim() ||
    todayMood?.note?.trim() ||
    moodOption?.description ||
    "Partage ton énergie avec l’équipe.";
  const lastUpdated = formatLoggedAt(todayMood?.loggedAt);
  const contextLabel = getContextLabel(todayMood?.context);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Ton mood</Text>

      <View style={styles.summaryWrapper}>
        <View style={[styles.summaryAccent, { backgroundColor: accentColor }]} />
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View
              style={[
                styles.emojiSurface,
                { borderColor: accentColor, backgroundColor: "#F7F6FF" },
              ]}
            >
              <Text style={styles.moodEmoji}>
                {moodOption?.emoji ?? "🙂"}
              </Text>
            </View>
            <View style={styles.summaryTexts}>
              <Text style={styles.moodTitle}>
                {moodOption?.title ?? "Mood non renseigné"}
              </Text>
              <Text style={styles.moodDesc}>{detailText}</Text>
            </View>
          </View>
          {contextLabel || lastUpdated ? (
            <View style={styles.summaryFooter}>
              {contextLabel ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{contextLabel}</Text>
                </View>
              ) : null}
              {lastUpdated ? (
                <Text style={styles.summaryMeta}>Mis à jour {lastUpdated}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={onOpenForm}
        style={styles.cta}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>
          {todayMood ? "Modifier mon mood" : "Partager mon mood"}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#F1EEFF",
    borderRadius: 28,
    padding: 22,
    gap: 18,
    borderWidth: 1,
    borderColor: "#E0DAFF",
    shadowColor: "#0000001a",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  summaryWrapper: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  summaryAccent: {
    width: 6,
    borderRadius: 999,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    gap: 14,
    shadowColor: "#00000011",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  emojiSurface: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F7F6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 30,
  },
  summaryTexts: {
    flex: 1,
    gap: 4,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  moodDesc: {
    color: Palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    backgroundColor: "#E9E6FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5C54C6",
  },
  summaryMeta: {
    fontSize: 12,
    color: "#7A7894",
  },
  cta: {
    backgroundColor: "#5C54C6",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00000022",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
