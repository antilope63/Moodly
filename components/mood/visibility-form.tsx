import { useEffect, useMemo } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { Chip } from "@/components/ui/chip";
import { Palette } from "@/constants/theme";
import type { VisibilityLevel, VisibilitySettings } from "@/types/mood";

type VisibilityFormProps = {
  value: VisibilitySettings;
  onChange: (nextValue: VisibilitySettings) => void;
  showHrSection?: boolean;
  variant?: "default" | "plain";
  showAnonymityToggle?: boolean;
  isAnonymous?: boolean;
  onAnonymousChange?: (next: boolean) => void;
};

const PEER_LEVELS: VisibilityLevel[] = ["hidden", "visible"];
const MANAGER_LEVELS: VisibilityLevel[] = ["hidden", "anonymized", "visible"];

const levelLabel: Record<VisibilityLevel, string> = {
  hidden: "Caché",
  anonymized: "Anonymisé",
  visible: "Visible",
};

export const VisibilityForm = ({
  value,
  onChange,
  showHrSection = true,
  variant = "default",
  showAnonymityToggle = false,
  isAnonymous = false,
  onAnonymousChange,
}: VisibilityFormProps) => {
  useEffect(() => {
    if (value.allowCustomRecipients) {
      onChange({ ...value, allowCustomRecipients: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.allowCustomRecipients]);

  useEffect(() => {
    if (isAnonymous) return;
    if (
      value.showReasonToPeers !== "hidden" &&
      value.showReasonToPeers !== "visible"
    ) {
      onChange({ ...value, showReasonToPeers: "hidden" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.showReasonToPeers, isAnonymous]);

  const handleLevelChange = (
    field: "showReasonToPeers" | "showReasonToManagers" | "showReasonToHr",
    level: VisibilityLevel
  ) => {
    onChange({
      ...value,
      [field]: level,
    });
  };

  const showAudienceControls = !value.shareMoodWithAll;
  const managerLevels = useMemo(
    () =>
      isAnonymous
        ? (MANAGER_LEVELS.filter((level) => level !== "anonymized") as VisibilityLevel[])
        : MANAGER_LEVELS,
    [isAnonymous]
  );

  return (
    <View
      style={[styles.container, variant === "plain" && styles.containerPlain]}
    >
      <View style={styles.row}>
        <Text style={styles.title}>Partage global</Text>
        <Switch
          value={value.shareMoodWithAll}
          onValueChange={(shareMoodWithAll) => {
            onChange({ ...value, shareMoodWithAll });
            if (shareMoodWithAll && onAnonymousChange) {
              onAnonymousChange(false);
            }
          }}
        />
      </View>
      <Text style={styles.subtitle}>Contrôle la visibilité de ton mood.</Text>
      {value.shareMoodWithAll ? (
        <Text style={styles.warning}>
          Tes moods sont anonymisés pour tes collègues, même si tu actives le
          mode partage global. Cependant, ton manager verra qui l&apos;a publié.
        </Text>
      ) : null}

      {showAnonymityToggle ? (
        <>
          <View style={styles.row}>
            <Text style={styles.title}>Publier anonymement</Text>
            <Switch
              value={Boolean(isAnonymous)}
              onValueChange={(next) => {
                onAnonymousChange?.(next);
                if (next && value.shareMoodWithAll) {
                  onChange({ ...value, shareMoodWithAll: false });
                }
              }}
            />
          </View>
          <Text style={styles.helper}>
            Masque ton nom et ton email pour tous les lecteurs autorisés.
          </Text>
        </>
      ) : null}

      {showAudienceControls ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pour les collègues</Text>
            <View style={styles.levelRow}>
              {PEER_LEVELS.map((level) => (
              <Chip
                key={level}
                label={levelLabel[level]}
                selected={value.showReasonToPeers === level}
                  onPress={() => {
                    handleLevelChange("showReasonToPeers", level);
                  }}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pour ton manager</Text>
            <View style={styles.levelRow}>
              {managerLevels.map((level) => (
              <Chip
                key={level}
                label={levelLabel[level]}
                selected={value.showReasonToManagers === level}
                  onPress={() => {
                    handleLevelChange("showReasonToManagers", level);
                  }}
                />
              ))}
            </View>
          </View>
        </>
      ) : null}

      {showHrSection && showAudienceControls ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pour la RH</Text>
          <View style={styles.levelRow}>
            {MANAGER_LEVELS.map((level) => (
              <Chip
                key={level}
                label={levelLabel[level]}
                selected={value.showReasonToHr === level}
                onPress={() => handleLevelChange("showReasonToHr", level)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
    backgroundColor: Palette.mauvePastel,
    padding: 20,
    borderRadius: 24,
  },
  containerPlain: {
    backgroundColor: "transparent",
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  subtitle: {
    color: Palette.textSecondary,
    fontSize: 13,
  },
  helper: {
    color: Palette.textSecondary,
    fontSize: 12,
    marginTop: -8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.textPrimary,
  },
  warning: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: -4,
  },
  levelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
