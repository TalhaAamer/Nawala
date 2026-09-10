import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useCartIconTarget } from './CartIconTarget';
import { FLY_DURATION_MS } from './motion';

const AnimatedImage = Animated.createAnimatedComponent(Image);

type Rect = { x: number; y: number; width: number; height: number };

type FlyParams = {
  from: Rect;
  image: string;
  blurhash?: string;
};

type FlyToCartValue = {
  /** Animate a clone of `image` from `from` to the registered cart icon. */
  fly: (params: FlyParams) => Promise<void>;
};

const FlyToCartContext = createContext<FlyToCartValue | null>(null);

type Flight = FlyParams & { id: string; to: Rect };

export function FlyToCartProvider({ children }: { children: ReactNode }) {
  const target = useCartIconTarget();
  const [flights, setFlights] = useState<Flight[]>([]);

  const remove = useCallback((id: string) => {
    setFlights((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const fly = useCallback(
    async ({ from, image, blurhash }: FlyParams) => {
      // Prefer the registered cart icon; otherwise fly to bottom-center, where
      // the sticky CartBar lives (e.g. on the restaurant detail screen).
      const measured = (await target?.measureTarget()) ?? null;
      const screen = Dimensions.get('window');
      const to = measured ?? {
        x: screen.width / 2 - 20,
        y: screen.height - 90,
        width: 40,
        height: 40,
      };
      // Stable-ish id without Date.now/Math.random (banned in some envs is fine here,
      // but keep it simple): combine coords + length.
      const id = `${from.x.toFixed(0)}-${from.y.toFixed(0)}-${image.length}`;
      setFlights((prev) => [...prev, { id, from, to, image, blurhash }]);
    },
    [target],
  );

  return (
    <FlyToCartContext.Provider value={{ fly }}>
      {children}
      {flights.map((f) => (
        <FlyingImage key={f.id} flight={f} onDone={() => remove(f.id)} />
      ))}
    </FlyToCartContext.Provider>
  );
}

function FlyingImage({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  const dx = flight.to.x + flight.to.width / 2 - (flight.from.x + flight.from.width / 2);
  const dy = flight.to.y + flight.to.height / 2 - (flight.from.y + flight.from.height / 2);

  useEffect(() => {
    const finish = () => {
      void Haptics.selectionAsync();
      onDone();
    };
    if (reduced) {
      // Skip the arc, just fire the haptic + cleanup.
      finish();
      return;
    }
    progress.value = withTiming(
      1,
      { duration: FLY_DURATION_MS, easing: Easing.inOut(Easing.cubic) },
      (done) => {
        if (done) runOnJS(finish)();
      },
    );
    // Run once per flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * dx },
      { translateY: progress.value * dy },
      { scale: 1 - progress.value * 0.8 },
    ],
    opacity: 1 - progress.value * 0.85,
  }));

  return (
    <AnimatedImage
      pointerEvents="none"
      source={flight.image}
      placeholder={flight.blurhash ? { blurhash: flight.blurhash } : undefined}
      contentFit="cover"
      style={[
        styles.flying,
        { left: flight.from.x, top: flight.from.y, width: flight.from.width, height: flight.from.height },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  flying: { position: 'absolute', borderRadius: 14, zIndex: 1000 },
});

/** Returns `{ fly }`. Safe no-op outside a provider so components work in isolation. */
export function useFlyToCart(): FlyToCartValue {
  return useContext(FlyToCartContext) ?? { fly: async () => {} };
}
