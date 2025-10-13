import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// --- Thème et Constantes ---
// Inspiré de votre configuration Tailwind
const theme = {
  colors: {
    primary: '#137fec',
    backgroundLight: '#f6f7f8',
    textDark: '#18181b', // zinc-900
    textLight: '#a1a1aa', // zinc-400
    border: '#e4e4e7', // zinc-200
  },
  fontFamily: 'Manrope, sans-serif', // Note: Assurez-vous que la police 'Manrope' est chargée dans votre projet Expo
};

// --- Données Mock ---
const historyData = [
  {
    id: '1',
    day: "Aujourd'hui",
    mood: 'Bonne humeur',
    color: '#22c55e', // green-500
    bgColor: '#dcfce7', // green-100
    icon: (
      <Path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM80,108a12,12,0,1,1,12,12A12,12,0,0,1,80,108Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,108Zm-1.07,48c-10.29,17.79-27.4,28-46.93,28s-36.63-10.2-46.92-28a8,8,0,1,1,13.84-8c7.47,12.91,19.21,20,33.08,20s25.61-7.1,33.07-20a8,8,0,0,1,13.86,8Z" />
    ),
  },
  {
    id: '2',
    day: 'Hier',
    mood: 'Humeur neutre',
    color: '#eab308', // yellow-500
    bgColor: '#fefce8', // yellow-100
    icon: (
      <Path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM80,108a12,12,0,1,1,12,12A12,12,0,0,1,80,108Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,108ZM172,160H84a8,8,0,0,1,0-16h88a8,8,0,0,1,0,16Z" />
    ),
  },
  {
    id: '3',
    day: '11 Oct. 2025',
    mood: 'Mauvaise humeur',
    color: '#ef4444', // red-500
    bgColor: '#fee2e2', // red-100
    icon: (
      <Path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM80,108a12,12,0,1,1,12,12A12,12,0,0,1,80,108Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,108Zm-1.07,32a8,8,0,0,1-13.86,8c-7.46,12.9-19.2,20-33.07,20s-25.61-7.1-33.08-20a8,8,0,1,1,13.84-8c10.29-17.79,27.4-28,46.93-28S162.29,140.2,170.93,152Z" />
    ),
  },
];

const commentsData = [
  {
    id: '1',
    name: 'Sophie Martin',
    date: '11 Oct. 2025',
    text: "J'ai eu une journée difficile au travail, mais j'ai pu me détendre en faisant du sport après.",
    avatar: 'https://i.pravatar.cc/150?u=sophie',
  },
];

// --- Composant d'icône générique ---
const Icon = ({ path, size = 24, color = 'currentColor' }: { path: React.ReactNode, size?: number, color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill={color}>
    {path}
  </Svg>
);

// --- Écran Principal ---
export default function HistoryScreen() {
  const [activePeriod, setActivePeriod] = useState('7 jours');
  const periods = ['7 jours', '30 jours'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerButton}>
            <Icon color={theme.colors.textDark} path={<Path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />} />
          </Pressable>
          <Text style={styles.headerTitle}>Historique</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Filtres de Période */}
          <View style={styles.periodFilterContainer}>
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
          </View>

          {/* Filtres de Catégories */}
          <View style={styles.categoryFilterContainer}>
            <Pressable style={styles.categoryButton}>
              <Text style={styles.categoryButtonText}>Type de raison</Text>
              <Icon size={16} color={theme.colors.textLight} path={<Path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />} />
            </Pressable>
            <Pressable style={styles.categoryButton}>
              <Text style={styles.categoryButtonText}>Catégories</Text>
              <Icon size={16} color={theme.colors.textLight} path={<Path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />} />
            </Pressable>
          </View>

          {/* Timeline */}
          <View style={styles.timelineContainer}>
            {historyData.map((item, index) => (
              <View key={item.id} style={styles.timelineItem}>
                {index < historyData.length - 1 && <View style={styles.timelineLine} />}
                <View style={styles.timelineIconContainer}>
                  <View style={[styles.timelineIcon, { backgroundColor: item.bgColor }]}>
                    <Icon path={item.icon} color={item.color} />
                  </View>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDay}>{item.day}</Text>
                  <Text style={styles.timelineMood}>{item.mood}</Text>
                </View>
              </View>
            ))}
          </View>
          
          {/* Bouton d'action */}
          <Pressable style={styles.mainActionButton}>
            <Text style={styles.mainActionButtonText}>Modifier l'humeur du jour</Text>
          </Pressable>

          {/* Section Commentaires */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Commentaires</Text>
            {commentsData.map(comment => (
                <View key={comment.id} style={styles.commentCard}>
                    <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                    <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                            <Text style={styles.commentName}>{comment.name}</Text>
                            <Text style={styles.commentDate}>{comment.date}</Text>
                        </View>
                        <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}


// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(246, 247, 248, 0.8)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  scrollContent: {
    padding: 16,
  },
  periodFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodButtonInactive: {
    backgroundColor: 'rgba(19, 127, 236, 0.1)',
  },
  periodButtonText: {
    fontSize: 14,
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  periodButtonTextInactive: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundLight,
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#3f3f46', // zinc-700
  },
  timelineContainer: {
    position: 'relative',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 40,
    width: 2,
    height: '100%',
    backgroundColor: theme.colors.border,
  },
  timelineIconContainer: {
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineDay: {
    fontWeight: '700',
    color: theme.colors.textDark,
    fontSize: 16,
  },
  timelineMood: {
    color: '#71717a', // zinc-500
    fontSize: 14,
  },
  mainActionButton: {
    marginTop: 32,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  mainActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  commentsSection: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 16,
  },
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundLight,
  },
  commentAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
  },
  commentContent: {
      flex: 1,
  },
  commentHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
  },
  commentName: {
      fontWeight: '700',
      color: theme.colors.textDark,
  },
  commentDate: {
      fontSize: 12,
      color: theme.colors.textLight,
  },
  commentText: {
      marginTop: 4,
      fontSize: 14,
      color: '#52525b', // zinc-600
  }
});