import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Typography } from '../../components/ui/Typography';
import { PinPad } from '../../components/widgets/PinPad';
import { useColors } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { savePin, isBiometricAvailable } from '../../hooks/useAppLock';
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
      {/* OnbHeader */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surfaceSecondary }]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarTrack}>
          <View
            style={[styles.progressBarFill, { backgroundColor: colors.surfaceSecondary }]}
          />
          <View
            style={[
              styles.progressBarFillActive,
              { backgroundColor: colors.accent, width: `${(4 / 5) * 100}%` },
            ]}
          />
        </View>
        <Typography style={[styles.stepCounter, { color: colors.textSecondary }]}>
          4 of 5
        </Typography>
      </View>

      <View style={styles.content}>
        {step === 'choose' && (
          <>
            {/* Eyebrow + Title + Subtitle */}
            <Typography style={[styles.eyebrow, { color: colors.accent }]}>
              SECURITY
            </Typography>
            <Typography style={[styles.title, { color: colors.text }]}>
              Lock Juno with a passcode?
            </Typography>
            <Typography style={[styles.subtitle, { color: colors.textSecondary }]}>
              An extra layer between your cycle data and anyone else holding your phone.
            </Typography>

            <TouchableOpacity
              onPress={() => setStep('set')}
              activeOpacity={0.85}
              style={[styles.primaryButton, { backgroundColor: colors.text }]}
            >
              <Typography style={[styles.primaryButtonLabel, { color: colors.background }]}>
                Set a passcode
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity onPress={skip} style={styles.ghostButton} activeOpacity={0.7}>
              <Typography style={[styles.ghostButtonLabel, { color: colors.textSecondary }]}>
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

  // OnbHeader
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 3,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  progressBarFillActive: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
  },
  stepCounter: {
    fontSize: 10.5,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },

  primaryButton: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  primaryButtonLabel: {
    fontSize: 14.5,
    fontWeight: '600',
  },

  ghostButton: {
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  ghostButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
