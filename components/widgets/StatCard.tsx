import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';

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

  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? Colors.success : trend === 'down' ? Colors.error : colors.textTertiary;

  return (
    <Card style={styles.card} padding={14}>
      <Typography variant="caption" color={colors.textSecondary}>
        {label}
      </Typography>
      <View style={styles.valueRow}>
        <Typography variant="h3" color={accentColor} style={{ marginTop: 4 }}>
          {value}
        </Typography>
        {unit && (
          <Typography variant="body2" color={colors.textTertiary} style={styles.unit}>
            {unit}
          </Typography>
        )}
        {trend && (
          <Typography style={[styles.trend, { color: trendColor }]}>{trendSymbol}</Typography>
        )}
      </View>
      {subtitle && (
        <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  unit: {
    marginBottom: 3,
  },
  trend: {
    fontSize: 16,
    marginBottom: 2,
  },
});
