import { Text, View, Pressable } from 'react-native';
import { useTheme } from '@/theme';
import { Chip } from './Chip';

/**
 * Header for a section inside a scrolling screen — small chip + medium
 * display title + optional trailing CTA link.
 */
export function SectionHeader({
  chip,
  chipIcon,
  chipTone = 'brand',
  title,
  ctaLabel,
  onCta,
}: {
  chip?: string;
  chipIcon?: React.ReactNode;
  chipTone?: 'brand' | 'amber';
  title: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View>
        {chip && <Chip label={chip} tone={chipTone} icon={chipIcon} />}
        <Text
          style={{
            marginTop: chip ? 10 : 0,
            color: theme.text,
            fontSize: 22,
            fontWeight: '800',
            letterSpacing: -0.6,
          }}
        >
          {title}
        </Text>
      </View>
      {ctaLabel && (
        <Pressable onPress={onCta}>
          <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 13 }}>{ctaLabel} →</Text>
        </Pressable>
      )}
    </View>
  );
}
