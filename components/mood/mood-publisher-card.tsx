import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { getMoodOptionByValue } from "@/constants/mood";
import { getReflectionOption } from "@/constants/reflection-options";
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
  const [isDetailsVisible, setDetailsVisible] = useState(false);

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
  const helperText = todayMood
    ? null
    : "Partage ton énergie avec l’équipe.";
  const noteText = todayMood?.note?.trim() ?? null;
  const reflectionDetails = useMemo(() => {
    if (!todayMood) {
      return [];
    }
    const base = [
      getReflectionOption(todayMood.freedomChoice),
      getReflectionOption(todayMood.supportChoice),
      getReflectionOption(todayMood.energyChoice),
    ]
      .filter(
        (
          option
        ): option is NonNullable<ReturnType<typeof getReflectionOption>> =>
          Boolean(option)
      )
      .map((option) => ({
        key: option.key,
        text: `${option.emoji} ${option.message}`,
      }));
    if (typeof todayMood.pridePercent === "number") {
      base.push({
        key: "pride",
        text: `💪 Je me sens efficace à ${todayMood.pridePercent}% aujourd’hui.`,
      });
    }
    return base;
  }, [
    todayMood,
    todayMood?.energyChoice,
    todayMood?.freedomChoice,
    todayMood?.supportChoice,
    todayMood?.pridePercent,
  ]);
  const contextLabel = getContextLabel(todayMood?.context);
  const lastUpdated = formatLoggedAt(todayMood?.loggedAt);
  const hasDetails = Boolean(noteText) || reflectionDetails.length > 0;
  const previewLine =
    noteText ??
    reflectionDetails[0]?.text ??
    "Aucun détail renseigné aujourd’hui.";

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

  const openDetails = useCallback(() => {
    if (hasDetails) {
      setDetailsVisible(true);
    }
  }, [hasDetails]);

  const closeDetails = useCallback(() => {
    setDetailsVisible(false);
  }, []);

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ton mood</Text>
        <Pressable
          onPress={todayMood ? handleEdit : () => handleOpenMoodForm()}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.editButtonPressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.editButtonLabel}>
            {todayMood ? "Modifier" : "Ajouter"}
          </Text>
        </Pressable>
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
            <Text style={styles.previewText} numberOfLines={2}>
              {previewLine}
            </Text>
            {hasDetails ? (
              <Pressable
                onPress={openDetails}
                style={({ pressed }) => [
                  styles.detailButton,
                  pressed && styles.detailButtonPressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.detailButtonLabel}>Voir les détails</Text>
              </Pressable>
            ) : null}
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
          <Text style={styles.helperText}>
            {helperText ?? "Partage ton énergie avec l’équipe."}
          </Text>
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
      <BottomSheetModal
        visible={isDetailsVisible}
        onClose={closeDetails}
        sheetStyle={styles.modalSheet}
        showHandle={false}
        testID="publisher-details-sheet"
      >
        <View style={styles.modalGrabber} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Détails de ton mood</Text>
          <Pressable onPress={closeDetails} accessibilityRole="button">
            <Text style={styles.modalCloseLabel}>Fermer</Text>
          </Pressable>
        </View>
        <View style={styles.modalContent}>
          {noteText ? (
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Note</Text>
              <Text style={styles.modalSectionText}>{noteText}</Text>
            </View>
          ) : null}
          {reflectionDetails.length ? (
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Ressentis</Text>
              {reflectionDetails.map((detail) => (
                <View key={detail.key} style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailText}>{detail.text}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </BottomSheetModal>
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
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
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
  previewText: {
    color: Palette.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  detailButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#F2F4FF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  detailButtonPressed: {
    opacity: 0.7,
  },
  detailButtonLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.bleuMarin,
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
  editButton: {},
  editButtonPressed: { opacity: 0.7 },
  editButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Palette.bleuMarin,
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
    shadowOpacity: 0.15,
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
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },
  modalGrabber: {
    alignSelf: "center",
    height: 6,
    width: 48,
    borderRadius: 999,
    backgroundColor: "#D8DBE8",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  modalCloseLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Palette.bleuMarin,
  },
  modalContent: {
    gap: 20,
  },
  modalSection: {
    gap: 8,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Palette.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  modalSectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: Palette.textPrimary,
  },
  modalDetailRow: {
    backgroundColor: "#F2F4FF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalDetailText: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textPrimary,
  },
});
