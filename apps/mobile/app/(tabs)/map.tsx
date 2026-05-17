import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { MapLibreView } from '@/components/MapLibreView';

/**
 * Mobile map screen — MapLibre rendered through `react-native-maplibre-gl`.
 *
 * Note: MapLibre Native is a Custom Dev Client native module. It works after
 * `expo run:ios` / `expo run:android`. In plain Expo Go this screen falls back
 * to an empty view because the native module isn't bundled.
 */
export default function MapScreen() {
  const theme = useTheme();
  const markers = [
    { id: 'de:berlin:hbf', coordinates: { lat: 52.5251, lng: 13.3694 }, color: '#EC0016' },
    { id: 'de:berlin:alex', coordinates: { lat: 52.5219, lng: 13.4132 }, color: '#1d4fd1' },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1, backgroundColor: theme.surfaceMuted }}>
        <MapLibreView center={{ lat: 52.52, lng: 13.405 }} zoom={11} markers={markers} />
      </View>
    </SafeAreaView>
  );
}
