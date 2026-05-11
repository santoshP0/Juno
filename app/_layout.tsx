import React, { useEffect, useState } from 'react';
import { View, StyleSheet, AppState, AppStateStatus, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

import { initializeDatabase } from '../lib/db/schema';
import { runMigrations } from '../lib/db/migrations';
import { setupNotificationChannels } from '../lib/notifications';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme, useColors } from '../hooks/useTheme';
import { useAppLock, authenticateWithBiometric } from '../hooks/useAppLock';
import { Colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync();

function AppGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const colors = useColors();
  const { onboardingComplete, pinEnabled, biometricEnabled } = useSettingsStore();
  const { isLocked, unlock, checkAutoLock, resetTimer } = useAppLock();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
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
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    };
    init();
  }, []);

  // Re-check lock when app comes to foreground
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

  // Open home tab when user taps a notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)/');
    });
    return () => sub.remove();
  }, []);

  if (!appReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={Colors.dustyRose} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

async function initDB(db: import('expo-sqlite').SQLiteDatabase) {
  await initializeDatabase(db);
  await runMigrations(db);
  // Ensure Android notification channels exist after DB is ready
  await setupNotificationChannels();
}

export default function RootLayout() {
  const { isDark } = useTheme();
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
