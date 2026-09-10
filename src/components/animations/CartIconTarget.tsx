import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';
import type { View } from 'react-native';

type Rect = { x: number; y: number; width: number; height: number };

type CartIconTargetValue = {
  /** Register the cart icon view so the fly animation knows its target rect. */
  registerTarget: (node: View | null) => void;
  /** Measure the current cart-icon rect on screen (null if not mounted). */
  measureTarget: () => Promise<Rect | null>;
};

const CartIconTargetContext = createContext<CartIconTargetValue | null>(null);

export function CartIconTargetProvider({ children }: { children: ReactNode }) {
  const ref = useRef<View | null>(null);

  const registerTarget = useCallback((node: View | null) => {
    ref.current = node;
  }, []);

  const measureTarget = useCallback(
    () =>
      new Promise<Rect | null>((resolve) => {
        const node = ref.current;
        if (!node) return resolve(null);
        node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
      }),
    [],
  );

  return (
    <CartIconTargetContext.Provider value={{ registerTarget, measureTarget }}>
      {children}
    </CartIconTargetContext.Provider>
  );
}

/** Safe accessor — returns null outside a provider so components stay usable in isolation. */
export function useCartIconTarget(): CartIconTargetValue | null {
  return useContext(CartIconTargetContext);
}
