import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, Palette } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { loginWithCredentials } from '@/services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Renseigne ton email et ton mot de passe.');
      return;
    }

    setIsLoading(true);

    try {
      const { user, token } = await loginWithCredentials(identifier.trim(), password);
      login(user, token);
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof Error ? err.message : null;
      if (message && message.toLowerCase().includes('identifier')) {
        setError('Identifiants ou mot de passe incorrects.');
      } else if (message) {
        setError(message);
      } else {
        setError('Impossible de te connecter pour le moment.');
      }
    } finally {
      setIsLoading(false);
    }
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
        <Text style={styles.label}>Email ou identifiant</Text>
        <TextInput
          value={identifier}
          onChangeText={(value) => {
            setIdentifier(value);
            if (error) setError(null);
          }}
          placeholder="camille@moodly.co"
          placeholderTextColor="#9BA1A6"
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          style={styles.input}
        />
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (error) setError(null);
          }}
          placeholder="••••••••"
          placeholderTextColor="#9BA1A6"
          secureTextEntry
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.submit, isLoading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Accéder à Moodly</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.mauvePastel,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  intro: {
    gap: 12,
  },
  title: {
    color: Palette.textPrimary,
    fontSize: 42,
    fontWeight: '700',
  },
  subtitle: {
    color: Palette.textSecondary,
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    gap: 16,
    shadowColor: Palette.bleuPastel,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  label: {
    color: Palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Palette.bleuClairPastel,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Palette.textPrimary,
    fontSize: 16,
  },
  error: {
    color: Colors.light.tint,
    fontSize: 14,
  },
  submit: {
    marginTop: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
