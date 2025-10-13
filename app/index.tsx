import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  return status === 'authenticated' ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
