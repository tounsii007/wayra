import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bot, Send, Sparkles, User as UserIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@wayra/types';
import { api } from '@/lib/api';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function AssistantScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: t('assistant.greeting') }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(text: string) {
    const v = text.trim();
    if (!v || busy) return;
    setMsgs((m) => [...m, { role: 'user', content: v }]);
    setInput('');
    setBusy(true);
    try {
      const result = await api.assistant({
        message: v,
        locale,
        history: msgs,
      });
      setMsgs((m) => [...m, { role: 'assistant', content: result.reply }]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        { role: 'assistant', content: `⚠️ ${(e as Error).message ?? 'Assistant unavailable.'}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const examples = t('assistant.examples', { returnObjects: true }) as string[];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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
              <Sparkles color="#fff" size={20} />
            </View>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>Wayra Assistant</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }} keyboardShouldPersistTaps="handled">
          {msgs.map((m, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                gap: 8,
                alignItems: 'flex-end',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {m.role === 'assistant' && (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    backgroundColor: theme.brand,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot color="#fff" size={14} />
                </View>
              )}
              <View
                style={{
                  backgroundColor: m.role === 'user' ? theme.brand : theme.surfaceMuted,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  maxWidth: '80%',
                }}
              >
                <Text style={{ color: m.role === 'user' ? '#fff' : theme.text, fontSize: 14 }}>
                  {m.content}
                </Text>
              </View>
              {m.role === 'user' && (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderWidth: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserIcon color={theme.textMuted} size={14} />
                </View>
              )}
            </View>
          ))}
          {busy && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  backgroundColor: theme.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot color="#fff" size={14} />
              </View>
              <ActivityIndicator color={theme.brand} size="small" />
            </View>
          )}
        </ScrollView>

        {msgs.length <= 1 && examples?.length > 0 && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 8,
              gap: 6,
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {examples.map((ex) => (
              <Pressable
                key={ex}
                onPress={() => send(ex)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: theme.surfaceMuted,
                }}
              >
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600' }}>{ex}</Text>
              </Pressable>
            ))}
          </View>
        )}

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
            disabled={!input.trim() || busy}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: theme.brand,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !input.trim() || busy ? 0.5 : 1,
            }}
          >
            <Send color="#fff" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
