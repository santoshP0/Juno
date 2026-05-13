import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { PinPad } from '../../components/widgets/PinPad';
import { useColors } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { savePin, isBiometricAvailable } from '../../hooks/useAppLock';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';

type Step = 'choose' | 'set' | 'confirm';

export default function PinScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setPinEnabled, setBiometricEnabled } = useSettingsStore();
  const [step, setStep] = useState<Step>('choose');
  const [firstPin, setFirstPin] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const skip = useCallback(() => {
    setPinEnabled(false);
    router.push('/(onboarding)/privacy');
  }, [setPinEnabled, router]);

  const handleFirstPin = useCallback((pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
  }, []);

  const handleConfirmPin = useCallback(
    async (pin: string) => {
      if (pin !== firstPin) {
        setConfirmError('PINs do not match. Try again.');
        setStep('set');
        return;
      }
      await savePin(pin);
      setPinEnabled(true);

      const bioAvail = await isBiometricAvailable();
      if (bioAvail) {
        setBiometricEnabled(true);
      }

      router.push('/(onboarding)/privacy');
    },
    [firstPin, setPinEnabled, setBiometricEnabled, router]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {step === 'choose' && (
          <>
            <View style={styles.iconContainer}>
              <Typography style={styles.emoji}>🔒</Typography>
            </View>
            <Typography variant="h2" align="center">Protect your data</Typography>
            <Typography
              variant="body2"
              align="center"
              color={colors.textSecondary}
              style={{ marginTop: Spacing.sm, marginBottom: Spacing['2xl'], paddingHorizontal: Spacing.lg }}
            >
              Set a 4-digit PIN so only you can access Juno. Biometrics will also be enabled if available.
            </Typography>
            <Button
              label="Set a PIN"
              onPress={() => setStep('set')}
              fullWidth
              size="lg"
            />
            <TouchableOpacity onPress={skip} style={styles.skip}>
              <Typography variant="label" color={colors.textTertiary}>
                Skip for now
              </Typography>
            </TouchableOpacity>
          </>
        )}

        {step === 'set' && (
          <PinPad
            onComplete={handleFirstPin}
            title="Set your PIN"
            subtitle="Choose a 4-digit PIN you'll remember"
            error={confirmError}
          />
        )}

        {step === 'confirm' && (
          <PinPad
            onComplete={handleConfirmPin}
            title="Confirm your PIN"
            subtitle="Enter the same PIN again"
          />
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
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emoji: { fontSize: 52, textAlign: 'center', lineHeight: 64 },
  skip: { marginTop: Spacing.xl, padding: 12 },
});
