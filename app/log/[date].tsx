import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import {
  ChevronLeft,
  Check,
  Trash2,
  Droplets,
  Thermometer,
  Weight,
  Droplet,
  Zap,
  Smile,
  Battery,
  Moon,
  Heart,
  Activity,
  FileText,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SymptomChip } from '../../components/widgets/SymptomChip';
import { MoodSelector } from '../../components/widgets/MoodSelector';
import { useColors } from '../../hooks/useTheme';
import { useCycle } from '../../hooks/useCycle';
import { useCycleStore } from '../../stores/cycleStore';
import { deleteLog as deleteLogDB } from '../../lib/db/queries';

import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';
import { SYMPTOMS, PHASE_INFO } from '../../constants/content';
import { formatDate } from '../../lib/utils/date';
import type {
  FlowLevel,
  Symptom,
  Mood,
  EnergyLevel,
  SexActivity,
  DischargeType,
  DailyLog,
} from '../../types';

// ─── Icon map for SectionHeader ──────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ComponentType<any>> = {
  Droplets,
  Zap,
  Smile,
  Battery,
  Moon,
  Heart,
  Droplet,
  Activity,
  FileText,
};

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ title, iconName, iconColor }: { title: string; iconName: string; iconColor: string }) {
  const colors = useColors();
  const IconComponent = SECTION_ICONS[iconName];
  return (
    <View style={s.sectionHeader}>
      <View
        style={[
          s.iconBox,
          { backgroundColor: iconColor + '22', borderRadius: 9 },
        ]}
      >
        {IconComponent && <IconComponent size={16} color={iconColor} />}
      </View>
      <Typography style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{title}</Typography>
    </View>
  );
}

