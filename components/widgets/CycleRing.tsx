import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Typography } from '../ui/Typography';
import { Colors } from '../../constants/colors';
import { useColors } from '../../hooks/useTheme';
import type { CyclePhase } from '../../types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CycleRingProps {
  currentDay: number;
  cycleLength: number;
  phase: CyclePhase;
  daysUntilPeriod: number;
  size?: number;
}

const PHASE_COLORS: Record<CyclePhase, [string, string]> = {
  menstrual:  ['#FF2D78', '#FF80AB'],
  follicular: ['#A78BFA', '#C4B5FD'],
  ovulation:  ['#34D399', '#6EE7B7'],
  luteal:     ['#F472B6', '#FBCFE8'],
};

const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
};

export function CycleRing({
  currentDay,
  cycleLength,
  phase,
  daysUntilPeriod,
  size = 220,
}: CycleRingProps) {
  const colors = useColors();
  const strokeWidth = 16;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progress = useSharedValue(0);
  const targetProgress = Math.min(currentDay / cycleLength, 1);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const [colorStart, colorEnd] = PHASE_COLORS[phase];
  const gradientId = `phase-gradient-${phase}`;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colorStart} />
            <Stop offset="100%" stopColor={colorEnd} />
          </LinearGradient>
        </Defs>

        {/* Track ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
        />

        {/* Glow ring (wide, low opacity) */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colorStart}
          strokeWidth={strokeWidth + 10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${center} ${center})`}
          opacity={0.15}
        />

        {/* Main progress ring */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Center content */}
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        <Typography variant="caption" color={colors.textTertiary} align="center">
          Day
        </Typography>
        <Typography
          variant="h1"
          align="center"
          color={colorStart}
          style={{ lineHeight: 52, fontWeight: '800' }}
        >
          {currentDay}
        </Typography>
        <View style={[styles.phaseBadge, { backgroundColor: colorStart + '20' }]}>
          <Typography
            variant="caption"
            color={colorStart}
            align="center"
            style={{ fontWeight: '700' }}
          >
            {PHASE_LABELS[phase]}
          </Typography>
        </View>
        <Typography
          variant="caption"
          color={colors.textTertiary}
          align="center"
          style={{ marginTop: 6 }}
        >
          {daysUntilPeriod > 0
            ? `Period in ${daysUntilPeriod}d`
            : daysUntilPeriod === 0
            ? 'Period today'
            : 'Period expected'}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },
});
