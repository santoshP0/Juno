import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, View } from 'react-native';
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
          backgroundColor: selected ? Colors.dustyRose + '20' : colors.surfaceSecondary,
          borderColor: selected ? Colors.dustyRose : colors.border,
        },
        style,
      ]}
    >
      {selected && (
        <View style={[styles.dot, { backgroundColor: Colors.dustyRose }]} />
      )}
      <Typography
        variant="label"
        color={selected ? Colors.dustyRose : colors.textSecondary}
        style={{ fontWeight: selected ? '700' : '500' }}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    margin: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
