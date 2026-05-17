import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function AssistantScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: t('assistant.greeting') },
  ]);
  const [input, setInput] = useState('');

  function send(text: string) {
    const v = text.trim();
    if (!v) return;
    setMsgs((m) => [...m, { role: 'user', content: v }]);
    setInput('');
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            'MVP demo answer. The production assistant uses Claude + GTFS tools to plan routes and explain disruptions.',
        },
      ]);
    }, 450);
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.brand,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles color="white" size={20} />
            </View>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>
              Wayra Assistant
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
          {msgs.map((m, i) => (
            <View
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: m.role === 'user' ? theme.brand : theme.surfaceMuted,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                maxWidth: '85%',
              }}
            >
              <Text style={{ color: m.role === 'user' ? 'white' : theme.text, fontSize: 14 }}>
                {m.content}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 16,
            paddingBottom: 16,
            alignItems: 'flex-end',
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 16,
              paddingHorizontal: 12,
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('assistant.placeholder')}
              placeholderTextColor={theme.textSubtle}
              multiline
              style={{ paddingVertical: 12, color: theme.text, fontSize: 14, maxHeight: 100 }}
            />
          </View>
          <Pressable
            onPress={() => send(input)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: theme.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send color="white" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
