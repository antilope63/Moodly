import { Switch as TamSwitch } from "@tamagui/switch";
import { useToastController } from "@tamagui/toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Button, Input, Slider } from "tamagui";

import { MoodContextToggle } from "@/components/mood/context-toggle";
import { DEFAULT_VISIBILITY } from "@/components/mood/mood-publisher-card";
import { MoodScale } from "@/components/mood/mood-scale";
import { VisibilityForm } from "@/components/mood/visibility-form";
import { getMoodOptionByValue } from "@/constants/mood";
import {
  ENERGY_OPTIONS,
  FREEDOM_OPTIONS,
  SUPPORT_OPTIONS,
  type ReflectionOption,
} from "@/constants/reflection-options";
import { Palette } from "@/constants/theme";
import { useAuth } from "@/providers/auth-provider";
import {
  createMoodEntry,
  fetchMyTodayMoodEntry,
  updateMoodEntry,
} from "@/services/mood";
import type { MoodContext, VisibilitySettings } from "@/types/mood";

const parseMoodParam = (
  value: string | string[] | undefined
): number | null => {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = candidate ? Number.parseInt(candidate, 10) : NaN;
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (parsed < 1 || parsed > 5) {
    return null;
  }
  return parsed;
};

const CONTEXT_LABEL: Record<MoodContext, string> = {
  professional: "Travail",
  personal: "Personnel",
  mixed: "Mixte",
};

