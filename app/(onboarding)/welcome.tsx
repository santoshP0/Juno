import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Ellipse, Circle, Text as SvgText } from 'react-native-svg';
import { Typography } from '../../components/ui/Typography';
import { useColors } from '../../hooks/useTheme';

const PHASE_COLORS = {
  menstrual: '#E8A598',
  follicular: '#98C4B0',
  ovulation: '#F5C37A',
  luteal: '#B8A5C8',
};

function PetalMotif() {
  const colors = useColors();
  return (
    <Svg width={160} height={160} viewBox="0 0 160 160">
      <Ellipse
        cx={80}
        cy={44}
        rx={22}
        ry={44}
        fill={PHASE_COLORS.menstrual}
        opacity={0.65}
        rotation={-90}
        originX={80}
        originY={80}
      />
      <Ellipse
        cx={80}
        cy={44}
        rx={22}
        ry={44}
        fill={PHASE_COLORS.follicular}
        opacity={0.65}
        rotation={0}
        originX={80}
        originY={80}
      />
      <Ellipse
        cx={80}
        cy={44}
        rx={22}
        ry={44}
        fill={PHASE_COLORS.ovulation}
        opacity={0.65}
        rotation={90}
        originX={80}
        originY={80}
      />
      <Ellipse
        cx={80}
        cy={44}
        rx={22}
        ry={44}
        fill={PHASE_COLORS.luteal}
        opacity={0.65}
        rotation={180}
        originX={80}
        originY={80}
      />
      <Circle cx={80} cy={80} r={22} fill={colors.surface} />
      <SvgText
        x={80}
        y={87}
        textAnchor="middle"
        fontSize={24}
        fontStyle="italic"
        fill={colors.accent}
      >
        J
      </SvgText>
    </Svg>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();

  const handleBegin = () => {
    router.push('/(onboarding)/info');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top spacer */}
      <View style={styles.spacer} />

      {/* Center content */}
      <View style={styles.centerContent}>
        <PetalMotif />
        <Typography
          style={[
            styles.title,
            { color: colors.text },
          ]}
        >
          Juno
        </Typography>
        <Typography
          style={[
            styles.tagline,
            { color: colors.textSecondary },
          ]}
        >
          Your cycle, on your terms. Private. Quiet. Yours.
        </Typography>
      </View>

      {/* Bottom CTA area */}
      <View style={[styles.ctaArea, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleBegin}
          style={[styles.primaryButton, { backgroundColor: colors.text }]}
          activeOpacity={0.85}
        >
          <Typography style={[styles.primaryButtonText, { color: colors.background }]}>
            Begin
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBegin}
          style={styles.ghostButton}
          activeOpacity={0.7}
        >
          <Typography style={[styles.ghostButtonText, { color: colors.textSecondary }]}>
            Restore from backup file
          </Typography>
        </TouchableOpacity>

        <Typography style={[styles.footerText, { color: colors.textTertiary }]}>
          No account. No sign-up. Your data lives on this phone.
        </Typography>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
  centerContent: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 44,
    letterSpacing: -1,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 24,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 260,
    marginTop: 8,
  },
  ctaArea: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 14.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  ghostButton: {
    padding: 14,
  },
  ghostButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10.5,
    textAlign: 'center',
  },
});
