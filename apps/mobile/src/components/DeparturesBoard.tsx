import { Text, View } from 'react-native';
import { Train, TramFront, Bus, AlertCircle, Loader2 } from 'lucide-react-native';
import { formatTime, formatDelayMinutes } from '@wayra/shared';
import type { Departure, Locale, TransitMode } from '@wayra/types';
import { useTheme } from '@/theme';
import { useLiveDepartures } from '@/hooks/useLiveDepartures';

const MODE_ICON: Partial<Record<TransitMode, typeof Train>> = {
  rail: Train,
  subway: Train,
  tram: TramFront,
  bus: Bus,
  coach: Bus,
};

export function DeparturesBoard({ stopId, locale }: { stopId: string; locale: Locale }) {
  const theme = useTheme();
  const { departures, liveDataAvailable, loading, error } = useLiveDepartures(stopId);

  if (loading) {
    return (
      <View style={{ gap: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            style={{ height: 56, borderRadius: 14, backgroundColor: theme.surfaceMuted }}
          />
        ))}
      </View>
    );
  }
  if (error) {
    return (
      <View
        style={{
          flexDirection: 'row',
          gap: 6,
          padding: 12,
          borderRadius: 14,
          backgroundColor: theme.status.severe + '15',
        }}
      >
        <AlertCircle color={theme.status.severe} size={14} />
        <Text style={{ color: theme.status.severe, fontSize: 12 }}>{error}</Text>
      </View>
    );
  }
  if (departures.length === 0) {
    return (
      <View style={{ padding: 16, borderRadius: 14, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }}>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>No departures in the next window.</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {liveDataAvailable === false && (
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            padding: 8,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: theme.surfaceMuted,
            alignItems: 'center',
          }}
        >
          <Loader2 color={theme.textMuted} size={12} />
          <Text style={{ color: theme.textMuted, fontSize: 11 }}>Live feed unavailable — scheduled times shown.</Text>
        </View>
      )}
      {departures.map((d) => {
        const Icon = MODE_ICON[d.line.mode] ?? Bus;
        const delayMin = d.delaySeconds ? formatDelayMinutes(d.delaySeconds) : '';
        const tone = d.cancelled
          ? theme.status.cancelled
          : (d.delaySeconds ?? 0) <= 60
            ? theme.status.onTime
            : (d.delaySeconds ?? 0) <= 300
              ? theme.status.delay
              : theme.status.severe;
        return (
          <View
            key={`${d.tripId}-${d.scheduledTime}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 14,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: d.line.color ?? theme.brand,
              }}
            >
              <Icon color="#fff" size={14} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>{d.line.shortName}</Text>
                <Text
                  numberOfLines={1}
                  style={{ color: theme.textMuted, fontSize: 13, flex: 1 }}
                >
                  → {d.headsign}
                </Text>
              </View>
              {(d.platform || d.platformChanged) && (
                <Text style={{ color: theme.textSubtle, fontSize: 11 }}>
                  {d.platform ? `Platform ${d.platform}` : ''}
                  {d.platformChanged ? '  · changed' : ''}
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 16,
                  fontWeight: '800',
                  textDecorationLine: d.cancelled ? 'line-through' : 'none',
                }}
              >
                {formatTime(d.predictedTime ?? d.scheduledTime, locale)}
              </Text>
              {delayMin && (
                <Text style={{ color: tone, fontSize: 11, fontWeight: '700' }}>{delayMin}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
