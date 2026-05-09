import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
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

const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: Colors.dustyRose,   // hot pink
  follicular: Colors.sage,       // lavender
  ovulation: Colors.success,     // mint/emerald
  luteal: Colors.gold,           // fuchsia
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
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progress = useSharedValue(0);
  const targetProgress = Math.min(currentDay / cycleLength, 1);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const phaseColor = PHASE_COLORS[phase];

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={phaseColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Center content */}
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        <Typography variant="caption" color={colors.textSecondary} align="center">
          Day
        </Typography>
        <Typography
          variant="h1"
          align="center"
          color={phaseColor}
          style={{ lineHeight: 48 }}
        >
          {currentDay}
        </Typography>
        <View style={[styles.phaseBadge, { backgroundColor: phaseColor + '22' }]}>
          <Typography
            variant="caption"
            color={phaseColor}
            align="center"
            style={{ fontWeight: '600' }}
          >
            {PHASE_LABELS[phase]}
          </Typography>
        </View>
        <Typography
          variant="caption"
          color={colors.textTertiary}
          align="center"
          style={{ marginTop: 4 }}
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
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
});
