import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PinPad } from '../../components/widgets/PinPad';
import { useColors } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  savePin,
  deletePin,
  isBiometricAvailable,
} from '../../hooks/useAppLock';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';

export default function SecurityScreen() {
  const router = useRouter();
  const colors = useColors();
  const { pinEnabled, biometricEnabled, autoLockMinutes, setPinEnabled, setBiometricEnabled, setAutoLockMinutes } =
    useSettingsStore();

  const [canBiometric, setCanBiometric] = useState(false);
  const [settingPin, setSettingPin] = useState(false);
  const [firstPin, setFirstPin] = useState('');
  const [pinStep, setPinStep] = useState<'first' | 'confirm'>('first');
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    isBiometricAvailable().then(setCanBiometric);
  }, []);

  const handleTogglePin = useCallback(() => {
    if (pinEnabled) {
      Alert.alert('Remove PIN', 'Are you sure you want to disable app lock?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove PIN',
          style: 'destructive',
          onPress: async () => {
            await deletePin();
            setPinEnabled(false);
            setBiometricEnabled(false);
          },
        },
      ]);
    } else {
      setSettingPin(true);
    }
  }, [pinEnabled, setPinEnabled, setBiometricEnabled]);

  const handleFirstPin = useCallback((pin: string) => {
    setFirstPin(pin);
    setPinStep('confirm');
  }, []);

  const handleConfirmPin = useCallback(
    async (pin: string) => {
      if (pin !== firstPin) {
        setConfirmError('PINs do not match. Try again.');
        setPinStep('first');
        setFirstPin('');
        return;
      }
      await savePin(pin);
      setPinEnabled(true);
      setSettingPin(false);
      setPinStep('first');
      setFirstPin('');
    },
    [firstPin, setPinEnabled]
  );

  if (settingPin) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <PinPad
          onComplete={pinStep === 'first' ? handleFirstPin : handleConfirmPin}
          title={pinStep === 'first' ? 'Set new PIN' : 'Confirm PIN'}
          subtitle={pinStep === 'first' ? 'Choose a 4-digit PIN' : 'Enter your PIN again'}
          error={confirmError}
        />
        <Button label="Cancel" onPress={() => { setSettingPin(false); setPinStep('first'); }} variant="ghost" style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  const LOCK_OPTIONS = [1, 2, 5, 10, 30];

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h4">Security & Privacy</Typography>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            App lock
          </Typography>

          <View style={s.switchRow}>
            <View style={{ flex: 1 }}>
              <Typography variant="body">PIN lock</Typography>
              <Typography variant="caption" color={colors.textTertiary}>
                Require a 4-digit PIN to open Juno
              </Typography>
            </View>
            <Switch
              value={pinEnabled}
              onValueChange={handleTogglePin}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={Colors.white}
            />
          </View>

          {pinEnabled && canBiometric && (
            <>
              <View style={s.divider} />
              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Typography variant="body">Biometric unlock</Typography>
                  <Typography variant="caption" color={colors.textTertiary}>
                    Use fingerprint or face to unlock
                  </Typography>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                  trackColor={{ false: colors.border, true: Colors.sage }}
                  thumbColor={Colors.white}
                />
              </View>
            </>
          )}

          {pinEnabled && (
            <>
              <View style={s.divider} />
              <View>
                <Typography variant="body" style={{ marginBottom: 10 }}>
                  Auto-lock after
                </Typography>
                <View style={s.lockRow}>
                  {LOCK_OPTIONS.map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      onPress={() => setAutoLockMinutes(mins)}
                      style={[
                        s.lockBtn,
                        {
                          backgroundColor:
                            autoLockMinutes === mins
                              ? colors.accent
                              : colors.surfaceSecondary,
                          borderColor:
                            autoLockMinutes === mins ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Typography
                        variant="caption"
                        color={autoLockMinutes === mins ? Colors.white : colors.textSecondary}
                        style={{ fontWeight: '600' }}
                      >
                        {mins}m
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.divider} />
              <Button
                label="Change PIN"
                onPress={() => { setSettingPin(true); setPinStep('first'); }}
                variant="outline"
                fullWidth
              />
            </>
          )}
        </Card>

        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 8 }}>
            Privacy policy
          </Typography>
          <Typography variant="body2" color={colors.textSecondary}>
            Juno stores all data locally on your device. No data is ever transmitted to any server. No accounts, no analytics, no tracking.
          </Typography>
          <Typography variant="body2" color={colors.textSecondary} style={{ marginTop: 8 }}>
            Your cycle data is sensitive. We believe it should be entirely under your control — always.
          </Typography>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 16,
  },
  lockRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  lockBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  divider: { height: 1, backgroundColor: Colors.dividerDark, marginVertical: 8 },
});
