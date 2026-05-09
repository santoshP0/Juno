import React, { useEffect, useState } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

import { initializeDatabase } from '../lib/db/schema';
import { runMigrations } from '../lib/db/migrations';
import { useSettingsStore } from '../stores/settingsStore';
import { useColors } from '../hooks/useTheme';
import { useAppLock, authenticateWithBiometric } from '../hooks/useAppLock';

SplashScreen.preventAutoHideAsync();

function AppGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const colors = useColors();
  const { onboardingComplete, pinEnabled, biometricEnabled } = useSettingsStore();
  const { isLocked, lock, unlock, checkAutoLock, resetTimer } = useAppLock();
  const [appReady, setAppReady] = useState(false);

  // Initialize: route to onboarding or check lock
  useEffect(() => {
    const init = async () => {
      if (!onboardingComplete) {
        router.replace('/(onboarding)/welcome');
      } else if (pinEnabled) {
        if (biometricEnabled) {
          const ok = await authenticateWithBiometric();
          if (ok) {
            unlock();
          } else {
            router.replace('/lock');
          }
        } else {
          router.replace('/lock');
        }
      }
      setAppReady(true);
      await SplashScreen.hideAsync();
    };
    init();
  }, []);

  // Auto-lock on app background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        checkAutoLock();
        if (isLocked) router.replace('/lock');
      } else if (state === 'background' || state === 'inactive') {
        resetTimer();
      }
    });
    return () => sub.remove();
  }, [isLocked, checkAutoLock, resetTimer]);

  // Notification tap handler
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)/');
    });
    return () => sub.remove();
  }, []);

  if (!appReady) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

async function initDB(db: import('expo-sqlite').SQLiteDatabase) {
  await initializeDatabase(db);
  await runMigrations(db);
}

export default function RootLayout() {
  const { isDark } = useColors() as { isDark: boolean };
  const colors = useColors();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName="juno.db" onInit={initDB}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AppGuard>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'ios_from_right',
              }}
            >
              <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="lock" options={{ animation: 'fade' }} />
              <Stack.Screen name="log/[date]" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="article/[id]" />
              <Stack.Screen name="settings" />
            </Stack>
          </AppGuard>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
