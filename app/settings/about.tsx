import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Github, Shield, Heart } from 'lucide-react-native';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';

const OPEN_SOURCE_LIBS = [
  { name: 'Expo SDK', license: 'MIT' },
  { name: 'expo-router', license: 'MIT' },
  { name: 'expo-sqlite', license: 'MIT' },
  { name: 'Zustand', license: 'MIT' },
  { name: 'react-native-reanimated', license: 'MIT' },
  { name: 'react-native-calendars', license: 'MIT' },
  { name: 'react-native-gifted-charts', license: 'MIT' },
  { name: 'date-fns', license: 'MIT' },
  { name: 'lucide-react-native', license: 'ISC' },
  { name: 'NativeWind', license: 'MIT' },
  { name: 'react-hook-form', license: 'MIT' },
  { name: 'Zod', license: 'MIT' },
];

export default function AboutScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h4">About Juno</Typography>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* App info */}
        <View style={s.hero}>
          <Typography style={{ fontSize: 60 }}>🌙</Typography>
          <Typography variant="h2" align="center">Juno</Typography>
          <Typography variant="body2" align="center" color={colors.textSecondary}>
            Period & Women's Health Tracker
          </Typography>
          <View style={[s.versionBadge, { backgroundColor: colors.surfaceSecondary }]}>
            <Typography variant="caption" color={colors.textTertiary}>
              Version 1.0.0
            </Typography>
          </View>
        </View>

        {/* Mission */}
        <Card padding={16}>
          <View style={s.row}>
            <Heart size={20} color={Colors.dustyRose} />
            <Typography variant="label">Our mission</Typography>
          </View>
          <Typography variant="body2" color={colors.textSecondary} style={{ marginTop: 10, lineHeight: 22 }}>
            Juno was built on the belief that your cycle data is deeply personal — and should remain entirely yours. We built an app that works 100% offline, with no accounts, no servers, and no tracking, so you can understand your body without sacrificing your privacy.
          </Typography>
        </Card>

        {/* Privacy */}
        <Card padding={16}>
          <View style={s.row}>
            <Shield size={20} color={Colors.sage} />
            <Typography variant="label">Privacy by design</Typography>
          </View>
          <View style={s.privacyPoints}>
            {[
              '❌ No user accounts or sign-up',
              '❌ No data transmitted over the internet',
              '❌ No analytics or usage tracking',
              '❌ No third-party SDKs that collect data',
              '✅ All data stored locally using SQLite',
              '✅ Optional PIN + biometric lock',
              '✅ Full data export under your control',
            ].map((point, i) => (
              <Typography key={i} variant="body2" color={colors.textSecondary} style={{ marginBottom: 4 }}>
                {point}
              </Typography>
            ))}
          </View>
        </Card>

        {/* Open source */}
        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Open source libraries
          </Typography>
          {OPEN_SOURCE_LIBS.map((lib) => (
            <View key={lib.name} style={s.libRow}>
              <Typography variant="body2" style={{ flex: 1 }}>{lib.name}</Typography>
              <Typography variant="caption" color={colors.textTertiary}>{lib.license}</Typography>
            </View>
          ))}
        </Card>

        <Typography
          variant="caption"
          align="center"
          color={colors.textTertiary}
          style={{ paddingVertical: Spacing.md }}
        >
          Made with 🌸 for women everywhere.{'\n'}Your data, your body, your rules.
        </Typography>
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
  hero: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 8 },
  versionBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  privacyPoints: { marginTop: 10 },
  libRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerLight,
  },
});
