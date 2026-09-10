/**
 * Data-fetching hooks over the mock API. Screens import THESE, never the `api`
 * object directly — keeps the backend swap surface to src/services/api alone.
 *
 * Manual {data, loading, error, refetch} wrappers (TanStack Query optional later).
 */
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/services/api';
import type {
  Category,
  RestaurantDetail,
  MenuSection,
  Order,
  FeedParams,
  Filters,
} from '@/types';

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

/** Generic query hook. `deps` controls when the query re-runs. */
function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: Error | null }>({
    data: null,
    loading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    // Reset to loading on each (re)fetch. This synchronous reset is the intended
    // shape of a fetch effect; the async resolutions below settle it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((res) => {
        if (active) setState({ data: res, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (active)
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          }));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, refetch };
}

export function useCategories(): AsyncState<Category[]> {
  return useAsync(() => api.getCategories(), []);
}

export function useRestaurants(params?: FeedParams): AsyncState<RestaurantDetail[]> {
  return useAsync(() => api.getRestaurants(params), [params?.sort, params?.cuisine]);
}

export function useRestaurant(id: string): AsyncState<RestaurantDetail> {
  return useAsync(() => api.getRestaurant(id), [id]);
}

export function useMenu(restaurantId: string): AsyncState<MenuSection[]> {
  return useAsync(() => api.getMenu(restaurantId), [restaurantId]);
}

export function useSearchRestaurants(query: string, filters?: Filters): AsyncState<RestaurantDetail[]> {
  return useAsync(
    () => api.searchRestaurants(query, filters),
    [query, filters?.sort, filters?.maxPriceLevel, filters?.cuisines?.join(',')],
  );
}

export function useOrders(): AsyncState<Order[]> {
  return useAsync(() => api.getOrders(), []);
}

export function useOrder(id: string): AsyncState<Order> {
  return useAsync(() => api.getOrder(id), [id]);
}
