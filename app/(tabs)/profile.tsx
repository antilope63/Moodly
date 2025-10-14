import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useMoodHistory } from '@/hooks/use-mood-history';
import {
  format,
  subDays,
  isSameDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { MoodEntry } from '@/types/mood';

const theme = {
  colors: {
    primary: '#4B93F2',
    primaryDark: '#154DBF',
    primaryLight: '#9FC3F2',
    backgroundLight: '#f6f8f8',
    foregroundLight: '#111827',
    subtleLight: '#6b7280',
    borderLight: 'rgba(107, 114, 128, 0.1)',
  },
};

const moodValueToEmoji = (value: number) => {
  switch (value) {
    case 5: return '😊';
    case 4: return '🙂';
    case 3: return '😐';
    case 2: return '😟';
    case 1: return '😢';
    default: return '🤔';
  }
};

const CHART_HEIGHT = 100;
const CHART_WIDTH = Dimensions.get('window').width - 70;

const MoodEvolutionChart = ({ data, activePeriod }: { data: MoodEntry[]; activePeriod: string }) => {
  const chartData = useMemo(() => {
    const today = new Date();
    const daysToShow = activePeriod === 'Mois' ? 30 : 7;
    const days = Array.from({ length: daysToShow }).map((_, i) => subDays(today, daysToShow - 1 - i));

    return days.map(date => {
      const entryForDay = data.find(entry => isSameDay(new Date(entry.loggedAt), date));
      return {
        label: format(date, activePeriod === 'Mois' ? 'd' : 'E', { locale: fr }),
        score: entryForDay ? entryForDay.moodValue : 0,
      };
    });
  }, [data, activePeriod]);

  const points = useMemo(() => {
    return chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - ((point.score / 5) * (CHART_HEIGHT - 10)) + 5;
      return { x, y, score: point.score };
    });
  }, [chartData]);

  // --- CORRECTION DE LA LOGIQUE DU TRACÉ ---
  const path = useMemo(() => {
    // On ne garde que les points qui ont une donnée pour tracer la ligne
    const visiblePoints = points.filter(p => p.score > 0);

    if (visiblePoints.length < 2) {
      return ''; // Pas assez de points pour tracer une ligne
    }

    // On commence le tracé au premier point visible
    let d = `M${visiblePoints[0].x},${visiblePoints[0].y}`;

    // On connecte les points visibles suivants
    for (let i = 1; i < visiblePoints.length; i++) {
      d += ` L${visiblePoints[i].x},${visiblePoints[i].y}`;
    }

    return d;
  }, [points]);

  if (data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartPlaceholder}>Pas de données pour le graphique.</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartWrapper}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Path d={path} fill="none" stroke={theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" />
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
        {chartData.map((day, index) => (
          <Text key={index} style={[styles.chartLabelText, activePeriod === 'Mois' && styles.monthlyLabel]}>
            {day.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default function HistoryScreen() {
  const { items, isLoading, error } = useMoodHistory();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState('Semaine');
  const periods = ['Semaine', 'Mois'];

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const statsData = useMemo(() => {
    if (!items || items.length === 0) {
      return { averageMood: 0, positiveDays: 0 };
    }
    const totalValue = items.reduce((sum, item) => sum + item.moodValue, 0);
    const averageMood = parseFloat((totalValue / items.length).toFixed(1));
    const positiveDays = items.filter(item => item.moodValue >= 4).length;
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodFilterContainer}>
            {periods.map((period) => (
              <Pressable
                key={period}
                style={[
                  styles.periodButton,
                  activePeriod === period ? styles.periodButtonActive : styles.periodButtonInactive,
                ]}
                onPress={() => setActivePeriod(period)}>
                <Text
                  style={[
                    styles.periodButtonText,
                    activePeriod === period ? styles.periodButtonTextActive : styles.periodButtonTextInactive,
                  ]}>
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
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitlePrimary}>Mood Evolution</Text>
                <Text style={styles.cardSubtitle}>{activePeriod}</Text>
              </View>
              <MoodEvolutionChart data={items} activePeriod={activePeriod} />
            </View>

            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Derniers logs</Text>
                <Pressable><Text style={styles.seeAllText}>Voir tout</Text></Pressable>
              </View>
              <View style={styles.timelineContainer}>
                {items.slice(0, 5).map(item => (
                  <View key={item.id} style={styles.timelineItem}>
                    <Text style={styles.timelineEmoji}>{moodValueToEmoji(item.moodValue)}</Text>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineMood}>{item.moodLabel}</Text>
                        <Text style={styles.timelineDate}>
                          {format(new Date(item.loggedAt), 'd MMM', { locale: fr })}
                        </Text>
                      </View>
                      <Text style={styles.timelineNote} numberOfLines={1}>
                        {item.reasonSummary || 'Aucune note'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Statistiques rapides</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.backgroundLight },
  header: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatar: { marginRight: 12 },
  userInfo: { flex: 1 },
  username: { fontSize: 18, fontWeight: '700', color: theme.colors.foregroundLight },
  email: { fontSize: 14, color: theme.colors.subtleLight },
  logoutButton: { padding: 8 },
  periodFilterContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 8 },
  periodButton: { borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 16 },
  periodButtonActive: { backgroundColor: theme.colors.primary },
  periodButtonInactive: { backgroundColor: theme.colors.backgroundLight, borderWidth: 1, borderColor: 'rgba(107, 114, 128, 0.2)' },
  periodButtonText: { fontSize: 14 },
  periodButtonTextActive: { color: 'white', fontWeight: '600' },
  periodButtonTextInactive: { color: theme.colors.subtleLight, fontWeight: '500' },
  mainContent: { padding: 16, gap: 32 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, },
  cardHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cardTitlePrimary: { color: theme.colors.foregroundLight, fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: theme.colors.subtleLight, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  chartWrapper: { alignItems: 'center', marginTop: 24, paddingBottom: 8 },
  chartContainer: { height: CHART_HEIGHT, justifyContent: 'center' },
  chartPlaceholder: { color: theme.colors.subtleLight, fontSize: 14, textAlign: 'center' },
  graphLabelContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 8 },
  chartLabelText: { fontSize: 11, color: theme.colors.subtleLight, textTransform: 'capitalize', flex: 1, textAlign: 'center' },
  monthlyLabel: { fontSize: 9 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.foregroundLight },
  seeAllText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
  timelineContainer: { gap: 8 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 12, borderRadius: 12, backgroundColor: theme.colors.backgroundLight, borderWidth: 1, borderColor: theme.colors.borderLight },
  timelineEmoji: { fontSize: 24 },
  timelineContent: { flex: 1 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineMood: { fontWeight: '600', color: theme.colors.foregroundLight, textTransform: 'capitalize' },
  timelineDate: { fontSize: 14, color: theme.colors.subtleLight },
  timelineNote: { marginTop: 4, fontSize: 14, color: theme.colors.subtleLight },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: theme.colors.primary },
  statLabel: { fontSize: 14, color: theme.colors.subtleLight },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
});