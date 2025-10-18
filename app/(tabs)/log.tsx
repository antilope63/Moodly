import { Switch as TamSwitch } from "@tamagui/switch";
import { useToastController } from "@tamagui/toast";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Button,
  Fieldset,
  Form,
  Input,
  Label,
  Paragraph,
  XStack,
  YStack,
} from "tamagui";

import { CategoryPicker } from "@/components/mood/category-picker";
import { MoodContextToggle } from "@/components/mood/context-toggle";
import { DEFAULT_VISIBILITY } from "@/components/mood/mood-publisher-card";
import { MoodScale } from "@/components/mood/mood-scale";
import { VisibilityForm } from "@/components/mood/visibility-form";
import { getMoodOptionByValue } from "@/constants/mood";
import { Palette } from "@/constants/theme";
import { useMoodCategories } from "@/hooks/use-mood-categories";
import { useAuth } from "@/providers/auth-provider";
import {
  createMoodEntry,
  fetchMyTodayMoodEntry,
  updateMoodEntry,
} from "@/services/mood";
import type { MoodContext, VisibilitySettings } from "@/types/mood";

export default function LogMoodScreen() {
  const router = useRouter();
  const toast = useToastController();
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
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

  useEffect(() => {
    let mounted = true;
    fetchMyTodayMoodEntry()
      .then((entry) => {
        if (!mounted || !entry) return;
        setEditingId(entry.id);
        setMoodValue(entry.moodValue);
        setContext(entry.context);
        setIsAnonymous(entry.isAnonymous);
        setSelectedCategories((entry.categories || []).map((c) => c.id));
        setReasonSummary(entry.reasonSummary || "");
        setNote(entry.note || "");
        setVisibility(entry.visibility);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user?.id) {
      toast.show("Oups", {
        description: "Connecte-toi pour partager ton humeur.",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      if (editingId) {
        await updateMoodEntry(editingId, {
          moodValue,
          context,
          isAnonymous,
          reasonSummary: reasonSummary.trim() || null,
          note: note.trim() || null,
          loggedAt: new Date().toISOString(),
          categories: selectedCategories,
          visibility,
        });
      } else {
        await createMoodEntry({
          moodValue,
          context,
          isAnonymous,
          reasonSummary: reasonSummary.trim() || null,
          note: note.trim() || null,
          loggedAt: new Date().toISOString(),
          categories: selectedCategories,
          visibility,
          userId: user.id,
        });
      }

      toast.show(editingId ? "Humeur mise à jour" : "Humeur enregistrée", {
        description: editingId
          ? "Tes informations du jour ont été mises à jour."
          : "Ton humeur a été prise en compte pour aujourd’hui.",
      });

      setSelectedCategories([]);
      setReasonSummary("");
      setNote("");
      setIsAnonymous(false);
      setMoodValue(4);
      setVisibility(DEFAULT_VISIBILITY);

      // Ferme toute modale/feuille éventuelle puis retourne au feed
      const dismissAll = (router as unknown as { dismissAll?: () => void })
        ?.dismissAll;
      if (typeof dismissAll === "function") {
        try {
          dismissAll();
          return;
        } catch {
          // fallback vers navigation classique si dismissAll plante
        }
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/feed");
      }
    } catch (err) {
      toast.show("Oups", {
        description: (err as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    context,
    isAnonymous,
    moodValue,
    note,
    reasonSummary,
    router,
    selectedCategories,
    visibility,
    toast,
    user?.id,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.navRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
            >
              <Text style={styles.backLabel}>←</Text>
            </Pressable>
          </View>
          <Form
            style={styles.form}
            onSubmit={() => {
              if (!isSubmitting) {
                void handleSubmit();
              }
            }}
          >
            <YStack gap="$4">
              <YStack gap="$2">
                <Text style={styles.title}>Publie ton humeur</Text>
                <Paragraph size="$2" color="$color10">
                  Choisis ton emoji, précise le contexte et partage les bonnes
                  infos à ton équipe.
                </Paragraph>
              </YStack>

              <View style={styles.card}>
                <Fieldset gap="$3">
                  <Label style={styles.fieldLabel}>Comment te sens-tu ?</Label>
                  <MoodScale value={moodValue} onChange={setMoodValue} />
                  <Paragraph size="$2" color="$color10">
                    Ton emoji reste visible pour tout le monde.
                  </Paragraph>
                </Fieldset>
              </View>

              <View style={styles.card}>
                <Fieldset gap="$3">
                  <Label style={styles.fieldLabel}>Dans quel contexte ?</Label>
                  <MoodContextToggle value={context} onChange={setContext} />
                </Fieldset>
              </View>

              <View style={styles.card}>
                <Fieldset gap="$3">
                  <XStack>
                    <Label style={styles.fieldLabel}>
                      Souhaites-tu rester anonyme ?
                    </Label>
                    <TamSwitch
                      size="$3"
                      checked={isAnonymous}
                      onCheckedChange={(value) =>
                        setIsAnonymous(Boolean(value))
                      }
                    >
                      <TamSwitch.Thumb animation="lazy" />
                    </TamSwitch>
                  </XStack>
                  <Paragraph size="$2" color="$color10">
                    Ton emoji reste visible mais ton nom peut être masqué selon
                    cette option.
                  </Paragraph>
                </Fieldset>
              </View>

              <View style={styles.card}>
                <Fieldset gap="$3">
                  <Label style={styles.fieldLabel}>
                    Pourquoi cette humeur ?
                  </Label>
                  <CategoryPicker
                    categories={categories}
                    selected={selectedCategories}
                    onChange={setSelectedCategories}
                  />
                  {isLoadingCategories ? (
                    <Paragraph size="$2" color="$color10">
                      Chargement des catégories...
                    </Paragraph>
                  ) : null}
                </Fieldset>
              </View>

              <View style={styles.card}>
                <Fieldset gap="$3">
                  <Label style={styles.fieldLabel}>Un mot sur ta journée</Label>
                  <Input
                    value={reasonSummary}
                    onChangeText={setReasonSummary}
                    placeholder="Sélectionne un sujet et ajoute une phrase rapide"
                    placeholderTextColor="#94A3B8"
                  />
                  <Label style={styles.fieldLabel}>Des détails ?</Label>
                  <Input
                    value={note}
                    onChangeText={setNote}
                    placeholder="Ajoute quelques détails ou un contexte utile..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    style={styles.textArea}
                  />
                </Fieldset>
              </View>

              <View style={styles.card}>
                <Fieldset gap="$3">
                  <Label style={styles.fieldLabel}>Visibilité</Label>
                  <VisibilityForm value={visibility} onChange={setVisibility} />
                </Fieldset>
              </View>
            </YStack>

            <Form.Trigger asChild>
              <Button theme="accent" size="$5" disabled={isSubmitting}>
                {isSubmitting
                  ? "Enregistrement..."
                  : editingId
                  ? "Mettre à jour mon humeur"
                  : "Publier mon humeur"}
              </Button>
            </Form.Trigger>
          </Form>
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
    backgroundColor: Palette.whiteBackground,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  form: {},
  navRow: {
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.mauvePastel,
    alignItems: "center",
    justifyContent: "center",
  },
  backLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: Palette.textPrimary,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  card: {
    backgroundColor: "#F5F3FF",
    padding: 20,
    borderRadius: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: "#E5E1FF",
    shadowColor: "#00000011",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  textArea: {
    minHeight: 120,
  },
});
