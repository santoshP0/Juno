import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { useColors } from '../../hooks/useTheme';
import { Spacing, Radius } from '../../constants/theme';
import { Colors } from '../../constants/colors';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  emoji = '🌸',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {/* Decorative rings */}
      <View style={[styles.outerRing, { borderColor: Colors.dustyRose + '15' }]}>
        <View style={[styles.innerRing, { borderColor: Colors.dustyRose + '25' }]}>
          <View style={[styles.emojiCircle, { backgroundColor: Colors.dustyRose + '18' }]}>
            <Typography style={styles.emoji}>{emoji}</Typography>
          </View>
        </View>
      </View>

      <Typography
        variant="h4"
        align="center"
        style={{ marginTop: Spacing.xl, fontWeight: '700' }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          align="center"
          color={colors.textSecondary}
          style={{ marginTop: Spacing.sm, maxWidth: 260, lineHeight: 22 }}
        >
          {description}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          style={{ marginTop: Spacing.xl }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 44,
  },
});
