import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Typography } from './Typography';
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  icon,
}: ButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const sizeStyles: Record<Size, { paddingH: number; paddingV: number; fontSize: number; height: number }> = {
    sm: { paddingH: Spacing.md, paddingV: Spacing.sm - 2, fontSize: 13, height: 36 },
    md: { paddingH: Spacing.lg, paddingV: Spacing.sm + 2, fontSize: 15, height: 48 },
    lg: { paddingH: Spacing.xl, paddingV: Spacing.md, fontSize: 16, height: 56 },
  };

  const { paddingH, paddingV, fontSize, height } = sizeStyles[size];

  const getVariantStyles = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'primary':
        return { bg: colors.accent, text: Colors.white };
      case 'secondary':
        return { bg: Colors.sage, text: Colors.plum };
      case 'outline':
        return { bg: 'transparent', text: colors.text, border: colors.border };
      case 'ghost':
        return { bg: 'transparent', text: colors.accent };
      case 'danger':
        return { bg: Colors.error, text: Colors.white };
    }
  };

  const { bg, text, border } = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          backgroundColor: disabled ? colors.border : bg,
          borderWidth: border ? 1.5 : 0,
          borderColor: border,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          height,
          width: fullWidth ? '100%' : undefined,
          opacity: disabled ? 0.6 : 1,
        },
        variant === 'primary' && Shadow.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={text} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Typography
            variant="label"
            color={disabled ? colors.textSecondary : text}
            style={{ fontSize, fontWeight: '600' }}
          >
            {label}
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    marginRight: 2,
  },
});
