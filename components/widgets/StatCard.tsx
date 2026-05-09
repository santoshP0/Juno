import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  subtitle?: string;
}

export function StatCard({ label, value, unit, trend, color, subtitle }: StatCardProps) {
  const colors = useColors();
  const accentColor = color ?? Colors.dustyRose;

  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : null;
  const trendColor = trend === 'up' ? Colors.success : trend === 'down' ? Colors.error : colors.textTertiary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderTopColor: accentColor,
        },
        Shadow.sm,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
        {label}
      </Typography>
      <View style={styles.valueRow}>
        <Typography
          variant="h3"
          color={accentColor}
          style={{ marginTop: 6, fontWeight: '800' }}
        >
          {value}
        </Typography>
        {unit && (
          <Typography
            variant="body2"
            color={colors.textTertiary}
            style={styles.unit}
          >
            {unit}
          </Typography>
        )}
        {trendSymbol && (
          <Typography style={[styles.trend, { color: trendColor }]}>
            {trendSymbol}
          </Typography>
        )}
      </View>
      {subtitle && (
        <View style={[styles.subtitleBadge, { backgroundColor: accentColor + '18' }]}>
          <Typography
            variant="caption"
            color={accentColor}
            style={{ fontWeight: '600' }}
          >
            {subtitle}
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    flexWrap: 'wrap',
  },
  unit: {
    marginBottom: 3,
  },
  trend: {
    fontSize: 16,
    marginBottom: 2,
  },
  subtitleBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
});
