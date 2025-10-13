import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { CategoryPicker } from "@/components/mood/category-picker";
import { MoodContextToggle } from "@/components/mood/context-toggle";
import { MoodScale } from "@/components/mood/mood-scale";
import { VisibilityForm } from "@/components/mood/visibility-form";
import { getMoodOptionByValue } from "@/constants/mood";
import { Colors } from "@/constants/theme";
import { useMoodCategories } from "@/hooks/use-mood-categories";
import { createMoodEntry } from "@/services/mood";
import type { MoodContext, VisibilitySettings } from "@/types/mood";

const DEFAULT_VISIBILITY: VisibilitySettings = {
  shareMoodWithAll: true,
  showReasonToPeers: "anonymized",
  showReasonToManagers: "visible",
  showReasonToHr: "visible",
  allowCustomRecipients: false,
};

export default function LogMoodScreen() {
  const [moodValue, setMoodValue] = useState(4);
  const [context, setContext] = useState<MoodContext>("professional");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [reasonSummary, setReasonSummary] = useState("");
  const [note, setNote] = useState("");
  const [visibility, setVisibility] =
    useState<VisibilitySettings>(DEFAULT_VISIBILITY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { categories, isLoading: isLoadingCategories } = useMoodCategories();

  const moodOption = getMoodOptionByValue(moodValue);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await createMoodEntry({
        moodValue,
        moodLabel: moodOption.label,
        context,
        isAnonymous,
        reasonSummary: reasonSummary.trim() || null,
        note: note.trim() || null,
        loggedAt: new Date().toISOString(),
        categories: selectedCategories,
        visibility,
      });
      Alert.alert(
        "Humeur enregistrée",
        "Merci, ton humeur est prise en compte pour aujourd’hui."
      );
      setSelectedCategories([]);
      setReasonSummary("");
      setNote("");
      setIsAnonymous(false);
      setMoodValue(4);
      setVisibility(DEFAULT_VISIBILITY);
    } catch (err) {
      Alert.alert("Oups", (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Log ton humeur</Text>
            <Text style={styles.subtitle}>
              Choisis ton emoji, explique le contexte et partage avec qui tu
              veux.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Comment te sens-tu ?</Text>
            <Text style={styles.sectionSubtitle}>{moodOption.description}</Text>
            <MoodScale value={moodValue} onChange={setMoodValue} />
          </View>

          <View style={styles.card}>
            <MoodContextToggle value={context} onChange={setContext} />
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>
                Souhaites-tu rester anonyme ?
              </Text>
              <Switch value={isAnonymous} onValueChange={setIsAnonymous} />
            </View>
            <Text style={styles.muted}>
              Ton emoji reste visible mais ton nom peut être masqué selon cette
              option.
            </Text>
          </View>

          <View style={styles.card}>
            <CategoryPicker
              categories={categories}
              selected={selectedCategories}
              onChange={setSelectedCategories}
            />
            {isLoadingCategories ? (
              <Text style={styles.loading}>Chargement des catégories...</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Un mot sur ta journée</Text>
            <TextInput
              style={styles.input}
              value={reasonSummary}
              onChangeText={setReasonSummary}
              placeholder="Sélectionnez un sujet et ajoute une phrase rapide"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.muted}>
              Plus tu es précis, plus on pourra t’accompagner avec les bons
              leviers.
            </Text>
            <Text style={[styles.sectionTitle, styles.noteTitle]}>
              Tu veux détailler ?
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Ajoute quelques détails ou un contexte utile..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.card}>
            <VisibilityForm value={visibility} onChange={setVisibility} />
          </View>

          <View style={styles.actions}>
            <Text style={styles.helperText}>
              Tu peux modifier ton humeur plus tard dans la journée si besoin.
            </Text>
            <Pressable
              style={[
                styles.submitButton,
                isSubmitting && styles.submitDisabled,
              ]}
              onPress={isSubmitting ? undefined : handleSubmit}
            >
              <Text style={styles.submitText}>
                {isSubmitting ? "Enregistrement..." : "Publier mon humeur"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#EEF2FF",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    gap: 10,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    color: "#475569",
    fontSize: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    gap: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSubtitle: {
    color: "#475569",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  muted: {
    color: "#64748B",
    fontSize: 12,
  },
  loading: {
    color: "#64748B",
    fontSize: 12,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0F172A",
  },
  noteTitle: {
    marginTop: 6,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  actions: {
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  helperText: {
    color: "#475569",
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 18,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  submitDisabled: {
    opacity: 0.6,
  },
});
