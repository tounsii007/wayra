import { Text, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/theme';
import { Chip } from './Chip';

/**
 * Editorial screen header — chip + big display title + optional
 * highlighted span + optional lead paragraph.  Sits at the top of every
 * primary screen (Home, Live, Profile, …) the same way as the web app.
 */
export function ScreenHeader({
  chip,
  chipIcon,
  chipTone = 'brand',
  title,
  highlight,
  lead,
  style,
}: {
  chip?: string;
  chipIcon?: React.ReactNode;
  chipTone?: 'brand' | 'amber';
  title: string;
  highlight?: string;
  lead?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View style={style}>
      {chip && <Chip label={chip} tone={chipTone} icon={chipIcon} />}
      <Text
        style={{
          marginTop: chip ? 12 : 0,
          color: theme.text,
          fontSize: 32,
          fontWeight: '800',
          lineHeight: 36,
          letterSpacing: -1.2,
        }}
      >
        {title}
        {highlight && (
          <>
            {' '}
            <Text style={{ color: theme.brand }}>{highlight}</Text>
          </>
        )}
      </Text>
      {lead && (
        <Text
          style={{
            marginTop: 10,
            color: theme.textMuted,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          {lead}
        </Text>
      )}
    </View>
  );
}
