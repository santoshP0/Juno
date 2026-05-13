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
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      // DB user row is the authoritative signal that onboarding was completed.
      // This handles stale AsyncStorage state (e.g., wipe DB without clearing
      // AsyncStorage, or emulator resets).
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
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={Colors.dustyRose} />
      </View>
    );
  }

  return <Redirect href={target} />;
}
