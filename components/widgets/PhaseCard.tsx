import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { useColors } from '../../hooks/useTheme';
import { PHASE_INFO } from '../../constants/content';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';
import type { CyclePhase } from '../../types';

interface PhaseCardProps {
  phase: CyclePhase;
  compact?: boolean;
}

export function PhaseCard({ phase, compact = false }: PhaseCardProps) {
  const colors = useColors();
  const info = PHASE_INFO[phase];

  return (
    <Card style={[styles.card, { borderLeftColor: colors.accent, borderLeftWidth: 4 }]}>
      <Typography variant="label" color={colors.accent} style={{ marginBottom: 4 }}>
        {info.name}
      </Typography>
      <Typography variant="body2" color={colors.textSecondary}>
        {info.description}
      </Typography>

      {!compact && info.tips.length > 0 && (
        <View style={styles.tips}>
          {info.tips.map((tip, i) => (
            <View key={i} style={styles.tip}>
              <View style={[styles.tipDot, { backgroundColor: colors.accent }]} />
              <Typography variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                {tip}
              </Typography>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
  },
  tips: {
    marginTop: Spacing.md,
    gap: 8,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
    flexShrink: 0,
  },
});
