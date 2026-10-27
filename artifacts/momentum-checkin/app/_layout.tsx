import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack } from 'expo-router';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';
import { HabitsProvider } from '@/context/HabitsContext';
import { ProgressSyncBridge } from '@/context/ProgressSyncBridge';
import palette from '@/constants/colors';

const queryClient = new QueryClient();
const publicDomain = process.env.EXPO_PUBLIC_DOMAIN;
if (publicDomain) setBaseUrl(`https://${publicDomain}`);
const clerkPublishableKey: string = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
if (!clerkPublishableKey) {
  throw new Error('Google 登入設定尚未載入，請檢查 App 的 Clerk 環境設定。');
}
const clerkProxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

function AuthTokenBridge() {
  const { getToken } = useAuth();
  setAuthTokenGetter(Platform.OS === 'web' ? null : () => getToken());
  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="mall-shop/[itemId]"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="habit-editor"
        options={{
          title: '',
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: palette.light.background },
          headerTintColor: palette.light.foreground,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          tokenCache={tokenCache}
          proxyUrl={clerkProxyUrl}
        >
          <ClerkLoaded>
            <QueryClientProvider client={queryClient}>
              <AuthTokenBridge />
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <HabitsProvider>
                    <ProgressSyncBridge>
                      <RootLayoutNav />
                    </ProgressSyncBridge>
                  </HabitsProvider>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </QueryClientProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
