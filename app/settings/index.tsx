import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, MessageCircle, Lightbulb, Check, Shield, Bell } from 'lucide-react-native';

const FEEDBACK_EMAIL = 'santosh929027@gmail.com';
import { useSQLiteContext } from 'expo-sqlite';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ThemePicker } from '../../components/ui/ThemePicker';
import { ConfirmModal } from '../../components/widgets/ConfirmModal';
import { useColors } from '../../hooks/useTheme';
import { useUserStore } from '../../stores/userStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCycleStore } from '../../stores/cycleStore';
import { upsertUser, deleteAllData } from '../../lib/db/queries';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';
import { APP_MODES } from '../../constants/content';
import type { AppMode, WeightUnit, HeightUnit, AccentThemeKey } from '../../types';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const db = useSQLiteContext();
  const { profile, updateProfile, clearProfile } = useUserStore();
  const { setMode, setWeightUnit, setAccentTheme, accentTheme, resetSettings } = useSettingsStore();
  const { reset: resetCycles } = useCycleStore();

  const [name, setName] = useState(profile?.name ?? '');
  const [cycleLen, setCycleLen] = useState(String(profile?.avgCycleLength ?? 28));
  const [periodLen, setPeriodLen] = useState(String(profile?.avgPeriodLength ?? 5));
  const [height, setHeight] = useState(profile?.height ? String(profile.height) : '');
  const [weight, setWeight] = useState(profile?.weight ? String(profile.weight) : '');
  const [heightUnit, setHeightUnitLocal] = useState<HeightUnit>(profile?.heightUnit ?? 'cm');
  const [weightUnit, setWeightUnitLocal] = useState<WeightUnit>(profile?.weightUnit ?? 'kg');
  const [mode, setModeLocal] = useState<AppMode>(profile?.mode ?? 'tracking');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const updates = {
      name: name.trim(),
      avgCycleLength: parseInt(cycleLen, 10) || 28,
      avgPeriodLength: parseInt(periodLen, 10) || 5,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      heightUnit,
      weightUnit,
      mode,
    };
    updateProfile(updates);
    setMode(mode);
    setWeightUnit(weightUnit);
    if (profile) await upsertUser(db, { ...profile, ...updates });
    setSaving(false);
    router.back();
  }, [name, cycleLen, periodLen, height, weight, heightUnit, weightUnit, mode, profile, db, updateProfile, setMode, setWeightUnit, router]);

  const handleDeleteAll = useCallback(async () => {
    await deleteAllData(db);
    resetCycles();
    resetSettings();
    clearProfile();
    router.replace('/(onboarding)/welcome');
  }, [db, resetCycles, resetSettings, clearProfile, router]);

  function UnitToggle<T extends string>({
    options,
    value,
    onChange,
  }: {
    options: { key: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
  }) {
    return (
      <View style={s.unitToggle}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[
              s.unitBtn,
              {
                backgroundColor: value === o.key ? colors.accent : colors.surfaceSecondary,
                borderColor: value === o.key ? colors.accent : colors.border,
              },
            ]}
          >
            <Typography
              variant="caption"
              color={value === o.key ? Colors.white : colors.textSecondary}
              style={{ fontWeight: '600' }}
            >
              {o.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h4" style={{ fontWeight: '700' }}>Settings</Typography>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* PERSONAL */}
        <View>
          <Typography style={s.sectionLabel} color={colors.textTertiary}>PERSONAL</Typography>
          <Card padding={16} style={[s.card, { borderColor: colors.border }]}>
            <Input
              label="Name"
              value={name}
              onChangeText={setName}
              containerStyle={{ marginBottom: 8 }}
            />
            <Input
              label="Average cycle length (days)"
              value={cycleLen}
              onChangeText={setCycleLen}
              keyboardType="numeric"
              containerStyle={{ marginBottom: 8 }}
            />
            <Input
              label="Average period length (days)"
              value={periodLen}
              onChangeText={setPeriodLen}
              keyboardType="numeric"
            />
          </Card>
        </View>

        {/* BODY MEASUREMENTS */}
        <View>
          <Typography style={s.sectionLabel} color={colors.textTertiary}>BODY MEASUREMENTS</Typography>
          <Card padding={16} style={[s.card, { borderColor: colors.border }]}>
            {/* Height row */}
            <View style={s.measureRow}>
              <Input
                label="Height"
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                placeholder={heightUnit === 'cm' ? 'e.g. 165' : 'e.g. 5.4'}
                containerStyle={{ flex: 1 }}
              />
              <View style={{ marginTop: 22 }}>
                <UnitToggle
                  options={[{ key: 'cm', label: 'cm' }, { key: 'in', label: 'in' }]}
                  value={heightUnit}
                  onChange={setHeightUnitLocal}
                />
              </View>
            </View>

            {/* Weight row */}
            <View style={[s.measureRow, { marginTop: 8 }]}>
              <Input
                label="Weight"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder={weightUnit === 'kg' ? 'e.g. 60' : 'e.g. 132'}
                containerStyle={{ flex: 1 }}
              />
              <View style={{ marginTop: 22 }}>
                <UnitToggle
                  options={[{ key: 'kg', label: 'kg' }, { key: 'lbs', label: 'lbs' }]}
                  value={weightUnit}
                  onChange={setWeightUnitLocal}
                />
              </View>
            </View>
          </Card>
        </View>

        {/* TRACKING MODE */}
        <View>
          <Typography style={s.sectionLabel} color={colors.textTertiary}>TRACKING MODE</Typography>
          <Card padding={16} style={[s.card, { borderColor: colors.border }]}>
            {APP_MODES.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setModeLocal(m.key as AppMode)}
                style={[
                  s.modeOption,
                  {
                    borderColor: mode === m.key ? colors.accent : colors.border,
                    backgroundColor: mode === m.key ? colors.accent + '11' : 'transparent',
                  },
                ]}
              >
                <View
                  style={[
                    s.modeDot,
                    { backgroundColor: mode === m.key ? colors.accent : colors.border },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Typography variant="label">{m.label}</Typography>
                  <Typography variant="caption" color={colors.textTertiary}>
                    {m.description}
                  </Typography>
                </View>
                {mode === m.key ? (
                  <Check size={16} color={colors.accent} />
                ) : (
                  <View
                    style={[
                      s.radio,
                      { borderColor: colors.border, backgroundColor: 'transparent' },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* APPEARANCE */}
        <View>
          <Typography style={s.sectionLabel} color={colors.textTertiary}>APPEARANCE</Typography>
          <Card padding={16} style={[s.card, { borderColor: colors.border }]}>
            <ThemePicker
              value={accentTheme ?? 'rose'}
              onChange={(key: AccentThemeKey) => setAccentTheme(key)}
            />
          </Card>
        </View>

        {/* FEEDBACK & SUPPORT */}
        <View>
          <Typography style={s.sectionLabel} color={colors.textTertiary}>FEEDBACK & SUPPORT</Typography>
          <Card padding={0} style={[s.card, { borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=Juno%20Feedback`)}
              style={[s.feedbackRow, { paddingHorizontal: 16 }]}
            >
              <MessageCircle size={18} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Typography variant="body2">Send feedback</Typography>
                <Typography variant="caption" color={colors.textTertiary}>Tell me what's working or not</Typography>
              </View>
              <ChevronRight size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={[s.feedbackDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=Feature%20Request%3A%20`)}
              style={[s.feedbackRow, { paddingHorizontal: 16 }]}
            >
              <Lightbulb size={18} color={Colors.gold} />
              <View style={{ flex: 1 }}>
                <Typography variant="body2">Request a feature</Typography>
                <Typography variant="caption" color={colors.textTertiary}>What would make Juno better for you?</Typography>
              </View>
              <ChevronRight size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* MORE */}
        <View>
          <Typography style={s.sectionLabel} color={colors.textTertiary}>MORE</Typography>
          <Card padding={0} style={[s.card, { borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => router.push('/settings/security')}
              style={[s.navRow, { paddingHorizontal: 16 }]}
            >
              <View style={[s.navIconBox, { backgroundColor: colors.accent + '22' }]}>
                <Shield size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="body2">Privacy & Security</Typography>
                <Typography variant="caption" color={colors.textTertiary}>App lock, biometrics, data</Typography>
              </View>
              <ChevronRight size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={[s.feedbackDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              onPress={() => router.push('/settings/notifications')}
              style={[s.navRow, { paddingHorizontal: 16 }]}
            >
              <View style={[s.navIconBox, { backgroundColor: '#B8A5C8' + '33' }]}>
                <Bell size={16} color='#B8A5C8' />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="body2">Notifications</Typography>
                <Typography variant="caption" color={colors.textTertiary}>Reminders and alerts</Typography>
              </View>
              <ChevronRight size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* ACTIONS */}
        <View>
          <Typography style={s.sectionLabel} color={colors.textTertiary}>ACTIONS</Typography>
          <Button label="Save changes" onPress={handleSave} loading={saving} fullWidth size="lg" />
        </View>

        {/* DANGER */}
        <View>
          <Typography style={s.sectionLabel} color={Colors.error}>DANGER</Typography>
          <Card padding={16} style={[s.card, { borderColor: Colors.error + '44', borderWidth: 1 }]}>
            <Typography variant="body2" color={colors.textSecondary} style={{ marginBottom: 12 }}>
              Permanently delete all your data from this device. This cannot be undone.
            </Typography>
            <Button
              label="Delete all data"
              onPress={() => setShowDeleteModal(true)}
              variant="danger"
              fullWidth
            />
          </Card>
        </View>

      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete all data?"
        message="This will permanently erase all your cycle logs, settings, and profile. This cannot be undone."
        confirmLabel="Delete everything"
        cancelLabel="Keep my data"
        destructive
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteModal(false)}
      />
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
    borderColor: 'transparent',
    borderWidth: 0.5,
  },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  unitToggle: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 12,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  feedbackDivider: { height: 1, marginVertical: 0 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  navIconBox: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
