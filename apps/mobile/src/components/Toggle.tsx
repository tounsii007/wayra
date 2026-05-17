import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, hint, value, onChange }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{label}</Text>
        {hint && <Text style={{ color: theme.textMuted, fontSize: 12 }}>{hint}</Text>}
      </View>
      <View
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          backgroundColor: value ? theme.brand : theme.border,
          justifyContent: 'center',
          padding: 2,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            backgroundColor: '#fff',
            alignSelf: value ? 'flex-end' : 'flex-start',
          }}
        />
      </View>
    </Pressable>
  );
}
