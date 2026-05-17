import { View, Text } from 'react-native';
import { ArrowRight, Clock, Footprints, Train, Leaf, Sparkles } from 'lucide-react-native';
import { formatDuration, formatTime, formatFare, formatCO2 } from '@wayra/shared';
import type { Route, Locale } from '@wayra/types';
import { useTheme } from '@/theme';

export function RouteCard({ route, locale }: { route: Route; locale: Locale }) {
  const theme = useTheme();
  const delaySec = route.legs.reduce((s, l) => s + (l.delaySeconds ?? 0), 0);
  const delayMin = Math.round(delaySec / 60);

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>
            {formatTime(route.departureTime, locale)}
          </Text>
          <ArrowRight color={theme.textMuted} size={14} />
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>
            {formatTime(route.arrivalTime, locale)}
          </Text>
          {delayMin > 0 && (
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: theme.status.delay + '22',
              }}
            >
              <Text style={{ color: theme.status.delay, fontSize: 11, fontWeight: '800' }}>
                +{delayMin}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Clock color={theme.textMuted} size={12} />
            <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>
              {formatDuration(route.durationSeconds, locale)}
            </Text>
          </View>
          {route.fare && (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: theme.brand + '20',
              }}
            >
              <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '800' }}>
                {formatFare(route.fare.amount, route.fare.currency, locale)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {route.legs.map((leg, i) => {
          if (leg.mode.kind === 'walk') {
            return (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: theme.surfaceMuted,
                }}
              >
                <Footprints color={theme.textMuted} size={12} />
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600' }}>
                  {Math.round(leg.distanceMeters)} m
                </Text>
              </View>
            );
          }
          if (leg.mode.kind === 'transit') {
            return (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: leg.mode.line.color ?? theme.brand,
                }}
              >
                <Train color="#fff" size={12} />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                  {leg.mode.line.shortName}
                </Text>
              </View>
            );
          }
          return null;
        })}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: theme.textSubtle, fontSize: 11, fontWeight: '600' }}>
          {route.transfers === 0 ? 'direct' : `${route.transfers} transfers`}
        </Text>
        <Text style={{ color: theme.textSubtle, fontSize: 11 }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Footprints color={theme.textSubtle} size={11} />
          <Text style={{ color: theme.textSubtle, fontSize: 11, fontWeight: '600' }}>
            {Math.round(route.walkingMeters)} m
          </Text>
        </View>
        {route.co2SavedGrams !== undefined && route.co2SavedGrams > 0 && (
          <>
            <Text style={{ color: theme.textSubtle, fontSize: 11 }}>·</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Leaf color={theme.status.onTime} size={11} />
              <Text style={{ color: theme.status.onTime, fontSize: 11, fontWeight: '700' }}>
                {formatCO2(route.co2SavedGrams, locale)} saved
              </Text>
            </View>
          </>
        )}
        {route.tags?.includes('recommended') && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 999,
              backgroundColor: theme.brand + '20',
            }}
          >
            <Sparkles color={theme.brand} size={10} />
            <Text style={{ color: theme.brand, fontSize: 10, fontWeight: '800' }}>recommended</Text>
          </View>
        )}
      </View>
    </View>
  );
}
