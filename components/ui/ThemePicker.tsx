import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { ACCENT_THEMES, type AccentThemeKey } from '../../constants/themes';
import { Typography } from './Typography';
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/theme';

interface ThemePickerProps {
  value: AccentThemeKey;
  onChange: (key: AccentThemeKey) => void;
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const colors = useColors();

  return (
    <View>
      <Typography
        variant="label"
        color={colors.textSecondary}
        style={{ marginBottom: 12 }}
      >
        Color theme
      </Typography>
      <View style={styles.row}>
        {(Object.entries(ACCENT_THEMES) as [AccentThemeKey, typeof ACCENT_THEMES[AccentThemeKey]][]).map(
          ([key, theme]) => {
            const selected = value === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => onChange(key)}
                activeOpacity={0.75}
                style={styles.item}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: theme.primary },
                    selected && styles.swatchSelected,
                  ]}
                >
                  {selected && (
                    <Check size={14} color={Colors.white} strokeWidth={3} />
                  )}
                </View>
                <Typography
                  variant="caption"
                  color={selected ? theme.primary : colors.textTertiary}
                  align="center"
                  style={{ marginTop: 4, fontWeight: selected ? '700' : '400' }}
                >
                  {theme.emoji}
                </Typography>
              </TouchableOpacity>
            );
          }
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
