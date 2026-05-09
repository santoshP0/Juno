import { useState, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSettingsStore } from '../stores/settingsStore';

const PIN_KEY = 'juno_pin';

export function useAppLock() {
  const [isLocked, setIsLocked] = useState(false);
  const lastActiveRef = useRef<number>(Date.now());
  const { pinEnabled, biometricEnabled, autoLockMinutes } = useSettingsStore();

  const lock = useCallback(() => {
    if (pinEnabled) setIsLocked(true);
  }, [pinEnabled]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    lastActiveRef.current = Date.now();
  }, []);

  const checkAutoLock = useCallback(() => {
    if (!pinEnabled) return;
    const idleMs = Date.now() - lastActiveRef.current;
    const limitMs = autoLockMinutes * 60 * 1000;
    if (idleMs >= limitMs) {
      setIsLocked(true);
    }
  }, [pinEnabled, autoLockMinutes]);

  const resetTimer = useCallback(() => {
    lastActiveRef.current = Date.now();
  }, []);

  return { isLocked, lock, unlock, checkAutoLock, resetTimer };
}

// ─── PIN management ──────────────────────────────────────────────────────────

export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function getPin(): Promise<string | null> {
  return SecureStore.getItemAsync(PIN_KEY);
}

export async function verifyPin(input: string): Promise<boolean> {
  const stored = await getPin();
  return stored === input;
}

export async function deletePin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

// ─── Biometrics ──────────────────────────────────────────────────────────────

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Juno',
    fallbackLabel: 'Use PIN',
    disableDeviceFallback: false,
  });
  return result.success;
}
