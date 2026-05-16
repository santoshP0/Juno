import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, MessageCircle, Lightbulb } from 'lucide-react-native';

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
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h4">Settings</Typography>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Personal */}
        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Personal info
          </Typography>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            containerStyle={{ marginBottom: 12 }}
          />
          <Input
            label="Average cycle length (days)"
            value={cycleLen}
            onChangeText={setCycleLen}
            keyboardType="numeric"
            containerStyle={{ marginBottom: 12 }}
          />
          <Input
            label="Average period length (days)"
            value={periodLen}
            onChangeText={setPeriodLen}
            keyboardType="numeric"
            containerStyle={{ marginBottom: 16 }}
          />

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
          <View style={[s.measureRow, { marginTop: 12 }]}>
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

        {/* Mode */}
        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Tracking mode
          </Typography>
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
              <View style={{ flex: 1 }}>
                <Typography variant="label">{m.label}</Typography>
                <Typography variant="caption" color={colors.textTertiary}>
                  {m.description}
                </Typography>
              </View>
              <View
                style={[
                  s.radio,
                  {
                    borderColor: mode === m.key ? colors.accent : colors.border,
                    backgroundColor: mode === m.key ? colors.accent : 'transparent',
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Appearance */}
        <Card padding={16}>
          <ThemePicker
            value={accentTheme ?? 'rose'}
            onChange={(key: AccentThemeKey) => setAccentTheme(key)}
          />
        </Card>

        {/* Feedback & support */}
        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Feedback & support
          </Typography>

          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=Juno%20Feedback`)}
            style={s.feedbackRow}
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
            style={s.feedbackRow}
          >
            <Lightbulb size={18} color={Colors.gold} />
            <View style={{ flex: 1 }}>
              <Typography variant="body2">Request a feature</Typography>
              <Typography variant="caption" color={colors.textTertiary}>What would make Juno better for you?</Typography>
            </View>
            <ChevronRight size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        <Button label="Save changes" onPress={handleSave} loading={saving} fullWidth size="lg" />

        {/* Danger zone */}
        <Card padding={16} style={{ borderColor: Colors.error + '44', borderWidth: 1 }}>
          <Typography variant="label" color={Colors.error} style={{ marginBottom: 8 }}>
            Danger zone
          </Typography>
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
    borderBottomWidth: 1,
  },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
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
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  feedbackDivider: { height: 1, marginVertical: 4 },
});
