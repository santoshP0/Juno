import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/widgets/ConfirmModal';
import { useColors } from '../../hooks/useTheme';
import { useUserStore } from '../../stores/userStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCycleStore } from '../../stores/cycleStore';
import { upsertUser, deleteAllData } from '../../lib/db/queries';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';
import { APP_MODES } from '../../constants/content';
import type { AppMode, WeightUnit, TempUnit } from '../../types';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const db = useSQLiteContext();
  const { profile, updateProfile } = useUserStore();
  const { setMode, setWeightUnit, setTempUnit, resetSettings } = useSettingsStore();
  const { reset: resetCycles } = useCycleStore();

  const [name, setName] = useState(profile?.name ?? '');
  const [cycleLen, setCycleLen] = useState(String(profile?.avgCycleLength ?? 28));
  const [periodLen, setPeriodLen] = useState(String(profile?.avgPeriodLength ?? 5));
  const [mode, setModeLocal] = useState<AppMode>(profile?.mode ?? 'tracking');
  const [weightUnit, setWeightUnitLocal] = useState<WeightUnit>(profile?.weightUnit ?? 'kg');
  const [tempUnit, setTempUnitLocal] = useState<TempUnit>(profile?.tempUnit ?? 'celsius');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const updates = {
      name: name.trim(),
      avgCycleLength: parseInt(cycleLen, 10) || 28,
      avgPeriodLength: parseInt(periodLen, 10) || 5,
      mode,
      weightUnit,
      tempUnit,
    };
    updateProfile(updates);
    setMode(mode);
    setWeightUnit(weightUnit);
    setTempUnit(tempUnit);
    if (profile) await upsertUser(db, { ...profile, ...updates });
    setSaving(false);
    router.back();
  }, [name, cycleLen, periodLen, mode, weightUnit, tempUnit, profile, db, updateProfile, setMode, setWeightUnit, setTempUnit, router]);

  const handleDeleteAll = useCallback(async () => {
    await deleteAllData(db);
    resetCycles();
    resetSettings();
    router.replace('/(onboarding)/welcome');
  }, [db, resetCycles, resetSettings, router]);

  function ToggleRow<T extends string>({
    label,
    options,
    value,
    onChange,
  }: {
    label: string;
    options: { key: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
  }) {
    return (
      <View style={s.settingRow}>
        <Typography variant="body2" style={{ flex: 1 }}>{label}</Typography>
        <View style={s.toggleGroup}>
          {options.map((o) => (
            <TouchableOpacity
              key={o.key}
              onPress={() => onChange(o.key)}
              style={[
                s.toggleBtn,
                {
                  backgroundColor: value === o.key ? Colors.dustyRose : colors.surfaceSecondary,
                  borderColor: value === o.key ? Colors.dustyRose : colors.border,
                },
              ]}
            >
              <Typography
                variant="caption"
                color={value === o.key ? '#fff' : colors.textSecondary}
                style={{ fontWeight: '600' }}
              >
                {o.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
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
            label="Average cycle length"
            value={cycleLen}
            onChangeText={setCycleLen}
            keyboardType="numeric"
            containerStyle={{ marginBottom: 12 }}
          />
          <Input
            label="Average period length"
            value={periodLen}
            onChangeText={setPeriodLen}
            keyboardType="numeric"
          />
        </Card>

        {/* Units */}
        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Units
          </Typography>
          <ToggleRow
            label="Weight"
            options={[{ key: 'kg', label: 'kg' }, { key: 'lbs', label: 'lbs' }]}
            value={weightUnit}
            onChange={setWeightUnitLocal}
          />
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          <ToggleRow
            label="Temperature"
            options={[{ key: 'celsius', label: '°C' }, { key: 'fahrenheit', label: '°F' }]}
            value={tempUnit}
            onChange={setTempUnitLocal}
          />
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
                  borderColor: mode === m.key ? Colors.dustyRose : colors.border,
                  backgroundColor: mode === m.key ? Colors.dustyRose + '11' : 'transparent',
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
                    borderColor: mode === m.key ? Colors.dustyRose : colors.border,
                    backgroundColor: mode === m.key ? Colors.dustyRose : 'transparent',
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
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
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  toggleGroup: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
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
});
