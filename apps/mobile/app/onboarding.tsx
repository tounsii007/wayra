import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View, ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Sparkles, Activity, DownloadCloud, Train } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Chip } from '@/components/ui';

const { width } = Dimensions.get('window');

interface Slide {
  key: string;
  title: string;
  body: string;
  Icon: typeof Train;
  tone: 'brand' | 'amber' | 'violet' | 'emerald';
}

export default function Onboarding() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const slides: Slide[] = [
    {
      key: 'plan',
      title: t('home.features.items.0.title'),
      body: t('home.features.items.0.body'),
      Icon: Train,
      tone: 'brand',
    },
    {
      key: 'live',
      title: t('home.features.items.1.title'),
      body: t('home.features.items.1.body'),
      Icon: Activity,
      tone: 'amber',
    },
    {
      key: 'offline',
      title: t('home.features.items.2.title'),
      body: t('home.features.items.2.body'),
      Icon: DownloadCloud,
      tone: 'violet',
    },
    {
      key: 'ai',
      title: t('home.features.items.3.title'),
      body: t('home.features.items.3.body'),
      Icon: Sparkles,
      tone: 'emerald',
    },
  ];

  function onView({ viewableItems }: { viewableItems: ViewToken[] }) {
    if (viewableItems[0]) setIndex(viewableItems[0].index ?? 0);
  }

  async function done() {
    await AsyncStorage.setItem('wayra:onboarded', '1');
    router.replace('/(tabs)');
  }

  async function next() {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      await done();
    }
  }

  const toneColor = (tone: Slide['tone']) => {
    switch (tone) {
      case 'brand':
        return theme.brand;
      case 'amber':
        return theme.accent;
      case 'violet':
        return theme.accentLegacy.violet;
      case 'emerald':
        return theme.status.onTime;
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1 }}>
        {/* Top brand row */}
        <View style={{ paddingHorizontal: 24, paddingTop: 8, alignItems: 'flex-start' }}>
          <Chip label="Welcome to Wayra" tone="brand" />
        </View>

        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(s) => s.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onView}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          renderItem={({ item }) => {
            const Icon = item.Icon;
            const color = toneColor(item.tone);
            return (
              <View
                style={{
                  width,
                  padding: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 18,
                }}
              >
                {/* Icon halo + tile */}
                <View
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      width: 200,
                      height: 200,
                      borderRadius: 100,
                      backgroundColor: color + '15',
                    }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      backgroundColor: color + '22',
                    }}
                  />
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 28,
                      backgroundColor: color,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: color,
                      shadowOpacity: 0.45,
                      shadowRadius: 24,
                      shadowOffset: { width: 0, height: 12 },
                    }}
                  >
                    <Icon color="white" size={40} />
                  </View>
                </View>

                <Text
                  style={{
                    color: theme.text,
                    fontSize: 28,
                    fontWeight: '800',
                    textAlign: 'center',
                    letterSpacing: -0.8,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 15,
                    textAlign: 'center',
                    maxWidth: 320,
                    lineHeight: 22,
                  }}
                >
                  {item.body}
                </Text>
              </View>
            );
          }}
        />

        {/* Progress dots */}
        <View
          style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 14 }}
        >
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 24 : 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: i === index ? theme.brand : theme.border,
              }}
            />
          ))}
        </View>

        {/* Footer actions */}
        <View style={{ flexDirection: 'row', padding: 20, gap: 12, alignItems: 'center' }}>
          <Pressable onPress={done} hitSlop={10}>
            <Text
              style={{
                color: theme.textMuted,
                fontWeight: '700',
                fontSize: 13,
                letterSpacing: 0.4,
              }}
            >
              Skip
            </Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Button
            label={index === slides.length - 1 ? 'Get started' : 'Next'}
            onPress={next}
            iconRight={<ArrowRight color="#fff" size={16} />}
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
