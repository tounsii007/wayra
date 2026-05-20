import { Text, View } from 'react-native';
import { useTheme } from '@/theme';

/**
 * Departure-board style stat tile — uppercase mono label on top, big
 * tabular-num value below.  Used in hero rows and dashboards.
 */
export function Stat({
  label,
  value,
  unit,
  tone = 'text',
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: 'text' | 'brand' | 'amber';
}) {
  const theme = useTheme();
  const unitColor = tone === 'brand' ? theme.brand : tone === 'amber' ? theme.accent : theme.text;

  return (
    <View>
      <Text
        style={{
          color: theme.textSubtle,
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1, marginTop: 4 }}>
        <Text
          style={{
            color: theme.text,
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -0.8,
            fontVariant: ['tabular-nums'],
          }}
        >
          {value}
        </Text>
        {unit && (
          <Text
            style={{
              color: unitColor,
              fontSize: 22,
              fontWeight: '800',
            }}
          >
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
}
