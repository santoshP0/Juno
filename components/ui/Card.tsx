import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useTheme';
import { Shadow, Radius, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
}

export function Card({ children, style, padding = Spacing.md, shadow = 'sm' }: CardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          padding,
          borderColor: colors.border,
        },
        shadow !== 'none' && {
          ...Shadow[shadow],
          shadowColor: colors.accent,
          shadowOpacity: 0.12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
});
