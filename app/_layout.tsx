import React, { useEffect } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

import { initializeDatabase } from '../lib/db/schema';
import { runMigrations } from '../lib/db/migrations';
import { setupNotificationChannels, NOTIF_ACTION } from '../lib/notifications';
import { handleNotificationAction } from '../lib/notifications/handler';
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

  // Notification tap/action → handle logic & navigate
  const db = useSQLiteContext();
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionId = response.actionIdentifier;
      
      // 1. Handle background data logic (logging pill, water, etc.)
      if (actionId !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        await handleNotificationAction(db, response);
      }

      // 2. Handle navigation
      if (actionId === NOTIF_ACTION.PERIOD_STARTED) {
        const expectedStart = response.notification.request.content.data?.expectedStart;
        if (expectedStart) {
          router.push(`/log/${expectedStart}`);
          return;
        }
      }

      router.push('/(tabs)/');
    });
    return () => sub.remove();
  }, [db]);

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
                animation: 'slide_from_right',
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
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
