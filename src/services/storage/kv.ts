/**
 * Thin typed wrappers over AsyncStorage. The ONLY module (besides Zustand's
 * persist) that talks to AsyncStorage directly — screens go through stores or
 * the typed storage helpers, never AsyncStorage itself.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  orders: 'crave/orders',
  session: 'crave/session',
  favorites: 'crave/favorites',
  addresses: 'crave/addresses',
  recentSearches: 'crave/recent-searches',
  notifications: 'crave/notifications',
  orderRatings: 'crave/order-ratings',
  cart: 'crave-cart', // owned by the Zustand persist middleware
  theme: 'crave-theme', // owned by ThemeProvider
} as const;

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    if (__DEV__) console.warn(`[storage] getJSON("${key}") failed:`, err);
    return fallback;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (__DEV__) console.warn(`[storage] setJSON("${key}") failed:`, err);
  }
}

export async function removeJSON(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    if (__DEV__) console.warn(`[storage] removeJSON("${key}") failed:`, err);
  }
}

/** Clear all crave-owned keys (used by the kitchen-sink "Reset storage" action). */
export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}
