import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const PIN_KEY = 'juno_pin';

// ─── Module-level lock state ──────────────────────────────────────────────────
// Using module-level variables avoids the React hook per-instance state problem
// (each useAppLock() call would get its own independent isLocked state).

let _backgroundedAt: number | null = null;

/** Call when app goes to background/inactive. */
export function onAppBackground(): void {
  _backgroundedAt = Date.now();
}

/** Call after successful PIN/biometric unlock. Resets the idle timer. */
export function onAppUnlock(): void {
  _backgroundedAt = null;
}

/**
 * Returns true if the app should show the lock screen.
 * Checks elapsed time since last background event.
 */
export function checkShouldLock(
  autoLockMinutes: number,
  pinEnabled: boolean
): boolean {
  if (!pinEnabled || _backgroundedAt === null) return false;
  const idleMs = Date.now() - _backgroundedAt;
  return idleMs >= autoLockMinutes * 60 * 1000;
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
