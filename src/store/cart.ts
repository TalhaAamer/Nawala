import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CartItem } from '@/types';
import { STORAGE_KEYS } from '@/services/storage/kv';

type CartState = {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  promoCode: string | null;
  setPromo: (code: string | null) => void;
  /** Whether an item from this restaurant can be added without clearing. */
  canAdd: (restaurantId: string) => boolean;
  /** Add a line; merges with an identical existing line (same id). Sets the
   *  active restaurant when the cart is empty. Assumes the caller has confirmed
   *  any cross-restaurant switch (see canAdd). */
  add: (item: CartItem, restaurantName?: string) => void;
  setQty: (lineId: string, qty: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  /** Replace the whole cart (used by reorder). */
  replace: (items: CartItem[], restaurantId: string, restaurantName: string) => void;
  count: () => number;
  subtotalMinor: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      promoCode: null,

      setPromo: (code) => set({ promoCode: code }),

      canAdd: (restaurantId) => {
        const s = get();
        return s.items.length === 0 || s.restaurantId === restaurantId;
      },

      add: (item, restaurantName) =>
        set((s) => {
          // Cross-restaurant add → start a fresh cart.
          const switching = s.restaurantId != null && s.restaurantId !== item.restaurantId;
          const base = switching ? [] : s.items;
          const existing = base.find((x) => x.id === item.id);
          const items = existing
            ? base.map((x) => (x.id === item.id ? { ...x, qty: x.qty + item.qty } : x))
            : [...base, item];
          return {
            items,
            restaurantId: item.restaurantId,
            restaurantName: restaurantName ?? (switching ? null : s.restaurantName),
          };
        }),

      setQty: (lineId, qty) =>
        set((s) => {
          if (qty <= 0) {
            const items = s.items.filter((x) => x.id !== lineId);
            return items.length === 0
              ? { items, restaurantId: null, restaurantName: null }
              : { items };
          }
          return { items: s.items.map((x) => (x.id === lineId ? { ...x, qty } : x)) };
        }),

      remove: (lineId) =>
        set((s) => {
          const items = s.items.filter((x) => x.id !== lineId);
          return items.length === 0 ? { items, restaurantId: null, restaurantName: null } : { items };
        }),

      clear: () => set({ items: [], restaurantId: null, restaurantName: null, promoCode: null }),

      replace: (items, restaurantId, restaurantName) =>
        set({ items, restaurantId, restaurantName, promoCode: null }),

      count: () => get().items.reduce((n, x) => n + x.qty, 0),
      subtotalMinor: () => get().items.reduce((sum, x) => sum + x.priceMinor * x.qty, 0),
    }),
    {
      name: STORAGE_KEYS.cart,
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist data, not the action functions.
      partialize: (s) => ({
        items: s.items,
        restaurantId: s.restaurantId,
        restaurantName: s.restaurantName,
        promoCode: s.promoCode,
      }),
    },
  ),
);
