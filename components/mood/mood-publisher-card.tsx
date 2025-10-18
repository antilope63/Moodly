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

const MOOD_VALUES = [1, 2, 3, 4, 5] as const;

type MoodPublisherCardProps = {
  onOpenForm?: (initialMoodValue?: number) => void;
};

export const MoodPublisherCard = ({ onOpenForm }: MoodPublisherCardProps) => {
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

  const handleOpenMoodForm = useCallback(
    (value?: number) => {
      if (typeof onOpenForm === "function") {
        onOpenForm(value);
      }
    },
    [onOpenForm]
  );

  const handleEdit = useCallback(() => {
    handleOpenMoodForm(todayMood?.moodValue);
  }, [handleOpenMoodForm, todayMood?.moodValue]);

  const handleSelectMood = useCallback(
    (value: number) => {
      handleOpenMoodForm(value);
    },
    [handleOpenMoodForm]
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ton mood</Text>
        {todayMood ? (
          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.editButtonPressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.editButtonLabel}>Modifier</Text>
          </Pressable>
        ) : null}
      </View>

      {todayMood ? (
        <Pressable
          onPress={handleEdit}
          style={({ pressed }) => [
            styles.publishedCard,
            pressed && styles.publishedCardPressed,
          ]}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.emojiSurface,
              { borderColor: accentColor },
            ]}
          >
            <Text style={styles.moodEmoji}>{moodOption?.emoji ?? "🙂"}</Text>
          </View>
          <View style={styles.summaryTexts}>
            <Text style={styles.moodTitle}>
              {moodOption?.title ?? "Mood non renseigné"}
            </Text>
            <Text style={styles.moodDesc}>{detailText}</Text>
            {contextLabel || lastUpdated ? (
              <View style={styles.metaRow}>
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
        </Pressable>
      ) : (
        <View style={styles.unpublishedContent}>
          <Text style={styles.helperText}>{detailText}</Text>
          <View style={styles.emojiRow}>
            {MOOD_VALUES.map((value) => {
              const option = getMoodOptionByValue(value);
              return (
                <Pressable
                  key={value}
                  onPress={() => handleSelectMood(value)}
                  style={({ pressed }) => [
                    styles.emojiChoice,
                    pressed && styles.emojiChoicePressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Partager mon mood ${option.title}`}
                >
                  <Text style={styles.emojiChoiceIcon}>{option.emoji}</Text>
                  <Text style={styles.emojiChoiceLabel}>{option.title}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emojiSurface: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
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
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.08)",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  editButtonPressed: {
    opacity: 0.85,
  },
  editButtonLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.textPrimary,
  },
  publishedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  publishedCardPressed: {
    opacity: 0.9,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  unpublishedContent: {
    gap: 16,
  },
  helperText: {
    color: Palette.textSecondary,
    fontSize: 14,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  emojiChoice: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.05)",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  emojiChoicePressed: {
    opacity: 0.85,
  },
  emojiChoiceIcon: {
    fontSize: 28,
  },
  emojiChoiceLabel: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
});