function FlowSelector({
  value,
  onChange,
}: {
  value: FlowLevel | null;
  onChange: (v: FlowLevel) => void;
}) {
  const colors = useColors();
  const OPTIONS: { key: FlowLevel; label: string; color: string }[] = [
    { key: 'none', label: 'None', color: colors.border },
    { key: 'spotting', label: 'Spotting', color: colors.accentLight },
    { key: 'light', label: 'Light', color: colors.accent + 'AA' },
    { key: 'medium', label: 'Medium', color: colors.accent },
    { key: 'heavy', label: 'Heavy', color: colors.accentDark },
  ];
  return (
    <View style={s.flowRow}>
      {OPTIONS.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => { Haptics.selectionAsync(); onChange(o.key); }}
          style={[
            s.flowBtn,
            {
              backgroundColor: value === o.key ? o.color : colors.surfaceSecondary,
              borderColor: value === o.key ? o.color : colors.border,
            },
          ]}
        >
          <Droplets size={20} color={value === o.key ? Colors.white : o.color} />
          <Typography
            variant="caption"
            color={value === o.key ? Colors.white : colors.textSecondary}
            style={{ marginTop: 2, textAlign: 'center' }}
          >
            {o.label}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function EnergySelector({
  value,
  onChange,
}: {
  value: EnergyLevel | null;
  onChange: (v: EnergyLevel) => void;
}) {
  const colors = useColors();
  const OPTIONS: { key: EnergyLevel; label: string; emoji: string }[] = [
    { key: 'low', label: 'Low', emoji: '🪫' },
    { key: 'medium', label: 'Medium', emoji: '⚡' },
    { key: 'high', label: 'High', emoji: '🔋' },
  ];
  return (
    <View style={s.threeRow}>
      {OPTIONS.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => { Haptics.selectionAsync(); onChange(o.key); }}
          style={[
            s.threeBtn,
            {
              backgroundColor:
                value === o.key ? Colors.gold + '33' : colors.surfaceSecondary,
              borderColor: value === o.key ? Colors.gold : colors.border,
            },
          ]}
        >
          <Typography style={{ fontSize: 22 }}>{o.emoji}</Typography>
          <Typography
            variant="caption"
            color={value === o.key ? Colors.goldDark : colors.textSecondary}
          >
            {o.label}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SexSelector({
  value,
  onChange,
}: {
  value: SexActivity | null;
  onChange: (v: SexActivity) => void;
}) {
  const colors = useColors();
  const OPTIONS: { key: SexActivity; label: string; emoji: string }[] = [
    { key: 'none', label: 'None', emoji: '—' },
    { key: 'protected', label: 'Protected', emoji: '🛡️' },
    { key: 'unprotected', label: 'Unprotected', emoji: '💑' },
  ];
  return (
    <View style={s.threeRow}>
      {OPTIONS.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => { Haptics.selectionAsync(); onChange(o.key); }}
          style={[
            s.threeBtn,
            {
              backgroundColor:
                value === o.key ? Colors.sage + '33' : colors.surfaceSecondary,
              borderColor: value === o.key ? Colors.sage : colors.border,
            },
          ]}
        >
          <Typography style={{ fontSize: 22 }}>{o.emoji}</Typography>
          <Typography
            variant="caption"
            color={value === o.key ? Colors.sageDark : colors.textSecondary}
          >
            {o.label}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function DischargeSelector({
  value,
  onChange,
}: {
  value: DischargeType | null;
  onChange: (v: DischargeType) => void;
}) {
  const colors = useColors();
  const OPTIONS: { key: DischargeType; label: string }[] = [
    { key: 'none', label: 'None' },
    { key: 'dry', label: 'Dry' },
    { key: 'sticky', label: 'Sticky' },
    { key: 'creamy', label: 'Creamy' },
    { key: 'watery', label: 'Watery' },
    { key: 'egg_white', label: 'Egg-white' },
  ];
  return (
    <View style={s.chipRow}>
      {OPTIONS.map((o) => (
        <SymptomChip
          key={o.key}
          label={o.label}
          selected={value === o.key}
          onToggle={() => onChange(o.key)}
        />
      ))}
    </View>
  );
}

// ─── Number input helper ─────────────────────────────────────────────────────

function NumberInput({
  label,
  value,
  onChange,
  unit,
  placeholder,
  icon: Icon,
  min,
  max,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit?: string;
  placeholder?: string;
  icon?: typeof Thermometer;
  min?: number;
  max?: number;
}) {
  const colors = useColors();
  const isOutOfRange = value !== null && min !== undefined && max !== undefined &&
    (value < min || value > max);
  return (
    <View style={s.numRow}>
      {Icon && <Icon size={18} color={isOutOfRange ? Colors.error : colors.textTertiary} />}
      <View style={{ flex: 1 }}>
        <Typography variant="body2">{label}</Typography>
        {isOutOfRange && (
          <Typography variant="caption" color={Colors.error}>
            Valid range: {min}–{max} {unit}
          </Typography>
        )}
      </View>
      <View style={[s.numInput, {
        borderColor: isOutOfRange ? Colors.error : colors.border,
        backgroundColor: colors.surfaceSecondary,
      }]}>
        <TextInput
          value={value !== null ? String(value) : ''}
          onChangeText={(t) => onChange(t ? parseFloat(t) || null : null)}
          keyboardType="decimal-pad"
          placeholder={placeholder ?? '0'}
          placeholderTextColor={colors.textTertiary}
          style={{ color: colors.text, fontSize: 15, minWidth: 60, textAlign: 'right' }}
        />
        {unit && (
          <Typography variant="caption" color={colors.textTertiary} style={{ marginLeft: 4 }}>
            {unit}
          </Typography>
        )}
      </View>
    </View>
  );
}

// ─── Water counter ────────────────────────────────────────────────────────────

function WaterCounter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const colors = useColors();
  return (
    <View style={s.waterRow}>
      <Droplet size={18} color={Colors.info} />
      <Typography variant="body2" style={{ flex: 1 }}>Water intake</Typography>
      <TouchableOpacity onPress={() => onChange(Math.max(0, value - 1))} style={s.waterBtn}>
        <Typography variant="h4">−</Typography>
      </TouchableOpacity>
      <Typography variant="h4" style={{ minWidth: 32, textAlign: 'center' }}>{value}</Typography>
      <TouchableOpacity onPress={() => onChange(value + 1)} style={s.waterBtn}>
        <Typography variant="h4">+</Typography>
      </TouchableOpacity>
      <Typography variant="body2" color={colors.textTertiary}>glasses</Typography>
    </View>
  );
}

// ─── Pill selector ────────────────────────────────────────────────────────────

function PillSelector({ value, onChange }: { value: boolean | null; onChange: (v: boolean | null) => void }) {
  const colors = useColors();
  return (
    <View style={s.pillRow}>
      <Typography variant="body2" style={{ flex: 1 }}>Pill taken</Typography>
      <View style={s.pillButtons}>
        <TouchableOpacity
          onPress={() => onChange(true)}
          style={[s.pillBtn, { borderColor: value === true ? Colors.success : colors.border, backgroundColor: value === true ? Colors.success + '15' : 'transparent' }]}
        >
          <Typography variant="caption" color={value === true ? Colors.success : colors.textTertiary} style={{ fontWeight: value === true ? '700' : '400' }}>Yes</Typography>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChange(false)}
          style={[s.pillBtn, { borderColor: value === false ? Colors.error : colors.border, backgroundColor: value === false ? Colors.error + '15' : 'transparent' }]}
        >
          <Typography variant="caption" color={value === false ? Colors.error : colors.textTertiary} style={{ fontWeight: value === false ? '700' : '400' }}>No</Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

const sLabel = { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 };

export default function LogScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const colors = useColors();
  const db = useSQLiteContext();
  const { saveLog } = useCycle();
  const { getLogByDate, removeLog, prediction } = useCycleStore();

  const existing = useMemo(() => getLogByDate(date), [date, getLogByDate]);

  const phaseLabel = useMemo(() => {
    if (!prediction) return null;
    return PHASE_INFO[prediction.currentPhase]?.name ?? null;
  }, [prediction]);

  const [flow, setFlow] = useState<FlowLevel | null>(existing?.flow ?? null);
  const [symptoms, setSymptoms] = useState<Symptom[]>(existing?.symptoms ?? []);
  const [moods, setMoods] = useState<Mood[]>(existing?.moods ?? []);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(existing?.energyLevel ?? null);
  const [sleepHours, setSleepHours] = useState<number | null>(existing?.sleepHours ?? null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(existing?.sleepQuality ?? null);
  const [sex, setSex] = useState<SexActivity | null>(existing?.sex ?? null);
  const [discharge, setDischarge] = useState<DischargeType | null>(existing?.discharge ?? null);
  const [bbt, setBbt] = useState<number | null>(existing?.bbt ?? null);
  const [weight, setWeight] = useState<number | null>(existing?.weight ?? null);
  const [waterIntake, setWaterIntake] = useState<number>(existing?.waterIntake ?? 0);
  const [pillTaken, setPillTaken] = useState<boolean | null>(existing?.pillTaken ?? null);
  const [notes, setNotes] = useState<string>(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const toggleSymptom = useCallback((s: Symptom) => {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }, []);

  const toggleMood = useCallback((m: Mood) => {
    setMoods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (bbt !== null && (bbt < 35.0 || bbt > 42.0)) {
      Alert.alert('Invalid BBT', 'Basal body temperature must be between 35.0 and 42.0 °C.');
      return;
    }
    if (weight !== null && (weight < 20 || weight > 300)) {
      Alert.alert('Invalid weight', 'Weight must be between 20 and 300 kg.');
      return;
    }
    setSaving(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await saveLog({
        date,
        flow,
        symptoms,
        moods,
        energyLevel,
        sleepHours,
        sleepQuality: sleepQuality as DailyLog['sleepQuality'],
        sex,
        discharge,
        cervicalPosition: null,
        bbt,
        weight,
        waterIntake,
        pillTaken,
        notes: notes.trim() || null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }, [date, flow, symptoms, moods, energyLevel, sleepHours, sleepQuality, sex, discharge, bbt, weight, waterIntake, pillTaken, notes, saveLog, router]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete log',
      'Remove all logged data for this day?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteLogDB(db, date);
            removeLog(date);
            router.back();
          },
        },
      ]
    );
  }, [date, db, removeLog, router]);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.backBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <ChevronLeft color={colors.text} size={18} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Typography style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {formatDate(date, 'EEEE, MMM d')}
          </Typography>
          {phaseLabel && (
            <Typography style={{ fontSize: 12, color: colors.textTertiary }}>
              {phaseLabel}
            </Typography>
          )}
        </View>

        <View style={s.headerRight}>
          {existing && (
            <TouchableOpacity onPress={handleDelete} style={s.deleteBtn}>
              <Trash2 size={18} color={Colors.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[s.saveBtn, { backgroundColor: colors.text }]}
          >
            <Check size={18} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Flow */}
          <Typography style={sLabel} color={colors.textTertiary}>FLOW</Typography>
          <Card style={{ borderRadius: 20, marginBottom: 0 }} padding={16}>
            <SectionHeader title="Flow" iconName="Droplets" iconColor="#E8A598" />
            <FlowSelector value={flow} onChange={setFlow} />
          </Card>

          {/* Symptoms */}
          <Typography style={sLabel} color={colors.textTertiary}>SYMPTOMS</Typography>
          <Card style={{ borderRadius: 20, marginBottom: 0 }} padding={16}>
            <SectionHeader title="Symptoms" iconName="Zap" iconColor="#B8A5C8" />
            <View style={s.chipRow}>
              {SYMPTOMS.map((sym) => (
                <SymptomChip
                  key={sym.key}
                  label={sym.label}
                  selected={symptoms.includes(sym.key)}
                  onToggle={() => toggleSymptom(sym.key)}
                />
              ))}
            </View>
          </Card>

          {/* Mood */}
          <Typography style={sLabel} color={colors.textTertiary}>MOOD</Typography>
          <Card style={{ borderRadius: 20, marginBottom: 0 }} padding={16}>
            <SectionHeader title="Mood" iconName="Smile" iconColor="#F5C37A" />
            <MoodSelector selected={moods} onToggle={toggleMood} />
          </Card>

          {/* Energy */}
          <Typography style={sLabel} color={colors.textTertiary}>ENERGY</Typography>
          <Card style={{ borderRadius: 20, marginBottom: 0 }} padding={16}>
            <SectionHeader title="Energy level" iconName="Battery" iconColor="#98C4B0" />
            <EnergySelector value={energyLevel} onChange={setEnergyLevel} />
          </Card>

          {/* Sleep */}
          <Typography style={sLabel} color={colors.textTertiary}>SLEEP</Typography>
          <Card style={{ borderRadius: 20, marginBottom: 0 }} padding={16}>
            <SectionHeader title="Sleep" iconName="Moon" iconColor="#B8A5C8" />
            <NumberInput
              label="Hours slept"
              value={sleepHours}
              onChange={setSleepHours}
              unit="hrs"
              placeholder="7.5"
            />
            <View style={s.divider} />
            <View style={s.numRow}>
              <Typography variant="body2" style={{ flex: 1 }}>Sleep quality</Typography>
              <View style={s.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setSleepQuality(star)}
                    style={{ padding: 4 }}
                  >
                    <Typography style={{ fontSize: 24, opacity: (sleepQuality ?? 0) >= star ? 1 : 0.3 }}>
                      ⭐
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          {/* Sex */}
          <Typography style={sLabel} color={colors.textTertiary}>INTIMACY</Typography>
          <Card style={{ borderRadius: 20, marginBottom: 0 }} padding={16}>
            <SectionHeader title="Sexual activity" iconName="Heart" iconColor="#C2847A" />
            <SexSelector value={sex} onChange={setSex} />
          </Card>

          {/* Discharge */}
          <Typography style={sLabel} color={colors.textTertiary}>CERVICAL MUCUS</Typography>
          <Card style={{ borderRadius: 20, marginBottom: 0 }} padding={16}>
            <SectionHeader title="Cervical mucus" iconName="Droplet" iconColor="#98C4B0" />
            <DischargeSelector value={discharge} onChange={setDischarge} />
          </Card>

          {/* BBT & Weight */}
          <Typography style={sLabel} color={colors.textTertiary}>BODY METRICS</Typography>
          <Card style={{ borderRadius: 20, marginBottom: 0 }} padding={16}>
            <SectionHeader title="Body metrics" iconName="Activity" iconColor="#C2847A" />
            <NumberInput
              icon={Thermometer}
              label="Basal body temp"
              value={bbt}
              onChange={setBbt}
              unit="°C"
              placeholder="36.5"
              min={35.0}
              max={42.0}
            />
            <View style={s.divider} />
            <NumberInput
              icon={Weight}
              label="Weight"
              value={weight}
              onChange={setWeight}
              unit="kg"
              placeholder="60.0"
              min={20}
              max={300}
            />
            <View style={s.divider} />
            <WaterCounter value={waterIntake} onChange={setWaterIntake} />
            <View style={s.divider} />
            <PillSelector value={pillTaken} onChange={setPillTaken} />
          </Card>

          {/* Notes */}
          <Typography style={sLabel} color={colors.textTertiary}>NOTES</Typography>
          <Card style={{ borderRadius: 20, marginBottom: 0 }} padding={16}>
            <SectionHeader title="Notes" iconName="FileText" iconColor="#A89C95" />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="How are you feeling today? Any observations..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              style={[
                s.notesInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
            />
          </Card>

          <Button
            label="Save log"
            onPress={handleSave}
            loading={saving}
            fullWidth
            size="lg"
            style={{ marginHorizontal: 0 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  deleteBtn: { padding: 8 },
  saveBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: Spacing.md, gap: 12, paddingBottom: Spacing['3xl'] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconBox: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  flowRow: { flexDirection: 'row', gap: 8 },
  flowBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  threeRow: { flexDirection: 'row', gap: 10 },
  threeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 6,
  },
  numRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  numInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 90,
    justifyContent: 'flex-end',
  },
  starRow: { flexDirection: 'row' },
  waterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  waterBtn: { padding: 8 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  pillButtons: { flexDirection: 'row', gap: 8 },
  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  divider: { height: 1, backgroundColor: Colors.dividerLight, marginVertical: 8 },
  notesInput: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 15,
    minHeight: 100,
    marginTop: 4,
  },
});
