import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Typography } from '../ui/Typography';
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';

interface PinPadProps {
  onComplete: (pin: string) => void;
  title?: string;
  subtitle?: string;
  error?: string;
}

const DIGITS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export function PinPad({ onComplete, title = 'Enter PIN', subtitle, error }: PinPadProps) {
  const [pin, setPin] = useState('');
  const colors = useColors();
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
    Vibration.vibrate(200);
  };

  const handleDigit = (digit: string) => {
    if (digit === '') return;
    Haptics.selectionAsync();

    if (digit === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }

    const next = pin + digit;
    setPin(next);

    if (next.length === 4) {
      setTimeout(() => {
        onComplete(next);
        setPin('');
      }, 100);
    }
  };

  React.useEffect(() => {
    if (error) shake();
  }, [error]);

  return (
    <View style={styles.container}>
      <Typography variant="h3" align="center" style={{ marginBottom: 4 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" align="center" color={colors.textSecondary} style={{ marginBottom: 24 }}>
          {subtitle}
        </Typography>
      )}

      <Animated.View style={[styles.dots, shakeStyle]}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < pin.length ? Colors.dustyRose : colors.border,
                borderColor: i < pin.length ? Colors.dustyRose : colors.border,
              },
            ]}
          />
        ))}
      </Animated.View>

      {error && (
        <Typography variant="caption" color={Colors.error} align="center" style={{ marginTop: 8, marginBottom: -8 }}>
          {error}
        </Typography>
      )}

      <View style={styles.keypad}>
        {DIGITS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((digit, ci) => (
              <TouchableOpacity
                key={ci}
                style={[
                  styles.key,
                  {
                    backgroundColor: digit ? colors.surfaceSecondary : 'transparent',
                    opacity: digit === '' ? 0 : 1,
                  },
                ]}
                onPress={() => handleDigit(digit)}
                disabled={digit === ''}
                activeOpacity={0.7}
              >
                <Typography variant="h3" align="center">
                  {digit}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
    marginTop: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
