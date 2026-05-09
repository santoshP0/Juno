import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Typography } from '../ui/Typography';
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/theme';

interface SymptomChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  style?: ViewStyle;
}

export function SymptomChip({ label, selected, onToggle, style }: SymptomChipProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.selectionAsync();
    onToggle();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? Colors.dustyRose + '33' : colors.surfaceSecondary,
          borderColor: selected ? Colors.dustyRose : colors.border,
        },
        style,
      ]}
    >
      <Typography
        variant="label"
        color={selected ? Colors.dustyRoseDark : colors.textSecondary}
        style={styles.label}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    margin: 4,
  },
  label: {
    textAlign: 'center',
  },
});
