import * as Crypto from 'expo-crypto';

import { ANONYMIZATION_SECRET } from '@/constants/config';

type IdentityCacheKey = `id:${string}` | `email:${string}`;

const digestCache = new Map<IdentityCacheKey, string>();

const assertSecretAvailable = () => {
  if (!ANONYMIZATION_SECRET) {
    throw new Error(
      "La clé d'anonymisation est manquante. Définissez EXPO_PUBLIC_ANONYMIZATION_SECRET pour activer la publication anonyme.",
    );
  }
};

const hashWithSecret = async (value: string): Promise<string> => {
  assertSecretAvailable();
  const cacheKey = value.startsWith('id:') || value.startsWith('email:')
    ? (value as IdentityCacheKey)
    : (`id:${value}` as IdentityCacheKey);
  if (digestCache.has(cacheKey)) {
    return digestCache.get(cacheKey) as string;
  }
  const hashed = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${ANONYMIZATION_SECRET}:${value}`,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  digestCache.set(cacheKey, hashed);
  return hashed;
};

export const getAnonymizedAuthorToken = async (userId: string): Promise<string> => {
  if (!userId) {
    throw new Error("Impossible de créer un identifiant anonymisé sans utilisateur.");
  }
  return hashWithSecret(`id:${userId}`);
};

export const getAnonymizedEmailCipher = async (email?: string | null): Promise<string | null> => {
  if (!email) {
    return null;
  }
  return hashWithSecret(`email:${email.toLowerCase()}`);
};

export const ensureAnonymizationReady = () => {
  assertSecretAvailable();
};
