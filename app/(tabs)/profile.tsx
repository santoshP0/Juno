import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings,
  Bell,
  Shield,
  HardDrive,
  Info,
  ChevronRight,
  Sun,
  Moon,
  Smartphone,
} from 'lucide-react-native';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { useColors } from '../../hooks/useTheme';
import { useUserStore } from '../../stores/userStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';
import type { Theme } from '../../types';

interface MenuItemProps {
  icon: typeof Settings;
  iconColor?: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
}

function MenuItem({ icon: Icon, iconColor, label, subtitle, onPress, rightElement }: MenuItemProps) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.menuItem}>
      <View style={[styles.iconBox, { backgroundColor: (iconColor ?? colors.accent) + '22' }]}>
        <Icon size={18} color={iconColor ?? colors.accent} strokeWidth={2} />
      </View>
      <View style={styles.menuText}>
        <Typography variant="body">{label}</Typography>
        {subtitle && (
          <Typography variant="caption" color={colors.textTertiary}>
            {subtitle}
          </Typography>
        )}
      </View>
      {rightElement ?? <ChevronRight size={18} color={colors.textTertiary} />}
    </TouchableOpacity>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useSettingsStore();
  const colors = useColors();

  const OPTIONS: { key: Theme; Icon: typeof Sun; label: string }[] = [
    { key: 'light', Icon: Sun, label: 'Light' },
    { key: 'auto', Icon: Smartphone, label: 'Auto' },
    { key: 'dark', Icon: Moon, label: 'Dark' },
  ];

  return (
    <View style={styles.themeRow}>
      {OPTIONS.map((o) => {
        const selected = theme === o.key;
        return (
          <TouchableOpacity
            key={o.key}
            onPress={() => setTheme(o.key)}
            style={[
              styles.themeBtn,
              {
                backgroundColor: selected ? colors.accent : colors.surfaceSecondary,
                borderColor: selected ? colors.accent : colors.border,
              },
            ]}
          >
            <o.Icon size={16} color={selected ? Colors.white : colors.textSecondary} />
            <Typography
              variant="caption"
              color={selected ? Colors.white : colors.textSecondary}
              style={{ fontWeight: '600', marginTop: 2 }}
            >
              {o.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const profile = useUserStore((s) => s.profile);
  const { mode } = useSettingsStore();

  const modeLabel = useMemo(() => {
    const MAP: Record<string, string> = {
      tracking: 'Period Tracking',
      ttc: 'Trying to Conceive',
      pregnancy: 'Pregnancy',
      birth_control: 'Birth Control',
      perimenopause: 'Perimenopause',
    };
    return MAP[mode] ?? mode;
  }, [mode]);

  const navigate = useCallback(
    (path: string) => () => router.push(path as any),
    [router]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile hero */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: colors.accent + '33' }]}>
            <Typography style={{ fontSize: 40 }}>🌙</Typography>
          </View>
          <Typography variant="h3">{profile?.name || 'Your profile'}</Typography>
          <View style={[styles.modeBadge, { backgroundColor: Colors.sage + '33' }]}>
            <Typography variant="caption" color={Colors.sageDark} style={{ fontWeight: '600' }}>
              {modeLabel}
            </Typography>
          </View>
        </View>

        {/* Theme */}
        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Appearance
          </Typography>
          <ThemeToggle />
        </Card>

        {/* Settings menu */}
        <Card padding={0} style={styles.menuCard}>
          <MenuItem
            icon={Settings}
            label="Account & cycle"
            subtitle="Name, cycle defaults, mode"
            onPress={navigate('/settings/')}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <MenuItem
            icon={Bell}
            iconColor={Colors.gold}
            label="Notifications"
            subtitle="Period reminders, ovulation alerts"
            onPress={navigate('/settings/notifications')}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <MenuItem
            icon={Shield}
            iconColor={Colors.sage}
            label="Security & privacy"
            subtitle="PIN, biometric, app lock"
            onPress={navigate('/settings/security')}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <MenuItem
            icon={HardDrive}
            iconColor={Colors.teal}
            label="Backup & restore"
            subtitle="Export or import your data"
            onPress={navigate('/settings/backup')}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <MenuItem
            icon={Info}
            iconColor={colors.textSecondary}
            label="About Juno"
            onPress={navigate('/settings/about')}
          />
        </Card>

        {/* Stats summary */}
        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Your cycle summary
          </Typography>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Typography variant="h3" color={colors.accent}>
                {profile?.avgCycleLength ?? 28}
              </Typography>
              <Typography variant="caption" color={colors.textTertiary}>
                Avg cycle (days)
              </Typography>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Typography variant="h3" color={Colors.sage}>
                {profile?.avgPeriodLength ?? 5}
              </Typography>
              <Typography variant="caption" color={colors.textTertiary}>
                Avg period (days)
              </Typography>
            </View>
          </View>
        </Card>

        <Typography
          variant="caption"
          align="center"
          color={colors.textTertiary}
          style={{ marginTop: Spacing.sm }}
        >
          Juno v1.0.0 · All data stored privately on your device
        </Typography>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing['2xl'] },
  hero: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  menuCard: { borderRadius: Radius.xl, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1 },
  separator: { height: 1, marginLeft: 66 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1, gap: 4 },
  statDivider: { width: 1, height: 40 },
});
