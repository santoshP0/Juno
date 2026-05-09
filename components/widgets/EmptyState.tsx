import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { useColors } from '../../hooks/useTheme';
import { Spacing } from '../../constants/theme';
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
      <Typography style={styles.emoji}>{emoji}</Typography>
      <Typography variant="h4" align="center" style={{ marginTop: Spacing.md }}>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          align="center"
          color={colors.textSecondary}
          style={{ marginTop: Spacing.sm, maxWidth: 280 }}
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
  emoji: {
    fontSize: 56,
  },
});
