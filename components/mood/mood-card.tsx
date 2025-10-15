import { StyleSheet, Text, View } from 'react-native';

import { getMoodOptionByValue } from '@/constants/mood';
import { Palette } from '@/constants/theme';
import type { MoodEntry, VisibilitySettings } from '@/types/mood';

const formatVisibility = (visibility: VisibilitySettings, isAnonymous: boolean) => {
  if (isAnonymous) return 'Anonyme';
  if (visibility.showReasonToPeers === 'hidden') return 'Raisons cachées aux collègues';
  if (visibility.showReasonToPeers === 'anonymized') return 'Raisons anonymisées pour les collègues';
  return 'Raisons visibles par les collègues';
};

const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
};

export const MoodCard = ({ mood, highlightReason = false }: { mood: MoodEntry; highlightReason?: boolean }) => {
  const option = getMoodOptionByValue(mood.moodValue);
  const accentColor =
    {
      1: '#FFADA6',
      2: '#F5ABC3',
      3: '#F2F5A9',
      4: '#DDCFF8',
      5: '#B8FFCE',
    }[mood.moodValue] ?? option.color;
  const contextLabel = (
    mood.context === 'professional'
      ? 'Travail'
      : mood.context === 'personal'
      ? 'Personnel'
      : 'Mixte'
  );
  const authorName = mood.isAnonymous || !mood.loggedBy ? 'Un collègue' : mood.loggedBy.username;
  const teamLabel = mood.team?.name ? `Équipe ${mood.team.name}` : null;
  const primaryMessage =
    (highlightReason && mood.reasonSummary) || mood.note || mood.reasonSummary || null;

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
            {primaryMessage ? <Text style={styles.note}>{primaryMessage}</Text> : null}
            <Text style={styles.timestamp}>{formatDate(mood.loggedAt)}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.visibility}>{formatVisibility(mood.visibility, mood.isAnonymous)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    backgroundColor: 'transparent',
    marginHorizontal: 4,
    flexDirection: 'row',
    gap: 12,
  },
  sideAccent: {
    width: 10,
    borderRadius: 10,
    marginVertical: 12,
  },
  innerCard: {
    flex: 1,
    backgroundColor: Palette.whiteBackground,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: Palette.bleuPastel,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  contextBadge: {
    backgroundColor: '#FEC6C6',
  },
  teamBadge: {
    backgroundColor: '#C9C3FF',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emojiSurface: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00000022',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emoji: {
    fontSize: 30,
  },
  messageColumn: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  note: {
    color: Palette.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#8A8CA5',
  },
  footerRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E4F3',
    paddingTop: 12,
  },
  visibility: {
    color: '#8A8CA5',
    fontSize: 12,
  },
});
