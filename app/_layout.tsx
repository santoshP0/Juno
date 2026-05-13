import React, { useEffect } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
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
import { onAppBackground, checkShouldLock } from '../hooks/useAppLock';

SplashScreen.preventAutoHideAsync();

/**
 * AppGuard handles cross-cutting concerns:
 *   • Background/foreground auto-lock
 *   • Notification tap → home screen
 *
 * Routing logic lives in app/index.tsx (cleaner, no flash).
 */
function AppGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const colors = useColors();
  const { pinEnabled, autoLockMinutes } = useSettingsStore();

  // Auto-lock on foreground resume
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        if (checkShouldLock(autoLockMinutes, pinEnabled)) {
          router.replace('/lock');
        }
      } else if (state === 'background' || state === 'inactive') {
        onAppBackground();
      }
    });
    return () => sub.remove();
  }, [pinEnabled, autoLockMinutes]);

  // Notification tap → home tab
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)/');
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

async function initDB(db: import('expo-sqlite').SQLiteDatabase) {
  await initializeDatabase(db);
  await runMigrations(db);
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
              <Stack.Screen name="index" options={{ animation: 'none' }} />
              <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="lock" options={{ animation: 'fade' }} />
              <Stack.Screen name="log/[date]" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="article/[id]" />
              <Stack.Screen name="settings/index" />
              <Stack.Screen name="settings/notifications" />
              <Stack.Screen name="settings/security" />
              <Stack.Screen name="settings/backup" />
              <Stack.Screen name="settings/about" />
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
