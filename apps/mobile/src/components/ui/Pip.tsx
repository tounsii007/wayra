import { View } from 'react-native';
import { useTheme } from '@/theme';

/**
 * Live-network status dot with surrounding pulse-ring.  Mirrors the web
 * `.live-pip` class.
 */
export function Pip({ color, size = 8 }: { color?: string; size?: number }) {
  const theme = useTheme();
  const c = color ?? theme.status.onTime;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          backgroundColor: c,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 2,
          height: size * 2,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: c,
          opacity: 0.35,
        }}
      />
    </View>
  );
}