export default function LogMoodScreen() {
  const router = useRouter();
  const toast = useToastController();
  const params = useLocalSearchParams<{ moodValue?: string }>();
  const { user } = useAuth();
  const initialMoodFromParams = parseMoodParam(params?.moodValue);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [moodValue, setMoodValue] = useState<number>(
    initialMoodFromParams ?? 4
  );
  const [context, setContext] = useState<MoodContext>("professional");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] =
    useState<VisibilitySettings>(DEFAULT_VISIBILITY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [freedomChoice, setFreedomChoice] = useState<string | null>(null);
  const [supportChoice, setSupportChoice] = useState<string | null>(null);
  const [energyChoice, setEnergyChoice] = useState<string | null>(null);
  const [prideValue, setPrideValue] = useState<number>(70);
  const [isConfigOpen, setConfigOpen] = useState(false);

  const moodOption = getMoodOptionByValue(moodValue);
  const selectedFreedom = FREEDOM_OPTIONS.find(
    (option) => option.key === freedomChoice
  );
  const selectedSupport = SUPPORT_OPTIONS.find(
    (option) => option.key === supportChoice
  );
  const selectedEnergy = ENERGY_OPTIONS.find(
    (option) => option.key === energyChoice
  );

  useEffect(() => {
    if (initialMoodFromParams !== null) {
      setMoodValue(initialMoodFromParams);
    }
  }, [initialMoodFromParams]);

  const renderReflectionCard = (
    title: string,
    options: ReflectionOption[],
    selectedKey: string | null,
    onSelect: (key: string) => void,
    placeholder: string
  ) => {
    const selectedOption =
      options.find((option) => option.key === selectedKey) ?? null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.reflectionRow}>
          {options.map((option) => {
            const isActive = option.key === selectedKey;
            return (
              <Pressable
                key={option.key}
                onPress={() => onSelect(option.key)}
                style={[
                  styles.reflectionButton,
                  isActive && styles.reflectionButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${title} ${option.emoji}`}
              >
                <Text style={styles.reflectionEmoji}>{option.emoji}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.reflectionMessage}>
          {selectedOption?.message ?? placeholder}
        </Text>
      </View>
    );
  };

  const prideLabel = `Je me sens efficace à ${prideValue}% aujourd’hui.`;
  const reflectionSummary = useMemo(
    () =>
      [
        selectedFreedom?.message ?? null,
        selectedSupport?.message ?? null,
        selectedEnergy?.message ?? null,
        prideLabel,
      ].filter(Boolean) as string[],
    [prideLabel, selectedEnergy?.message, selectedFreedom?.message, selectedSupport?.message]
  );

  const canOpenConfig = useMemo(
    () => Boolean(freedomChoice && supportChoice && energyChoice),
    [energyChoice, freedomChoice, supportChoice]
  );

  const syncVisibility = useCallback(
    (updater: (prev: VisibilitySettings) => VisibilitySettings) => {
      setVisibility((prev) => {
        const next = updater(prev);
        if (next.shareMoodWithAll) {
          return {
            ...next,
            showReasonToPeers: "visible",
            showReasonToManagers: "visible",
            showReasonToHr: "visible",
          };
        }
        return {
          ...next,
          showReasonToHr: next.showReasonToManagers,
        };
      });
    },
    []
  );

  const handleVisibilityChange = useCallback(
    (next: VisibilitySettings) => {
      syncVisibility(() => next);
      if (next.shareMoodWithAll && isAnonymous) {
        setIsAnonymous(false);
      }
    },
    [isAnonymous, syncVisibility]
  );

  const handleAnonymousChange = useCallback(
    (next: boolean) => {
      setIsAnonymous(next);
      if (next) {
        syncVisibility((prev) => ({
          ...prev,
          showReasonToPeers: "anonymized",
          showReasonToManagers: "anonymized",
        }));
      } else {
        syncVisibility((prev) => ({
          ...prev,
          showReasonToPeers: prev.showReasonToPeers === "anonymized" ? "visible" : prev.showReasonToPeers,
          showReasonToManagers: prev.showReasonToManagers === "anonymized" ? "visible" : prev.showReasonToManagers,
        }));
      }
    },
    [syncVisibility]
  );

  useEffect(() => {
    let mounted = true;
    fetchMyTodayMoodEntry()
      .then((entry) => {
        if (!mounted || !entry) return;
        setEditingId(entry.id);
        setMoodValue(entry.moodValue);
        setContext(entry.context);
        setIsAnonymous(entry.isAnonymous);
        setNote(entry.note || "");
        setFreedomChoice(entry.freedomChoice ?? null);
        setSupportChoice(entry.supportChoice ?? null);
        setEnergyChoice(entry.energyChoice ?? null);
        setPrideValue(
          typeof entry.pridePercent === "number" ? entry.pridePercent : 70
        );
        syncVisibility(() => entry.visibility);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [syncVisibility]);

  const handleSubmit = useCallback(async () => {
    if (!user?.id) {
      toast.show("Oups", {
        description: "Connecte-toi pour partager ton humeur.",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      const reflectionLines = [
        selectedFreedom?.message ?? null,
        selectedSupport?.message ?? null,
        selectedEnergy?.message ?? null,
        prideValue !== null
          ? `Je me sens efficace à ${prideValue}% aujourd’hui.`
          : null,
      ].filter(Boolean) as string[];

      const summaryFallback =
        selectedFreedom?.message ??
        selectedSupport?.message ??
        selectedEnergy?.message ??
        moodOption?.description ??
        null;

      const summaryForSubmit =
        reflectionLines.length > 0
          ? reflectionLines.join(" • ")
          : summaryFallback;

      const composedNote = note.trim() ? note.trim() : null;

      const normalizedVisibility: VisibilitySettings = {
        ...visibility,
        showReasonToHr: visibility.showReasonToManagers,
      };

      if (editingId) {
        await updateMoodEntry(editingId, {
          moodValue,
          context,
          isAnonymous,
          reasonSummary: summaryForSubmit,
          note: composedNote || null,
          loggedAt: new Date().toISOString(),
          visibility: normalizedVisibility,
          freedomChoice,
          supportChoice,
          energyChoice,
          pridePercent: prideValue,
        });
      } else {
        await createMoodEntry({
          moodValue,
          context,
          isAnonymous,
          reasonSummary: summaryForSubmit,
          note: composedNote || null,
          loggedAt: new Date().toISOString(),
          visibility: normalizedVisibility,
          userId: user.id,
          freedomChoice,
          supportChoice,
          energyChoice,
          pridePercent: prideValue,
        });
      }

      toast.show(editingId ? "Humeur mise à jour" : "Humeur enregistrée", {
        description: editingId
          ? "Tes informations du jour ont été mises à jour."
          : "Ton humeur a été prise en compte pour aujourd’hui.",
      });

      setNote("");
      setIsAnonymous(false);
      setMoodValue(4);
      syncVisibility(() => DEFAULT_VISIBILITY);
      setFreedomChoice(null);
      setSupportChoice(null);
      setEnergyChoice(null);
      setPrideValue(70);

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
      setConfigOpen(false);
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
    moodOption?.description,
    moodValue,
    note,
    prideValue,
    freedomChoice,
    supportChoice,
    energyChoice,
    router,
    selectedEnergy,
    selectedFreedom,
    selectedSupport,
    visibility,
    toast,
    syncVisibility,
    user?.id,
  ]);

  const handleOpenConfig = useCallback(() => {
    if (!canOpenConfig) {
      toast.show("Complète tes ressentis", {
        description: "Sélectionne une option dans chaque carte avant de continuer.",
      });
      return;
    }
    setConfigOpen(true);
  }, [canOpenConfig, toast]);

  const closeConfig = useCallback(() => {
    if (!isSubmitting) {
      setConfigOpen(false);
    }
  }, [isSubmitting]);

  if (isConfigOpen) {
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
                onPress={closeConfig}
                style={styles.backButton}
                accessibilityRole="button"
              >
                <Text style={styles.backLabel}>←</Text>
              </Pressable>
            </View>

            <View style={styles.headerBlock}>
              <Text style={styles.title}>Configurer la publication</Text>
              <Text style={styles.subtitle}>
                Ajuste qui peut voir ton humeur aujourd’hui.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ton récapitulatif</Text>
              <Text style={styles.summaryMoodLine}>
                {moodOption?.emoji ?? "🙂"}{" "}
                {moodOption?.title ?? "Mood non renseigné"}
              </Text>
              <Text style={styles.summaryMoodSubtitle}>
                Contexte : {CONTEXT_LABEL[context]}
              </Text>
              {reflectionSummary.length ? (
                <View style={styles.summaryPills}>
                  {reflectionSummary.map((line, index) => (
                    <View key={index} style={styles.summaryPill}>
                      <Text style={styles.summaryPillText}>{line}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.cardHint}>
                  Ajoute des ressentis sur l’écran précédent pour enrichir ton
                  mood.
                </Text>
              )}
            </View>

            <View style={styles.card}>
              <VisibilityForm
                value={visibility}
                onChange={handleVisibilityChange}
                showHrSection={false}
                variant="plain"
                showAnonymityToggle
                isAnonymous={isAnonymous}
                onAnonymousChange={handleAnonymousChange}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.bottomBar}>
          <Button
            theme="accent"
            size="$5"
            disabled={isSubmitting}
            onPress={() => {
              if (!isSubmitting) {
                void handleSubmit();
              }
            }}
          >
            {isSubmitting
              ? "Enregistrement..."
              : editingId
              ? "Mettre à jour et publier"
              : "Publier mon mood"}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

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

          <View style={styles.headerBlock}>
            <Text style={styles.title}>Publie ton humeur</Text>
            <Text style={styles.subtitle}>
              Choisis ton emoji et capture ce que tu ressens aujourd’hui.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Comment te sens-tu ?</Text>
            <MoodScale value={moodValue} onChange={setMoodValue} />
            <Text style={styles.cardHint}>
              Ton emoji reste visible pour toute l’équipe.
            </Text>
          </View>

          <View style={styles.card}>
            <MoodContextToggle value={context} onChange={setContext} />
          </View>

          {renderReflectionCard(
            "Liberté d’action",
            FREEDOM_OPTIONS,
            freedomChoice,
            setFreedomChoice,
            "Choisis comment tu te sens par rapport à ta liberté d’action aujourd’hui."
          )}

          {renderReflectionCard(
            "Soutien ressenti",
            SUPPORT_OPTIONS,
            supportChoice,
            setSupportChoice,
            "Comment ressens-tu le soutien de ton équipe ?"
          )}

          {renderReflectionCard(
            "Énergie du jour",
            ENERGY_OPTIONS,
            energyChoice,
            setEnergyChoice,
            "Quel est ton niveau d’énergie aujourd’hui ?"
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fierté du jour</Text>
            <Text style={styles.cardHint}>
              Indique ton niveau d’efficacité ressentie.
            </Text>
            <Slider
              value={[prideValue]}
              min={0}
              max={100}
              step={5}
              onValueChange={(values) => setPrideValue(values[0] ?? 0)}
              style={styles.slider}
            >
              <Slider.Track unstyled style={styles.sliderTrack}>
                <Slider.TrackActive
                  unstyled
                  style={styles.sliderTrackActive}
                />
              </Slider.Track>
              <Slider.Thumb unstyled style={styles.sliderThumb} />
            </Slider>
            <Text style={styles.reflectionMessage}>{prideLabel}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes (optionnel)</Text>
            <Text style={styles.cardHint}>
              Ajoute un détail utile ou une anecdote à retenir.
            </Text>
            <Input
              value={note}
              onChangeText={setNote}
              placeholder="Partage un petit mot sur ta journée..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={styles.textArea}
            />
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <Button
          size="$5"
          theme="accent"
          onPress={handleOpenConfig}
          disabled={isSubmitting || !canOpenConfig}
        >
          Configurer mon mood
        </Button>
        {!canOpenConfig ? (
          <Text style={styles.bottomHint}>
            Sélectionne une option dans chaque carte avant de continuer.
          </Text>
        ) : null}
      </View>
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
    paddingBottom: 200,
    gap: 20,
  },
  navRow: {
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  backLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: Palette.textPrimary,
  },
  headerBlock: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: Palette.textSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.06)",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Palette.textPrimary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  cardHint: {
    fontSize: 13,
    color: Palette.textSecondary,
    lineHeight: 20,
  },
  slider: {
    marginTop: 12,
  },
  sliderTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E5E7F5",
  },
  sliderTrackActive: {
    backgroundColor: Palette.bleuMarin,
    borderRadius: 999,
  },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Palette.bleuMarin,
    borderWidth: 0,
    shadowOpacity: 0,
  },
  reflectionRow: {
    flexDirection: "row",
    gap: 12,
  },
  reflectionButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.08)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  reflectionButtonActive: {
    borderColor: Palette.bleuMarin,
    backgroundColor: "#EEF1FF",
  },
  reflectionEmoji: {
    fontSize: 28,
  },
  reflectionMessage: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 20,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
    gap: 8,
  },
  bottomSpacer: {
    height: 40,
  },
  bottomHint: {
    fontSize: 12,
    color: Palette.textSecondary,
    textAlign: "center",
  },
  textArea: {
    minHeight: 120,
  },
  configOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.35)",
    justifyContent: "flex-end",
  },
  configBackdrop: StyleSheet.absoluteFillObject,
  configSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: "90%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    marginBottom: 12,
  },
  configHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  configClose: {
    fontSize: 14,
    fontWeight: "600",
    color: Palette.bleuMarin,
  },
  configContent: {
    paddingBottom: 24,
    gap: 20,
  },
  configRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  configActions: {
    paddingTop: 12,
  },
  summaryMoodLine: {
    fontSize: 16,
    fontWeight: "600",
    color: Palette.textPrimary,
  },
  summaryMoodSubtitle: {
    fontSize: 13,
    color: Palette.textSecondary,
    marginTop: 4,
  },
  summaryPills: {
    flexDirection: "column",
    marginTop: 12,
    gap: 8,
  },
  summaryPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Palette.mauvePastel,
  },
  summaryPillText: {
    fontSize: 13,
    color: Palette.textPrimary,
    lineHeight: 18,
  },
});
