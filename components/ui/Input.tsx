import React, { forwardRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Typography } from './Typography';
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';
import { Radius, Spacing, FontSize } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, leftIcon, rightIcon, style, ...props }, ref) => {
    const colors = useColors();

    return (
      <View style={containerStyle}>
        {label && (
          <Typography variant="label" style={styles.label} color={colors.textSecondary}>
            {label}
          </Typography>
        )}
        <View
          style={[
            styles.inputWrapper,
            {
              borderColor: error ? Colors.error : colors.border,
              backgroundColor: colors.surfaceSecondary,
            },
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              {
                color: colors.text,
                fontSize: FontSize.base,
                paddingLeft: leftIcon ? 0 : Spacing.md,
                paddingRight: rightIcon ? 0 : Spacing.md,
              },
              style,
            ]}
            {...props}
          />
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
        {error && (
          <Typography variant="caption" color={Colors.error} style={{ marginTop: 4 }}>
            {error}
          </Typography>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    height: 50,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  iconLeft: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
  },
  iconRight: {
    paddingRight: Spacing.md,
    paddingLeft: Spacing.sm,
  },
});
