/**
 * Biometric re-auth gate. Wraps expo-local-authentication so the rest of
 * the app calls a single `requireBiometric(reason)` and gets back a clean
 * boolean — works on iOS (FaceID/TouchID) and Android (BiometricPrompt),
 * and degrades to `true` when biometrics aren't available so we don't
 * lock the user out of their own data.
 */
export async function requireBiometric(promptMessage: string): Promise<boolean> {
  let LocalAuth: typeof import('expo-local-authentication') | undefined;
  try {
    LocalAuth = require('expo-local-authentication') as typeof import('expo-local-authentication');
  } catch {
    return true;
  }
  if (!LocalAuth) return true;
  try {
    const hasHardware = await LocalAuth.hasHardwareAsync();
    const enrolled = await LocalAuth.isEnrolledAsync();
    if (!hasHardware || !enrolled) return true;
    const res = await LocalAuth.authenticateAsync({
      promptMessage,
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return true;
  }
}
