import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

// Defines the root layout structure
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Basic Route Protection
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    
    if (!user && !inAuthGroup) {
      // Redirect to login
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect to home
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="requests/create" options={{ title: 'Request Help' }} />
        <Stack.Screen name="requests/[id]" options={{ title: 'Request Details' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </QueryProvider>
  );
}