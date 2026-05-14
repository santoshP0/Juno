import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinPad } from '../components/widgets/PinPad';
import { Typography } from '../components/ui/Typography';
import { useColors } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';
import {
  verifyPin,
  isBiometricAvailable,
  authenticateWithBiometric,
  onAppUnlock,
} from '../hooks/useAppLock';
import { Colors } from '../constants/colors';

export default function LockScreen() {
  const router = useRouter();
  const colors = useColors();
  const { biometricEnabled } = useSettingsStore();
  const [error, setError] = useState('');
  const [canBiometric, setCanBiometric] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setCanBiometric);
    if (biometricEnabled) {
      tryBiometric();
    }
  }, []);

  const tryBiometric = async () => {
    if (!biometricEnabled) return;
    const ok = await authenticateWithBiometric();
    if (ok) {
      onAppUnlock();
      router.replace('/(tabs)/');
    }
  };

  const handlePinComplete = async (pin: string) => {
    const ok = await verifyPin(pin);
    if (ok) {
      onAppUnlock();
      setError('');
      router.replace('/(tabs)/');
    } else {
      setError('Incorrect PIN. Try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.padWrap}>
          <PinPad
            onComplete={handlePinComplete}
            title="Enter PIN"
            subtitle="Unlock to access your data"
            error={error}
          />
        </View>

        {canBiometric && biometricEnabled && (
          <TouchableOpacity onPress={tryBiometric} style={styles.bioButton}>
            <Typography variant="label" color={Colors.dustyRose} align="center">
              Use biometric instead
            </Typography>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  padWrap: { width: '100%' },
  bioButton: { marginTop: 24, padding: 12 },
});
