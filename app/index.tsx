/**
 * Root entry point — determines the correct initial screen and redirects
 * immediately. Runs while the splash screen is still visible so there is
 * no perceptible flash before landing on the target screen.
 */
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useSQLiteContext } from 'expo-sqlite';

import { useSettingsStore } from '../stores/settingsStore';
import { getUser } from '../lib/db/queries';
import { Colors } from '../constants/colors';
import { useColors } from '../hooks/useTheme';

type Target =
  | '/(onboarding)/welcome'
  | '/lock'
  | '/(tabs)/';

export default function Index() {
  const db = useSQLiteContext();
  const colors = useColors();
  const { onboardingComplete, pinEnabled } = useSettingsStore();
  const [hydrated, setHydrated] = useState(
    () => useSettingsStore.persist.hasHydrated()
  );
  const [target, setTarget] = useState<Target | null>(null);

  // Wait for Zustand AsyncStorage hydration before reading onboardingComplete.
  // Without this, onboardingComplete defaults to false on cold start and
  // incorrectly routes back to onboarding on every reopen.
  useEffect(() => {
    if (hydrated) return;
    const unsub = useSettingsStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const check = async () => {
      const dbUser = await getUser(db);
      if (cancelled) return;

      let dest: Target;
      if (!onboardingComplete || !dbUser) {
        dest = '/(onboarding)/welcome';
      } else if (pinEnabled) {
        dest = '/lock';
      } else {
        dest = '/(tabs)/';
      }

      await SplashScreen.hideAsync().catch(() => {});
      setTarget(dest);
    };
    check();
    return () => { cancelled = true; };
  }, [hydrated]);

  if (!target) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={target} />;
}
