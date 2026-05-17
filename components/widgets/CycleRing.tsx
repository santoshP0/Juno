import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
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

/** Returns strokeDasharray and strokeDashoffset to draw a partial arc */
function arcDash(circumference: number, startFrac: number, endFrac: number) {
  const spanFrac = endFrac - startFrac;
  const dashLength = circumference * spanFrac;
  const gapLength = circumference - dashLength;
  // offset so the arc starts at startFrac (SVG starts at 12 o'clock after rotate(-90))
  const offset = circumference * (1 - startFrac) - circumference;
  // simpler: dashoffset = circumference - (circumference * startFrac)
  // We rotate the SVG by -90 already on the progress arc; for phase arcs we apply transform too
  const dashOffset = circumference * (1 - startFrac);
  return { dashArray: `${dashLength} ${gapLength}`, dashOffset };
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

  // ── Phase arc segments ─────────────────────────────────────────────────
  // Define phase spans as fractions of a full cycle
  const phaseArcs: Array<{ phase: CyclePhase; startFrac: number; endFrac: number }> = [
    { phase: 'menstrual',  startFrac: 0 / 28,  endFrac: 5 / 28 },
    { phase: 'follicular', startFrac: 5 / 28,  endFrac: 13 / 28 },
    { phase: 'ovulation',  startFrac: 13 / 28, endFrac: 15 / 28 },
    { phase: 'luteal',     startFrac: 15 / 28, endFrac: 28 / 28 },
  ];

  // ── Tick marks ────────────────────────────────────────────────────────
  const showTicks = cycleLength >= 20 && cycleLength <= 35;
  const TICK_INNER = radius - 2;
  const TICK_OUTER = radius + 4;
  const ticks: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  if (showTicks) {
    for (let i = 0; i < cycleLength; i++) {
      const angleDeg = (i / cycleLength) * 360;
      const inner = polarToCartesian(center, center, TICK_INNER, angleDeg);
      const outer = polarToCartesian(center, center, TICK_OUTER, angleDeg);
      ticks.push({ x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y });
    }
  }

  // ── Center label logic ────────────────────────────────────────────────
  const isOverdue = daysUntilPeriod < 0;
  const isToday   = daysUntilPeriod === 0;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colorA} />
            <Stop offset="100%" stopColor={colorB} />
          </LinearGradient>
        </Defs>

        {/* Phase arc segments on background track (20% opacity) */}
        {phaseArcs.map(({ phase: p, startFrac, endFrac }) => {
          const { dashArray, dashOffset } = arcDash(circumference, startFrac, endFrac);
          return (
            <Circle
              key={p}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={Colors.phases[p]}
              strokeWidth={SW}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              opacity={0.22}
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
        })}

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

        {/* Tick marks at each cycle day */}
        {showTicks && ticks.map((t, i) => (
          <Line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={colors.border}
            strokeWidth={1}
            opacity={0.4}
          />
        ))}

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

      {/* Center content — redesigned */}
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        {/* Top label */}
        <Typography
          variant="caption"
          color={colors.textTertiary}
          align="center"
          style={styles.topLabel}
        >
          PERIOD IN
        </Typography>

        {/* Big countdown number or status text */}
        {isOverdue ? (
          <Typography
            align="center"
            color={Colors.error}
            style={styles.bigNumber}
          >
            {'!'}
          </Typography>
        ) : isToday ? (
          <Typography
            align="center"
            color={colorA}
            style={[styles.bigNumber, { fontSize: 40 }]}
          >
            Today
          </Typography>
        ) : (
          <Typography
            align="center"
            color={colorA}
            style={styles.bigNumber}
          >
            {daysUntilPeriod}
          </Typography>
        )}

        {/* Bottom caption */}
        <Typography
          variant="caption"
          color={colors.textTertiary}
          align="center"
          style={styles.bottomCaption}
        >
          {`Day ${currentDay} of ${cycleLength}`}
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
  topLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bigNumber: {
    fontSize: 56,
    fontWeight: '800',
    lineHeight: 64,
  },
  bottomCaption: {
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
