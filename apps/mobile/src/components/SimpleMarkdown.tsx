import { Text } from 'react-native';
import type { TextStyle } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  text: string;
  baseStyle?: TextStyle;
  color?: string;
}

/**
 * Tiny markdown renderer covering what the assistant actually produces:
 *   • **bold**
 *   • *italic*
 *   • `code`
 *   • [link](url) — currently rendered as bold (no nav to keep this dep-light)
 *   • bullet rows lead with "- " or "• "
 * Anything else is rendered verbatim. For full markdown we'd add a parser
 * (e.g. react-native-markdown-display), but that adds 200KB; this stays
 * under 1KB.
 */
export function SimpleMarkdown({ text, baseStyle, color }: Props) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Text style={[{ color: c, fontSize: 14, lineHeight: 20 }, baseStyle]}>
      {text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((seg, i) => {
        if (seg.startsWith('**') && seg.endsWith('**'))
          return (
            <Text key={i} style={{ fontWeight: '800' }}>
              {seg.slice(2, -2)}
            </Text>
          );
        if (seg.startsWith('*') && seg.endsWith('*'))
          return (
            <Text key={i} style={{ fontStyle: 'italic' }}>
              {seg.slice(1, -1)}
            </Text>
          );
        if (seg.startsWith('`') && seg.endsWith('`'))
          return (
            <Text
              key={i}
              style={{
                fontFamily: 'Courier',
                backgroundColor: theme.surfaceMuted,
                paddingHorizontal: 4,
              }}
            >
              {seg.slice(1, -1)}
            </Text>
          );
        const linkMatch = seg.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <Text key={i} style={{ color: theme.brand, fontWeight: '700' }}>
              {linkMatch[1]}
            </Text>
          );
        }
        return <Text key={i}>{seg}</Text>;
      })}
    </Text>
  );
}
