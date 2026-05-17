import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useTheme';
import { FontSize, FontWeight } from '../../constants/theme';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body2' | 'caption' | 'label';
  color?: string;
  align?: 'left' | 'center' | 'right';
  serif?: boolean;
}

export function Typography({
  variant = 'body',
  color,
  align = 'left',
  style,
  serif,
  children,
  ...props
}: TypographyProps) {
  const colors = useColors();

  // h1, h2 use Instrument Serif by default; h3/h4 and below use system font
  const useSerif = serif ?? (variant === 'h1' || variant === 'h2');

  const variantStyles = {
    h1: {
      fontSize: FontSize['4xl'],
      fontWeight: FontWeight.bold as any,
      lineHeight: 44,
      fontFamily: 'InstrumentSerif_400Regular',
    },
    h2: {
      fontSize: FontSize['3xl'],
      fontWeight: '400' as any,
      lineHeight: 36,
      letterSpacing: -0.6,
      fontFamily: 'InstrumentSerif_400Regular',
    },
    h3: { fontSize: FontSize['2xl'], fontWeight: FontWeight.semibold as any, lineHeight: 30 },
    h4: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold as any, lineHeight: 26 },
    body: { fontSize: FontSize.base, fontWeight: FontWeight.regular as any, lineHeight: 22 },
    body2: { fontSize: FontSize.sm, fontWeight: FontWeight.regular as any, lineHeight: 20 },
    caption: { fontSize: FontSize.xs, fontWeight: FontWeight.regular as any, lineHeight: 16 },
    label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium as any, lineHeight: 18 },
  };

  const serifOverride = useSerif && variant !== 'h1' && variant !== 'h2'
    ? { fontFamily: 'InstrumentSerif_400Regular' }
    : {};

  return (
    <Text
      style={[
        variantStyles[variant],
        serifOverride,
        { color: color ?? colors.text, textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
