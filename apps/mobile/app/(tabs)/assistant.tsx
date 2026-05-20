import { useEffect, useRef, useState } from 'react';
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
import { Bot, Send, Sparkles, User as UserIcon, Compass, RotateCcw } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@wayra/types';
import { api } from '@/lib/api';
import { SimpleMarkdown } from '@/components/SimpleMarkdown';
import { Chip, Pip } from '@/components/ui';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function AssistantScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const initialGreeting: Msg = { role: 'assistant', content: t('assistant.greeting') };
  const [msgs, setMsgs] = useState<Msg[]>([initialGreeting]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [msgs, busy]);

  async function send(text: string) {
    const v = text.trim();
    if (!v || busy) return;
    setMsgs((m) => [...m, { role: 'user', content: v }]);
    setInput('');
    setBusy(true);
    try {
      const result = await api.assistant({ message: v, locale, history: msgs });
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

  function reset() {
    setMsgs([initialGreeting]);
  }

  const examples = t('assistant.examples', { returnObjects: true }) as string[];
  const showExamples = msgs.length <= 1 && !busy;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 12 }}>
          <Chip
            label="AI Assistant"
            tone="amber"
            icon={<Compass color={theme.accent} size={10} />}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 20,
                backgroundColor: theme.brand,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                shadowColor: theme.brand,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Sparkles color="#fff" size={22} />
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  backgroundColor: theme.status.onTime,
                  borderWidth: 3,
                  borderColor: theme.bg,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontWeight: '800',
                  letterSpacing: -0.6,
                }}
              >
                Wayra Assistant
              </Text>
              <Text
                style={{
                  color: theme.textSubtle,
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                Multilingual · GTFS-aware
              </Text>
            </View>
            {msgs.length > 1 && (
              <Pressable
                onPress={reset}
                hitSlop={10}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  borderColor: theme.border,
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <RotateCcw color={theme.textMuted} size={14} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
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
                    width: 32,
                    height: 32,
                    borderRadius: 12,
                    backgroundColor: theme.brand,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot color="#fff" size={16} />
                </View>
              )}
              <View
                style={{
                  backgroundColor: m.role === 'user' ? theme.brand : theme.surfaceMuted,
                  borderColor: m.role === 'user' ? 'transparent' : theme.border,
                  borderWidth: m.role === 'user' ? 0 : 1,
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  maxWidth: '78%',
                  shadowColor: '#0f172a',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                }}
              >
                {m.role === 'user' ? (
                  <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>{m.content}</Text>
                ) : (
                  <SimpleMarkdown text={m.content} color={theme.text} />
                )}
              </View>
              {m.role === 'user' && (
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 12,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderWidth: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserIcon color={theme.textMuted} size={16} />
                </View>
              )}
            </View>
          ))}
          {busy && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 12,
                  backgroundColor: theme.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot color="#fff" size={16} />
              </View>
              <View
                style={{
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator color={theme.brand} size="small" />
                <Text
                  style={{
                    color: theme.textSubtle,
                    fontSize: 10,
                    fontWeight: '800',
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                  }}
                >
                  Thinking
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggested prompts */}
        {showExamples && examples?.length > 0 && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 8,
              gap: 6,
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {examples.slice(0, 4).map((ex) => (
              <Pressable
                key={ex}
                onPress={() => send(ex)}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: theme.bgElevated,
                  borderColor: theme.border,
                  borderWidth: 1,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700' }}>
                  {ex}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Composer */}
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 16,
            paddingBottom: 16,
            paddingTop: 8,
            alignItems: 'flex-end',
            borderTopColor: theme.border,
            borderTopWidth: 1,
            backgroundColor: theme.bg,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: theme.bgElevated,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 18,
              paddingHorizontal: 12,
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('assistant.placeholder')}
              placeholderTextColor={theme.textSubtle}
              multiline
              style={{
                paddingVertical: 12,
                color: theme.text,
                fontSize: 14,
                maxHeight: 100,
              }}
            />
          </View>
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || busy}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: theme.brand,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !input.trim() || busy ? 0.4 : 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
              shadowColor: theme.brand,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 3,
            })}
          >
            <Send color="#fff" size={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
