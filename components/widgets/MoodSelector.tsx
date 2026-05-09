import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Typography } from '../ui/Typography';
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';
import { MOODS } from '../../constants/content';
import { Radius } from '../../constants/theme';
import type { Mood } from '../../types';

interface MoodSelectorProps {
  selected: Mood[];
  onToggle: (mood: Mood) => void;
}

const MOOD_COLORS: Record<string, string> = {
  happy: '#FBBF24',
  calm: '#60A5FA',
  energetic: '#F97316',
  confident: '#A78BFA',
  excited: '#EC4899',
  sensitive: Colors.dustyRose,
  sad: '#6B7280',
  anxious: '#FB923C',
  irritable: '#EF4444',
  overwhelmed: '#7C3AED',
  depressed: '#374151',
};

export function MoodSelector({ selected, onToggle }: MoodSelectorProps) {
  const colors = useColors();

  return (
    <View style={styles.grid}>
      {MOODS.map((m) => {
        const isSelected = selected.includes(m.key);
        const moodColor = MOOD_COLORS[m.key] ?? Colors.dustyRose;
        return (
          <TouchableOpacity
            key={m.key}
            onPress={() => {
              Haptics.selectionAsync();
              onToggle(m.key);
            }}
            activeOpacity={0.75}
            style={[
              styles.item,
              {
                backgroundColor: isSelected ? moodColor + '22' : colors.surfaceSecondary,
                borderColor: isSelected ? moodColor : colors.border,
              },
            ]}
          >
            <Typography style={styles.emoji}>{m.emoji}</Typography>
            <Typography
              variant="caption"
              color={isSelected ? moodColor : colors.textSecondary}
              align="center"
              style={{ fontWeight: isSelected ? '700' : '400' }}
            >
              {m.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  item: {
    width: 74,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 5,
  },
  emoji: {
    fontSize: 26,
  },
});
