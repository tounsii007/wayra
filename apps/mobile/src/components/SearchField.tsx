import { View, TextInput } from 'react-native';
import { MapPin, Flag } from 'lucide-react-native';
import { useTheme } from '@/theme';

export function SearchField({ icon, placeholder }: { icon: 'from' | 'to'; placeholder: string }) {
  const theme = useTheme();
  const Icon = icon === 'from' ? MapPin : Flag;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surfaceMuted,
        borderRadius: 14,
        paddingHorizontal: 12,
      }}
    >
      <Icon color={theme.textSubtle} size={18} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.textSubtle}
        style={{
          flex: 1,
          paddingVertical: 12,
          paddingHorizontal: 8,
          color: theme.text,
          fontSize: 15,
        }}
      />
    </View>
  );
}
