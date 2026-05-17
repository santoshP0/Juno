import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Lock, Fingerprint, Clock, ShieldCheck } from 'lucide-react-native';

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
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.backBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <ChevronLeft color={colors.text} size={18} />
        </TouchableOpacity>
        <Typography variant="h4" style={{ fontWeight: '700' }}>Privacy & Security</Typography>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* APP LOCK */}
        <View>
          <Typography style={s.sectionLabel} color={colors.textTertiary}>APP LOCK</Typography>
          <Card padding={0} style={[s.card, { borderColor: colors.border }]}>

            {/* PIN lock row */}
            <View style={s.row}>
              <View style={[s.iconBox, { backgroundColor: colors.accent + '22' }]}>
                <Lock size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="body2">PIN lock</Typography>
                <Typography variant="caption" color={colors.textTertiary}>Require a 4-digit PIN to open Juno</Typography>
              </View>
              <Switch
                value={pinEnabled}
                onValueChange={handleTogglePin}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={Colors.white}
              />
            </View>

            {/* Biometric row */}
            {pinEnabled && canBiometric && (
              <>
                <View style={[s.rowDivider, { backgroundColor: colors.border }]} />
                <View style={s.row}>
                  <View style={[s.iconBox, { backgroundColor: Colors.sage + '22' }]}>
                    <Fingerprint size={16} color={Colors.sage} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body2">Biometric unlock</Typography>
                    <Typography variant="caption" color={colors.textTertiary}>Use fingerprint or face</Typography>
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

            {/* Auto-lock row */}
            {pinEnabled && (
              <>
                <View style={[s.rowDivider, { backgroundColor: colors.border }]} />
                <View style={[s.row, { alignItems: 'flex-start' }]}>
                  <View style={[s.iconBox, { backgroundColor: colors.accent + '22', marginTop: 2 }]}>
                    <Clock size={16} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1, gap: 10 }}>
                    <View>
                      <Typography variant="body2">Auto-lock after</Typography>
                      <Typography variant="caption" color={colors.textTertiary}>Lock the app after inactivity</Typography>
                    </View>
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
                    <Button
                      label="Change PIN"
                      onPress={() => { setSettingPin(true); setPinStep('first'); }}
                      variant="outline"
                      fullWidth
                    />
                  </View>
                </View>
              </>
            )}

          </Card>
        </View>

        {/* PRIVACY */}
        <View>
          <Typography style={s.sectionLabel} color={colors.textTertiary}>PRIVACY</Typography>
          <Card padding={16} style={[s.card, { borderColor: colors.border }]}>
            <View style={s.privacyHeader}>
              <View style={[s.iconBox, { backgroundColor: Colors.success + '22' }]}>
                <ShieldCheck size={16} color={Colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="body2">Fully private by design</Typography>
              </View>
            </View>
            <Typography variant="body2" color={colors.textSecondary} style={{ marginTop: 12 }}>
              Juno stores all data locally on your device — no accounts, no analytics, no tracking. Your cycle data is sensitive and should be entirely under your control, always.
            </Typography>
          </Card>
        </View>

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
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: Spacing.md, gap: 24, paddingBottom: Spacing['3xl'] },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: { height: 0.5, marginHorizontal: 16 },
  iconBox: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  lockRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  lockBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
