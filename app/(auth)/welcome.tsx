import { useEffect, useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme, useThemedStyles } from '@/theme';
import { Button, Sheet, SheetRow } from '@/components';
import { useSession } from '@/store/session';
import { loadAddresses } from '@/services/storage/addresses';
import type { Address } from '@/types';

const { width } = Dimensions.get('window');

const SLIDES = [
  { icon: 'fast-food', title: 'Your favorite food,\ndelivered', body: 'Thousands of local restaurants, one tap away.' },
  { icon: 'bicycle', title: 'Track every bite\nin real time', body: 'Watch your order from the kitchen to your door.' },
  { icon: 'heart', title: 'Save the spots\nyou love', body: 'Reorder in seconds and never miss a craving.' },
] as const;

export default function Welcome() {
  const { theme } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const setAddress = useSession((s) => s.setAddress);
  const continueAsGuest = useSession((s) => s.continueAsGuest);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const scrollX = useSharedValue(0);

  useEffect(() => {
    loadAddresses().then(setAddresses);
  }, []);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const onPickAddress = (id: string) => {
    setAddress(id);
    setSheetOpen(false);
    router.replace('/(auth)/sign-in');
  };

  const onGuest = () => {
    continueAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flexGrow: 0 }}
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={s.icon} size={64} color={theme.colors.accent} />
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <Dot key={s.title} index={i} scrollX={scrollX} />
        ))}
      </View>

      <View style={styles.cta}>
        <Button label="Set your location" icon="location" onPress={() => setSheetOpen(true)} />
        <Button label="Continue as guest" variant="ghost" onPress={onGuest} />
      </View>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Where should we deliver?">
        {addresses.map((a) => (
          <SheetRow key={a.id}>
            <Button
              label={`${a.label} — ${a.line1}`}
              variant="ghost"
              onPress={() => onPickAddress(a.id)}
            />
          </SheetRow>
        ))}
      </Sheet>
    </SafeAreaView>
  );
}

function Dot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const { theme } = useTheme();
  const style = useAnimatedStyle(() => {
    const active = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [8, 22, 8],
      'clamp',
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.4, 1, 0.4],
      'clamp',
    );
    return { width: active, opacity };
  });
  return (
    <Animated.View
      style={[{ height: 8, borderRadius: 4, backgroundColor: theme.colors.accent }, style]}
    />
  );
}

function useStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg, justifyContent: 'space-between' as const },
    slide: { alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg, flex: 1 },
    iconWrap: {
      width: 120,
      height: 120,
      borderRadius: t.radii.pill,
      backgroundColor: t.colors.accentSoft,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: t.spacing.lg,
    },
    title: { ...t.typography.display, color: t.colors.textPrimary, textAlign: 'center' as const },
    body: { ...t.typography.body, color: t.colors.textSecondary, textAlign: 'center' as const },
    dots: { flexDirection: 'row' as const, gap: t.spacing.sm, justifyContent: 'center' as const, paddingVertical: t.spacing.lg },
    cta: { paddingHorizontal: t.screenPaddingX, paddingBottom: t.spacing.lg, gap: t.spacing.sm },
  }));
}
