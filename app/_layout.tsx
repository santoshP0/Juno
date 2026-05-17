import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import notifee, { EventType } from '@notifee/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

import { initializeDatabase } from '../lib/db/schema';
import { runMigrations } from '../lib/db/migrations';
import { setupNotificationChannels, NOTIF_ACTION } from '../lib/notifications';
import { handleNotifeeAction } from '../lib/notifications/handler';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme, useColors } from '../hooks/useTheme';
import { onAppBackground, checkShouldLock } from '../hooks/useAppLock';

SplashScreen.preventAutoHideAsync();

function AppGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const colors = useColors();
  const { pinEnabled, autoLockMinutes } = useSettingsStore();
  const db = useSQLiteContext();

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

  const navigateForAction = useCallback((actionId: string, data?: Record<string, any>) => {
    if (actionId === NOTIF_ACTION.PERIOD_STARTED) {
      const expectedStart = data?.expectedStart as string | undefined;
      if (expectedStart) {
        router.push(`/log/${expectedStart}`);
        return;
      }
    }
    // LOG_NOW, default tap, unknown → home
    router.push('/');
  }, [router]);

  useEffect(() => {
    // ── Foreground + background: handle silently, no app launch ───────────
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        const actionId = detail.pressAction?.id;
        if (!actionId) return;

        console.log('[Notif][FG] Foreground action press:', actionId);
        await handleNotifeeAction(db, actionId, detail.notification);

        // Only navigate for actions that explicitly open the app
        if (actionId === NOTIF_ACTION.LOG_NOW || actionId === NOTIF_ACTION.PERIOD_STARTED) {
          console.log('[Notif][FG] Navigating for action:', actionId);
          navigateForAction(actionId, detail.notification?.data as any);
        }
      } else if (type === EventType.PRESS) {
        // Bare notification body tapped → home
        console.log('[Notif][FG] Notification body tapped → home');
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [db, navigateForAction]);

  // ── Killed state: app launched by tapping an action with launchActivity ─
  // Must run only once on mount — getInitialNotification clears after first call,
  // subsequent calls return null, so separating from the foreground effect
  // prevents re-firing when navigateForAction ref changes after navigation.
  useEffect(() => {
    notifee.getInitialNotification().then((initial) => {
      if (!initial) {
        console.log('[Notif][INIT] No initial notification (normal launch).');
        return;
      }
      const actionId = initial.pressAction?.id;
      console.log('[Notif][INIT] App launched from notification. actionId:', actionId ?? '(body tap)');
      if (actionId) {
        navigateForAction(actionId, initial.notification.data as any);
      } else {
        // Plain tap on notification body
        router.push('/');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
