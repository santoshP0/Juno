import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useTheme';
import { FontSize, FontWeight } from '../../constants/theme';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body2' | 'caption' | 'label';
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function Typography({
  variant = 'body',
  color,
  align = 'left',
  style,
  children,
  ...props
}: TypographyProps) {
  const colors = useColors();

  const variantStyles = {
    h1: { fontSize: FontSize['4xl'], fontWeight: FontWeight.bold as any, lineHeight: 44 },
    h2: { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold as any, lineHeight: 36 },
    h3: { fontSize: FontSize['2xl'], fontWeight: FontWeight.semibold as any, lineHeight: 30 },
    h4: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold as any, lineHeight: 26 },
    body: { fontSize: FontSize.base, fontWeight: FontWeight.regular as any, lineHeight: 22 },
    body2: { fontSize: FontSize.sm, fontWeight: FontWeight.regular as any, lineHeight: 20 },
    caption: { fontSize: FontSize.xs, fontWeight: FontWeight.regular as any, lineHeight: 16 },
    label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium as any, lineHeight: 18 },
  };

  return (
    <Text
      style={[
        variantStyles[variant],
        { color: color ?? colors.text, textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
