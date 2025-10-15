import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { getMoodOptionByValue } from "@/constants/mood";
import type { MoodEntry, VisibilitySettings } from "@/types/mood";

const formatVisibility = (
  visibility: VisibilitySettings,
  isAnonymous: boolean
) => {
  if (isAnonymous) return "Anonyme";
  if (visibility.showReasonToPeers === "hidden") {
    return "Raisons cachées aux collègues";
  }
  if (visibility.showReasonToPeers === "anonymized") {
    return "Raisons anonymisées pour les collègues";
  }
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
  const option = getMoodOptionByValue(mood.moodValue);
  const authorName =
    mood.isAnonymous || !mood.loggedBy ? "Un collègue" : mood.loggedBy.username;
  const contextLabel =
    mood.context === "professional"
      ? "Pro"
      : mood.context === "personal"
      ? "Perso"
      : "Mixte";

  return (
    <View style={styles.card}>
      <View style={[styles.header, { backgroundColor: option.color }]}>
        <Text style={styles.emoji}>{option.emoji}</Text>
        <View style={styles.headerText}>
          <Text style={styles.moodLabel}>{option.title}</Text>
          <Text style={styles.moodMeta}>
            {`${contextLabel} • ${formatDate(mood.loggedAt)}`}
          </Text>
        </View>
        <Badge
          label={mood.isAnonymous ? "Anonyme" : "Identifié"}
          tone={mood.isAnonymous ? "warning" : "success"}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.author}>
          {mood.team?.name
            ? `${authorName} • ${mood.team.name}`
            : authorName}
        </Text>

        {highlightReason && mood.reasonSummary ? (
          <Text style={styles.reason}>{mood.reasonSummary}</Text>
        ) : null}
        {mood.note ? <Text style={styles.note}>{mood.note}</Text> : null}

        {mood.categories?.length ? (
          <View style={styles.categories}>
            {mood.categories.map((category) => (
              <Chip key={category.id} label={category.name} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.visibility}>
          {formatVisibility(mood.visibility, mood.isAnonymous)}
        </Text>
        {mood.additionalViewers?.length ? (
          <Text style={styles.visibility}>
            Partagé avec {mood.additionalViewers.length}{" "}
            {mood.additionalViewers.length > 1
              ? "collaborateurs ciblés"
              : "collaborateur ciblé"}
            .
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginHorizontal: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
  },
  emoji: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  moodLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  moodMeta: {
    color: "#EEF2FF",
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  author: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  reason: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "600",
  },
  note: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 4,
    backgroundColor: "#F8FAFC",
  },
  visibility: {
    color: "#475569",
    fontSize: 12,
  },
});

