import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider } from 'tamagui';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import 'react-native-reanimated';

import { AuthProvider } from '@/providers/auth-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import tamaguiConfig from '../tamagui.config';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider config={tamaguiConfig} disableInjectCSS>
      <ToastProvider swipeDirection="horizontal">
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
            <ToastViewport />
          </ThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </TamaguiProvider>
  );
}
