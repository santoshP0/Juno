import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { useColors } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🌙',
    title: 'Welcome to Juno',
    subtitle: 'Your calm, private companion for understanding your body and cycle.',
    bg: Colors.dustyRoseLight,
  },
  {
    emoji: '🔒',
    title: '100% Private',
    subtitle: 'Your data never leaves your phone. No accounts, no servers, no tracking. Ever.',
    bg: Colors.sageLight,
  },
  {
    emoji: '📅',
    title: 'Track Everything',
    subtitle: 'Log your flow, symptoms, mood, sleep, and more — all in one place.',
    bg: Colors.cream,
  },
  {
    emoji: '✨',
    title: 'Understand Your Body',
    subtitle: 'Predictions, insights, and personalized content based on your unique cycle.',
    bg: Colors.goldLight,
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      router.push('/(onboarding)/info');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeIn} style={[styles.slide, { width }]}>
            <View style={[styles.emojiCircle, { backgroundColor: index === 0 ? colors.accentLight : item.bg }]}>
              <Typography style={styles.emoji}>{item.emoji}</Typography>
            </View>
            <Typography variant="h2" align="center" style={{ marginTop: Spacing.xl }}>
              {item.title}
            </Typography>
            <Typography
              variant="body"
              align="center"
              color={colors.textSecondary}
              style={{ marginTop: Spacing.md, paddingHorizontal: Spacing['2xl'] }}
            >
              {item.subtitle}
            </Typography>
          </Animated.View>
        )}
      />

      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex ? colors.accent : colors.border,
                  width: i === activeIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button
          label={activeIndex === SLIDES.length - 1 ? "Let's get started" : 'Next'}
          onPress={handleNext}
          fullWidth
          size="lg"
        />

        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/info')}
          style={styles.skip}
        >
          <Typography variant="label" color={colors.textTertiary}>
            Skip intro
          </Typography>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    flex: 1,
  },
  emojiCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 60, lineHeight: 72 },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  skip: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
});
