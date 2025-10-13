import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import type { RoleType } from '@/types/mood';
import { useAuth } from '@/providers/auth-provider';

const ROLE_OPTIONS: { label: string; value: RoleType; description: string }[] = [
  { label: 'Employé', value: 'employee', description: 'Accès au feed, log et historique.' },
  { label: 'Manager', value: 'manager', description: 'Vue équipe et suivi 30 jours.' },
  { label: 'RH', value: 'hr', description: 'Accès global avec anonymisation.' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType>('employee');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!username.trim()) {
      setError('Choisis un prénom pour continuer.');
      return;
    }

    login({
      id: Date.now(),
      username: username.trim(),
      role: selectedRole,
    });

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.title}>Moodly</Text>
        <Text style={styles.subtitle}>
          Log ton humeur, partage le contexte et aide ton équipe à agir rapidement.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Ton prénom</Text>
        <TextInput
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            if (error) setError(null);
          }}
          placeholder="Camille"
          placeholderTextColor="#9BA1A6"
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={[styles.label, styles.roleLabel]}>Ton rôle</Text>
        <View style={styles.roleRow}>
          {ROLE_OPTIONS.map((role) => {
            const isActive = role.value === selectedRole;
            return (
              <Pressable
                key={role.value}
                style={[styles.roleButton, isActive && styles.roleButtonActive]}
                onPress={() => setSelectedRole(role.value)}>
                <Text style={[styles.roleTitle, isActive && styles.roleTitleActive]}>{role.label}</Text>
                <Text style={[styles.roleDescription, isActive && styles.roleDescriptionActive]}>
                  {role.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.submit} onPress={handleSubmit}>
          <Text style={styles.submitText}>Accéder à Moodly</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  intro: {
    gap: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 42,
    fontWeight: '700',
  },
  subtitle: {
    color: '#CBD5F5',
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 24,
    gap: 16,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  roleLabel: {
    marginTop: 4,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 16,
  },
  error: {
    color: Colors.light.tint,
    fontSize: 14,
  },
  roleRow: {
    gap: 12,
  },
  roleButton: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  roleButtonActive: {
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    backgroundColor: '#102542',
  },
  roleTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  roleTitleActive: {
    color: Colors.light.tint,
  },
  roleDescription: {
    color: '#94A3B8',
    fontSize: 14,
  },
  roleDescriptionActive: {
    color: '#E2E8F0',
  },
  submit: {
    marginTop: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
