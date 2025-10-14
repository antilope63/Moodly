import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useMoodHistory, MoodHistoryEntry } from '@/hooks/use-mood-history';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol'; 
import { UserAvatar } from '@/components/ui/UserAvatar';

const theme = {
  colors: {
    primary: '#4B93F2',
    primaryDark: '#154DBF',
    primaryLight: '#9FC3F2',
    tertiary: '#F2DA65',
    tertiaryDark: '#F2BE5E',
    backgroundLight: '#f6f8f8',
    foregroundLight: '#111827',
    subtleLight: '#6b7280',
    borderLight: 'rgba(107, 114, 128, 0.1)',
  },
  fontFamily: 'Manrope, sans-serif',
};

// --- Mapping des valeurs d'humeur aux Emojis ---
const moodValueToEmoji = (value: number) => {
  switch (value) {
    case 5:
      return '😊';
    case 4:
      return '🙂';
    case 3:
      return '😐';
    case 2:
      return '😟';
    case 1:
      return '😢';
    default:
      return '🤔';
  }
};

// --- Composants ---
const MoodEvolutionChart = ({ data }: { data: MoodHistoryEntry[] }) => (
  <View style={styles.chartContainer}>
    {/* Logique du graphique à implémenter si vous le souhaitez */}
    <Text style={styles.chartPlaceholder}>
      Le graphique d'évolution sera bientôt disponible !
    </Text>
  </View>
);

// --- Écran Principal ---
export default function HistoryScreen() {
  const { items, isLoading, error } = useMoodHistory();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState('Semaine');
  const periods = ['Jour', 'Semaine', 'Mois', 'Personnalisé'];

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const timelineData = useMemo(() => {
    // Ici, vous pourriez ajouter une logique de filtrage par période
    return items;
  }, [items, activePeriod]);

  const statsData = useMemo(() => {
    if (!items || items.length === 0) {
      return { averageMood: 0, positiveDays: 0 };
    }
    const totalValue = items.reduce((sum, item) => sum + item.mood_value, 0);
    const averageMood = parseFloat((totalValue / items.length).toFixed(1));
    const positiveDays = items.filter((item) => item.mood_value >= 4).length;
    return { averageMood, positiveDays };
  }, [items]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <UserAvatar name={user?.username || '?'} size={50} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color={theme.colors.subtleLight} />
          </Pressable>
        </View>

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodFilterContainer}
          >
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
          </ScrollView>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : error ? (
          <Text style={styles.errorText}>Erreur: {error.message}</Text>
        ) : (
          <>
            {/* ... le reste du contenu reste identique ... */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitlePrimary}>Mood Evolution</Text>
                <Text style={styles.cardSubtitle}>Cette semaine</Text>
              </View>
              <MoodEvolutionChart data={timelineData} />
              <View style={styles.chartLabels}>
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(
                  (day) => (
                    <Text key={day} style={styles.chartLabelText}>
                      {day}
                    </Text>
                  )
                )}
              </View>
            </View>

            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Timeline</Text>
                <Pressable>
                  <Text style={styles.seeAllText}>Voir tout</Text>
                </Pressable>
              </View>
              <View style={styles.timelineContainer}>
                {timelineData.map((item) => (
                  <View key={item.id} style={styles.timelineItem}>
                    <Text style={styles.timelineEmoji}>
                      {moodValueToEmoji(item.mood_value)}
                    </Text>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineMood}>
                          {item.mood_label}
                        </Text>
                        <Text style={styles.timelineDate}>
                          {format(new Date(item.logged_at), 'd MMM', {
                            locale: fr,
                          })}
                        </Text>
                      </View>
                      <Text style={styles.timelineNote} numberOfLines={1}>
                        {item.reason_summary || 'Aucune note'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
                Statistiques rapides
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{statsData.averageMood}</Text>
                  <Text style={styles.statLabel}>Mood moyen</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {statsData.positiveDays}
                  </Text>
                  <Text style={styles.statLabel}>Jours positifs</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.backgroundLight },
  header: {
    paddingTop: 16,
    backgroundColor: 'rgba(246, 248, 248, 0.8)',
  },
  // NOUVEAUX STYLES
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    marginBottom: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.foregroundLight,
  },
  email: {
    fontSize: 14,
    color: theme.colors.subtleLight,
  },
  logoutButton: {
    padding: 8,
  },
  // FIN NOUVEAUX STYLES
  periodFilterContainer: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  periodButton: {
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  periodButtonActive: { backgroundColor: theme.colors.primary },
  periodButtonInactive: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },
  periodButtonText: { fontSize: 14 },
  periodButtonTextActive: { color: 'white', fontWeight: '600' },
  periodButtonTextInactive: {
    color: theme.colors.subtleLight,
    fontWeight: '500',
  },
  mainContent: { padding: 16, gap: 32 },
  card: {
    backgroundColor: 'rgba(75, 147, 242, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  cardTitlePrimary: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  cardSubtitle: {
    color: theme.colors.subtleLight,
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    height: 160,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPlaceholder: { color: theme.colors.subtleLight, fontSize: 14 },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chartLabelText: { fontSize: 12, color: theme.colors.subtleLight },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.foregroundLight,
  },
  seeAllText: { color: theme.colors.primary, fontSize: 14 },
  timelineContainer: { gap: 8 },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  timelineEmoji: { fontSize: 24, marginTop: 4 },
  timelineContent: { flex: 1 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineMood: { fontWeight: '600', color: theme.colors.foregroundLight },
  timelineDate: { fontSize: 14, color: theme.colors.subtleLight },
  timelineNote: { marginTop: 4, fontSize: 14, color: theme.colors.subtleLight },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: { fontSize: 14, color: theme.colors.subtleLight },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
});