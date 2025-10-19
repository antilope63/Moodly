import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { getMoodOptionByValue } from "@/constants/mood";
import { getReflectionOption } from "@/constants/reflection-options";
import { Palette } from "@/constants/theme";
import type { MoodEntry, VisibilitySettings } from "@/types/mood";

const formatVisibility = (
  visibility: VisibilitySettings,
  isAnonymous: boolean
) => {
  if (isAnonymous) return "Anonyme";
  if (visibility.showReasonToPeers === "hidden")
    return "Raisons cachées aux collègues";
  if (visibility.showReasonToPeers === "anonymized")
    return "Raisons anonymisées pour les collègues";
  return "Raisons visibles par les collègues";
};

const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date;
  }
};

export const MoodCard = ({
  mood,
  highlightReason = false,
}: {
  mood: MoodEntry;
  highlightReason?: boolean;
}) => {
  const [showFullMessage, setShowFullMessage] = useState(false);
  const [isDetailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    setShowFullMessage(false);
    setDetailsVisible(false);
  }, [mood.id]);

  const option = getMoodOptionByValue(mood.moodValue);
  const accentColor =
    {
      1: "#FFADA6",
      2: "#F5ABC3",
      3: "#F2F5A9",
      4: "#DDCFF8",
      5: "#B8FFCE",
    }[mood.moodValue] ?? option.color;
  const contextLabel =
    mood.context === "professional"
      ? "Travail"
      : mood.context === "personal"
      ? "Personnel"
      : "Mixte";
  const authorName =
    mood.isAnonymous || !mood.loggedBy ? "Un collègue" : mood.loggedBy.username;
  const teamLabel = mood.team?.name ? `Équipe ${mood.team.name}` : null;
  const noteText = mood.note?.trim() ?? null;
  const reasonText = mood.reasonSummary?.trim() ?? null;
  const primaryMessage = useMemo(() => {
    if (highlightReason && reasonText) {
      return reasonText;
    }
    if (noteText) {
      return noteText;
    }
    return reasonText;
  }, [highlightReason, noteText, reasonText]);
  const normalizedMessage = primaryMessage ?? null;
  const hasLongMessage = (normalizedMessage?.length ?? 0) > 180;

  const detailOptions = useMemo(
    () =>
      [
        getReflectionOption(mood.freedomChoice),
        getReflectionOption(mood.supportChoice),
        getReflectionOption(mood.energyChoice),
      ].filter(
        (
          option
        ): option is NonNullable<ReturnType<typeof getReflectionOption>> =>
          Boolean(option)
      ),
    [mood.energyChoice, mood.freedomChoice, mood.supportChoice]
  );

  const prideDetail =
    typeof mood.pridePercent === "number"
      ? {
          key: "pride",
          emoji: "💪",
          message: `Je me sens efficace à ${mood.pridePercent}% aujourd’hui.`,
        }
      : null;

  const moodDetails = prideDetail
    ? [...detailOptions, prideDetail]
    : detailOptions;
  const hasDetails = Boolean(moodDetails.length) || Boolean(noteText);

  const openDetails = useCallback(() => {
    if (hasDetails) {
      setDetailsVisible(true);
    }
  }, [hasDetails]);

  const closeDetails = useCallback(() => {
    setDetailsVisible(false);
  }, []);

  return (
    <View style={styles.card}>
      <View style={[styles.sideAccent, { backgroundColor: accentColor }]} />
      <View style={styles.innerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.author}>{authorName}</Text>
          <View style={styles.badgesRow}>
            <View style={[styles.badge, styles.contextBadge]}>
              <Text style={styles.badgeText}>{contextLabel}</Text>
            </View>
            {teamLabel ? (
              <View style={[styles.badge, styles.teamBadge]}>
                <Text style={styles.badgeText}>{teamLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.bodyRow}>
          <View style={styles.emojiSurface}>
            <Text style={styles.emoji}>{option.emoji}</Text>
          </View>
          <View style={styles.messageColumn}>
            <Text style={styles.title}>{option.title}</Text>
            {normalizedMessage ? (
              <>
                <Text
                  style={styles.note}
                  numberOfLines={showFullMessage ? undefined : 2}
                >
                  {normalizedMessage}
                </Text>
                {hasLongMessage ? (
                  <Pressable
                    onPress={() => setShowFullMessage((current) => !current)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.noteToggle}>
                      {showFullMessage ? "Afficher moins" : "Afficher plus"}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
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
            <Text style={styles.timestamp}>{formatDate(mood.loggedAt)}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.visibility}>
            {formatVisibility(mood.visibility, mood.isAnonymous)}
          </Text>
        </View>
      </View>
      <BottomSheetModal
        visible={isDetailsVisible}
        onClose={closeDetails}
        sheetStyle={styles.modalSheet}
        showHandle={false}
        testID="mood-details-sheet"
      >
        <View style={styles.modalGrabber} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Détails du mood</Text>
          <Pressable
            onPress={closeDetails}
            accessibilityRole="button"
            style={styles.modalClose}
          >
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
          {moodDetails.length ? (
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Ressentis</Text>
              {moodDetails.map((detail) => (
                <View key={detail.key} style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailText}>
                    {detail.emoji ? `${detail.emoji} ` : ""}
                    {detail.message}
                  </Text>
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
  card: {
    borderRadius: 28,
    backgroundColor: "transparent",
    marginHorizontal: 4,
    flexDirection: "row",
    gap: 12,
  },
  sideAccent: {
    width: 10,
    borderRadius: 10,
    marginVertical: 12,
  },
  innerCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  author: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.textPrimary,
  },
  contextBadge: {
    backgroundColor: "#FEC6C6",
  },
  teamBadge: {
    backgroundColor: "#C9C3FF",
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  emojiSurface: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00000022",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  messageColumn: {
    flex: 1,
    gap: 6,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  note: {
    color: Palette.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  noteToggle: {
    color: Palette.bleuMarin,
    fontSize: 13,
    fontWeight: "600",
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
    color: Palette.bleuMarin,
    fontSize: 13,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
    color: "#8A8CA5",
    marginTop: 6,
  },
  footerRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E4F3",
    paddingTop: 12,
  },
  visibility: {
    color: "#8A8CA5",
    fontSize: 12,
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
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
  modalClose: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
