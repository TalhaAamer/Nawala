import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/services/storage/kv';
import { defaultAddressId } from '@/mocks';

export type SessionUser =
  | { kind: 'guest' }
  | { kind: 'user'; id: string; email?: string; phone?: string };

type SessionState = {
  user: SessionUser | null;
  selectedAddressId: string | null;
  /** True once persisted session has rehydrated (gates splash + first paint). */
  hydrated: boolean;
  signIn: (payload: { id: string; email?: string; phone?: string }) => void;
  continueAsGuest: () => void;
  signOut: () => void;
  setAddress: (id: string) => void;
  isAuthed: () => boolean;
};

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      selectedAddressId: defaultAddressId,
      hydrated: false,

      signIn: ({ id, email, phone }) => set({ user: { kind: 'user', id, email, phone } }),
      continueAsGuest: () => set({ user: { kind: 'guest' } }),
      signOut: () => set({ user: null }),
      setAddress: (id) => set({ selectedAddressId: id }),
      // A real (non-guest) signed-in user.
      isAuthed: () => get().user?.kind === 'user',
    }),
    {
      name: STORAGE_KEYS.session,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user, selectedAddressId: s.selectedAddressId }),
      // Runs after persisted state is restored (or fails) — flip the gate.
      onRehydrateStorage: () => () => {
        useSession.setState({ hydrated: true });
      },
    },
  ),
);
