import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { ThemeProvider, useTheme } from '@/theme';
import { CartIconTargetProvider, FlyToCartProvider } from '@/components';
import { useSession } from '@/store/session';
import { orderClock } from '@/services/api';

// Hold the native splash until fonts + persisted state are ready.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    // Keep splash visible; nothing rendered yet.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <CartIconTargetProvider>
              <FlyToCartProvider>
                <RootNavigator />
              </FlyToCartProvider>
            </CartIconTargetProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Lives under ThemeProvider so it can read the resolved scheme + hydration state. */
function RootNavigator() {
  const { theme, scheme, hydrated: themeHydrated } = useTheme();
  const sessionHydrated = useSession((s) => s.hydrated);
  const [ordersRestored, setOrdersRestored] = useState(false);

  // Resume in-flight order clocks once, on launch.
  useEffect(() => {
    orderClock.restoreAll().finally(() => setOrdersRestored(true));
    return () => orderClock.stopAll();
  }, []);

  const ready = themeHydrated && sessionHydrated && ordersRestored;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="restaurant/[id]" />
        <Stack.Screen name="item/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order/[id]" />
      </Stack>
    </>
  );
}
