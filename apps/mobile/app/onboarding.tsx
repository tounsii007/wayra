import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View, ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Sparkles, Activity, DownloadCloud, Train } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';

const { width } = Dimensions.get('window');

interface Slide {
  key: string;
  title: string;
  body: string;
  Icon: typeof Train;
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
    },
    {
      key: 'live',
      title: t('home.features.items.1.title'),
      body: t('home.features.items.1.body'),
      Icon: Activity,
    },
    {
      key: 'offline',
      title: t('home.features.items.2.title'),
      body: t('home.features.items.2.body'),
      Icon: DownloadCloud,
    },
    {
      key: 'ai',
      title: t('home.features.items.3.title'),
      body: t('home.features.items.3.body'),
      Icon: Sparkles,
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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1 }}>
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
            return (
              <View
                style={{
                  width,
                  padding: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 28,
                    backgroundColor: theme.brand,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: theme.brand,
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 10 },
                  }}
                >
                  <Icon color="white" size={36} />
                </View>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 24,
                    fontWeight: '800',
                    textAlign: 'center',
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

        <View
          style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 }}
        >
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: i === index ? theme.brand : theme.border,
              }}
            />
          ))}
        </View>

        <View style={{ flexDirection: 'row', padding: 20, gap: 12 }}>
          <Pressable
            onPress={done}
            style={{ flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: theme.textMuted, fontWeight: '600' }}>Skip</Text>
          </Pressable>
          <Pressable
            onPress={next}
            style={{
              flex: 1,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              backgroundColor: theme.brand,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>
              {index === slides.length - 1 ? 'Get started' : 'Next'}
            </Text>
            <ArrowRight color="white" size={16} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
