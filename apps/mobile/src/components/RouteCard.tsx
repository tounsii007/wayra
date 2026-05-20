import { View, Text } from 'react-native';
import {
  ArrowRight,
  Clock,
  Footprints,
  Train,
  Leaf,
  Sparkles,
  Zap,
  Euro,
} from 'lucide-react-native';
import { formatDuration, formatTime, formatFare, formatCO2 } from '@wayra/shared';
import type { Route, Locale } from '@wayra/types';
import { useTheme } from '@/theme';

/**
 * Editorial route card — big mono times in a "departure-board" feel,
 * line-color leg pills, recommended/fastest/cheapest tags, eco saving.
 */
export function RouteCard({ route, locale }: { route: Route; locale: Locale }) {
  const theme = useTheme();
  const delaySec = route.legs.reduce((s, l) => s + (l.delaySeconds ?? 0), 0);
  const delayMin = Math.round(delaySec / 60);
  const isRecommended = route.tags?.includes('recommended');

  return (
    <View
      style={{
        backgroundColor: theme.bgElevated,
        borderColor: isRecommended ? theme.brand + '60' : theme.border,
        borderWidth: isRecommended ? 2 : 1,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      {/* Top accent strip */}
      <View
        style={{
          height: 3,
          flexDirection: 'row',
        }}
      >
        <View style={{ flex: 1, backgroundColor: theme.brand }} />
        <View style={{ flex: 1, backgroundColor: theme.accent }} />
        <View style={{ flex: 1, backgroundColor: theme.brand }} />
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        {/* Times row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text
              style={{
                color: theme.text,
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.8,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatTime(route.departureTime, locale)}
            </Text>
            <ArrowRight color={theme.textMuted} size={14} />
            <Text
              style={{
                color: theme.text,
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.8,
                fontVariant: ['tabular-nums'],
              }}
            >
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
                <Text
                  style={{
                    color: theme.status.delay,
                    fontSize: 10,
                    fontWeight: '800',
                  }}
                >
                  +{delayMin}m
                </Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock color={theme.textMuted} size={12} />
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 13,
                  fontWeight: '800',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatDuration(route.durationSeconds, locale)}
              </Text>
            </View>
            {route.fare && (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: theme.brandSoft,
                }}
              >
                <Text
                  style={{
                    color: theme.brandStrong,
                    fontSize: 13,
                    fontWeight: '800',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatFare(route.fare.amount, route.fare.currency, locale)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tags row */}
        {(isRecommended || route.tags?.includes('fastest') || route.tags?.includes('cheapest')) && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {isRecommended && (
              <Pill
                bg={theme.brandSoft}
                fg={theme.brandStrong}
                icon={<Sparkles color={theme.brandStrong} size={10} />}
                label="Recommended"
              />
            )}
            {route.tags?.includes('fastest') && (
              <Pill
                bg={theme.accentSoft}
                fg={theme.accentStrong}
                icon={<Zap color={theme.accentStrong} size={10} />}
                label="Fastest"
              />
            )}
            {route.tags?.includes('cheapest') && (
              <Pill
                bg={theme.status.onTime + '20'}
                fg={theme.status.onTime}
                icon={<Euro color={theme.status.onTime} size={10} />}
                label="Cheapest"
              />
            )}
          </View>
        )}

        {/* Leg pills */}
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
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: theme.surfaceMuted,
                  }}
                >
                  <Footprints color={theme.textMuted} size={12} />
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>
                    {Math.round(leg.distanceMeters)} m
                  </Text>
                </View>
              );
            }
            if (leg.mode.kind === 'transit') {
              const bg = leg.mode.line.color ?? theme.brand;
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: bg,
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

        {/* Stats row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: theme.textSubtle, fontSize: 11, fontWeight: '700' }}>
            {route.transfers === 0 ? 'Direct' : `${route.transfers} transfers`}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Footprints color={theme.textSubtle} size={11} />
            <Text style={{ color: theme.textSubtle, fontSize: 11, fontWeight: '700' }}>
              {Math.round(route.walkingMeters)} m
            </Text>
          </View>
          {route.co2SavedGrams !== undefined && route.co2SavedGrams > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Leaf color={theme.status.onTime} size={11} />
              <Text style={{ color: theme.status.onTime, fontSize: 11, fontWeight: '800' }}>
                {formatCO2(route.co2SavedGrams, locale)} saved
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function Pill({
  bg,
  fg,
  icon,
  label,
}: {
  bg: string;
  fg: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: bg,
      }}
    >
      {icon}
      <Text
        style={{
          color: fg,
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
