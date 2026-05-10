import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';
import type { CyclePrediction } from '../types';

const { WidgetDataModule } = NativeModules;

export function useWidgetSync(prediction: CyclePrediction | null) {
  useEffect(() => {
    if (Platform.OS !== 'android' || !WidgetDataModule || !prediction) return;

    WidgetDataModule.updateCycleData({
      cycleDay:        prediction.currentCycleDay,
      cycleLength:     prediction.avgCycleLength,
      phase:           prediction.currentPhase,
      daysUntilPeriod: prediction.daysUntilNextPeriod,
    });
  }, [prediction]);
}
