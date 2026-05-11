import { useEffect, useRef } from 'react';
import { NativeModules, Platform } from 'react-native';
import type { CyclePrediction } from '../types';

const { WidgetDataModule } = NativeModules;

export function useWidgetSync(prediction: CyclePrediction | null) {
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android' || !WidgetDataModule || !prediction) return;

    const key = `${prediction.currentCycleDay}|${prediction.currentPhase}|${prediction.daysUntilNextPeriod}|${prediction.avgCycleLength}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    WidgetDataModule.updateCycleData({
      cycleDay:        prediction.currentCycleDay,
      cycleLength:     prediction.avgCycleLength,
      phase:           prediction.currentPhase,
      daysUntilPeriod: prediction.daysUntilNextPeriod,
    });
  }, [prediction]);
}
