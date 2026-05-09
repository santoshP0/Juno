import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Typography } from '../ui/Typography';
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';
import { MOODS } from '../../constants/content';
import type { Mood } from '../../types';

interface MoodSelectorProps {
  selected: Mood[];
  onToggle: (mood: Mood) => void;
}

export function MoodSelector({ selected, onToggle }: MoodSelectorProps) {
  const colors = useColors();

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {MOODS.map((m) => {
          const isSelected = selected.includes(m.key);
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => {
                Haptics.selectionAsync();
                onToggle(m.key);
              }}
              activeOpacity={0.7}
              style={[
                styles.item,
                {
                  backgroundColor: isSelected
                    ? Colors.dustyRose + '33'
                    : colors.surfaceSecondary,
                  borderColor: isSelected ? Colors.dustyRose : colors.border,
                },
              ]}
            >
              <Typography style={styles.emoji}>{m.emoji}</Typography>
              <Typography
                variant="caption"
                color={isSelected ? Colors.dustyRoseDark : colors.textSecondary}
                align="center"
              >
                {m.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    width: 72,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 24,
  },
});
