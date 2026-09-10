import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/services/storage/kv';

type FavoritesState = {
  ids: string[];
  hydrated: boolean;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
};

/** Reactive favorites (restaurant ids), persisted to crave/favorites. */
export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,
      isFavorite: (id) => get().ids.includes(id),
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
    }),
    {
      name: STORAGE_KEYS.favorites,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ ids: s.ids }),
      onRehydrateStorage: () => () => {
        useFavorites.setState({ hydrated: true });
      },
    },
  ),
);
