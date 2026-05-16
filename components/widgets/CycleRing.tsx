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
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';
import type { CyclePhase } from '../../types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CycleRingProps {
  currentDay: number;
  cycleLength: number;
  phase: CyclePhase;
  daysUntilPeriod: number;
  size?: number;
}

const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual:  'Menstrual',
  follicular: 'Follicular',
  ovulation:  'Ovulation',
  luteal:     'Luteal',
};

// Phase start as fraction of cycle (approx 28-day defaults)
const PHASE_START_FRACS: Record<CyclePhase, number> = {
  menstrual:  0,
  follicular: 5 / 28,
  ovulation:  13 / 28,
  luteal:     15 / 28,
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function CycleRing({
  currentDay,
  cycleLength,
  phase,
  daysUntilPeriod,
  size = 230,
}: CycleRingProps) {
  const colors = useColors();
  const SW = 14;            // stroke width of progress ring
  const radius = (size - SW * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const colorA = colors.accent;
  const colorB = colors.accentLight;
  const gradId = `grad-${phase}`;

  // Animate progress
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

  // Tip-dot position (animated to arc end)
  const tipAngle = targetProgress * 360;
  const tip = polarToCartesian(center, center, radius, tipAngle);

  // Phase marker dots on outer edge
  const markerRadius = radius + SW / 2 + 6;
  const phaseMarkers = (Object.entries(PHASE_START_FRACS) as [CyclePhase, number][]).map(
    ([p, frac]) => {
      const angle = frac * 360;
      const pos = polarToCartesian(center, center, markerRadius, angle);
      const isActive = p === phase;
      return { phase: p, ...pos, color: colorA, isActive };
    }
  );

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colorA} />
            <Stop offset="100%" stopColor={colorB} />
          </LinearGradient>
        </Defs>

        {/* Background track — very subtle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colorA}
          strokeWidth={SW}
          opacity={0.1}
        />

        {/* Outer accent ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius + SW / 2 + 3}
          fill="none"
          stroke={colorA}
          strokeWidth={1.5}
          opacity={0.2}
        />

        {/* Phase boundary markers */}
        {phaseMarkers.map(({ phase: p, x, y, color, isActive }) => (
          <Circle
            key={p}
            cx={x}
            cy={y}
            r={isActive ? 5 : 3.5}
            fill={color}
            opacity={isActive ? 1 : 0.45}
          />
        ))}

        {/* Wide glow layer — same arc, wider, low opacity */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colorA}
          strokeWidth={SW + 12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${center} ${center})`}
          opacity={0.12}
        />

        {/* Main progress arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${center} ${center})`}
        />

        {/* Tip: halo + colored dot + white center */}
        <Circle cx={tip.x} cy={tip.y} r={SW / 2 + 5} fill={colors.background} />
        <Circle cx={tip.x} cy={tip.y} r={SW / 2 + 2} fill={colorA} opacity={0.35} />
        <Circle cx={tip.x} cy={tip.y} r={SW / 2 - 1} fill={colorA} />
        <Circle cx={tip.x} cy={tip.y} r={4} fill={Colors.white} />
      </Svg>

      {/* Center content */}
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        <Typography
          variant="caption"
          color={colors.textTertiary}
          align="center"
          style={styles.dayLabel}
        >
          DAY
        </Typography>
        <Typography
          align="center"
          color={colorA}
          style={styles.dayNumber}
        >
          {currentDay}
        </Typography>
        <Typography
          variant="caption"
          color={colors.textTertiary}
          align="center"
          style={styles.ofLabel}
        >
          of {cycleLength}
        </Typography>
        <View style={[styles.phaseBadge, { backgroundColor: colorA + '22' }]}>
          <Typography
            variant="caption"
            color={colorA}
            align="center"
            style={styles.phaseLabel}
          >
            {PHASE_LABELS[phase]}
          </Typography>
        </View>
        <Typography
          variant="caption"
          color={colors.textTertiary}
          align="center"
          style={styles.periodLabel}
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
  dayLabel: {
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 58,
  },
  ofLabel: {
    fontSize: 11,
    marginTop: -2,
  },
  phaseBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  phaseLabel: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  periodLabel: {
    fontSize: 11,
    marginTop: 6,
  },
});
