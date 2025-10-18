import { useMemo } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import type { VisibilityLevel, VisibilitySettings } from '@/types/mood';
import { Chip } from '@/components/ui/chip';
import { Palette } from '@/constants/theme';

type VisibilityFormProps = {
  value: VisibilitySettings;
  onChange: (nextValue: VisibilitySettings) => void;
  showHrSection?: boolean;
  variant?: 'default' | 'plain';
};

const LEVELS: VisibilityLevel[] = ['hidden', 'anonymized', 'visible'];

const levelLabel: Record<VisibilityLevel, string> = {
  hidden: 'Caché',
  anonymized: 'Anonymisé',
  visible: 'Visible',
};

export const VisibilityForm = ({ value, onChange, showHrSection = true, variant = 'default' }: VisibilityFormProps) => {
  const peerCaption = useMemo(() => {
    switch (value.showReasonToPeers) {
      case 'hidden':
        return 'Les collègues voient seulement ton emoji.';
      case 'anonymized':
        return 'Les collègues voient la raison sans ton nom.';
      case 'visible':
        return 'Les collègues voient ta raison et ton nom.';
      default:
        return '';
    }
  }, [value.showReasonToPeers]);

  const handleLevelChange = (field: 'showReasonToPeers' | 'showReasonToManagers' | 'showReasonToHr', level: VisibilityLevel) => {
    onChange({
      ...value,
      [field]: level,
    });
  };

  return (
    <View style={[styles.container, variant === 'plain' && styles.containerPlain]}>
      <View style={styles.row}>
        <Text style={styles.title}>Partage global</Text>
        <Switch
          value={value.shareMoodWithAll}
          onValueChange={(shareMoodWithAll) => onChange({ ...value, shareMoodWithAll })}
        />
      </View>
      <Text style={styles.subtitle}>Contrôle la visibilité de ta raison selon le public.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pour les collègues</Text>
        <View style={styles.levelRow}>
          {LEVELS.map((level) => (
            <Chip
              key={level}
              label={levelLabel[level]}
              selected={value.showReasonToPeers === level}
              onPress={() => handleLevelChange('showReasonToPeers', level)}
            />
          ))}
        </View>
        <Text style={styles.caption}>{peerCaption}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pour ton manager</Text>
        <View style={styles.levelRow}>
          {LEVELS.map((level) => (
            <Chip
              key={level}
              label={levelLabel[level]}
              selected={value.showReasonToManagers === level}
              onPress={() => handleLevelChange('showReasonToManagers', level)}
            />
          ))}
        </View>
      </View>

      {showHrSection ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pour la RH</Text>
          <View style={styles.levelRow}>
            {LEVELS.map((level) => (
              <Chip
                key={level}
                label={levelLabel[level]}
                selected={value.showReasonToHr === level}
                onPress={() => handleLevelChange('showReasonToHr', level)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.row}>
        <Text style={styles.title}>Inviter d’autres lecteurs</Text>
        <Switch
          value={value.allowCustomRecipients}
          onValueChange={(allowCustomRecipients) => onChange({ ...value, allowCustomRecipients })}
        />
      </View>
      <Text style={styles.caption}>
        Utilise cette option si tu veux cibler un manager transverse ou un buddy spécifique.
      </Text>
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
    backgroundColor: 'transparent',
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  subtitle: {
    color: Palette.textSecondary,
    fontSize: 13,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  caption: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
});
