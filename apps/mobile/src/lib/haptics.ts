/**
 * Light wrapper around expo-haptics that no-ops if the module isn't
 * available (e.g. on web).
 */
type Style = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

let mod: typeof import('expo-haptics') | undefined;
try {
  mod = require('expo-haptics') as typeof import('expo-haptics');
} catch {
  /* not bundled */
}

export function tap(style: Style = 'light'): void {
  if (!mod) return;
  try {
    switch (style) {
      case 'light':
        void mod.impactAsync(mod.ImpactFeedbackStyle.Light);
        return;
      case 'medium':
        void mod.impactAsync(mod.ImpactFeedbackStyle.Medium);
        return;
      case 'heavy':
        void mod.impactAsync(mod.ImpactFeedbackStyle.Heavy);
        return;
      case 'success':
        void mod.notificationAsync(mod.NotificationFeedbackType.Success);
        return;
      case 'warning':
        void mod.notificationAsync(mod.NotificationFeedbackType.Warning);
        return;
      case 'error':
        void mod.notificationAsync(mod.NotificationFeedbackType.Error);
        return;
    }
  } catch {
    /* ignore */
  }
}
