/**
 * Mock API — the ONE swap point for a real backend. Every screen reaches data
 * through these typed async functions (via hooks), so replacing this module with
 * a real client (Supabase/Firebase/REST) requires zero screen changes.
 *
 * This is the only place (besides validation) that imports from src/mocks.
 */
import type {
  Category,
  RestaurantDetail,
  MenuSection,
  Order,
  PlaceOrderInput,
  FeedParams,
  Filters,
} from '@/types';
import { restaurants, menusByRestaurant, categories } from '@/mocks';
import { saveOrder, loadOrders, getOrderById } from '@/services/storage/orders';
import * as orderClock from './orderClock';
import { delay, maybeFail } from './delay';

const COURIERS = [
  { name: 'Marcus T.', vehicle: 'E-bike' },
  { name: 'Priya N.', vehicle: 'Scooter' },
  { name: 'Diego R.', vehicle: 'Car' },
  { name: 'Sasha K.', vehicle: 'Bicycle' },
];

function cuisineMatches(haystack: string[], needle: string): boolean {
  const n = needle.toLowerCase();
  return haystack.some((c) => c.toLowerCase().includes(n));
}

function sortFeed<T extends RestaurantDetail>(list: T[], sort?: FeedParams['sort']): T[] {
  const out = [...list];
  if (sort === 'rating') out.sort((a, b) => b.rating - a.rating);
  else if (sort === 'eta') out.sort((a, b) => a.etaMin - b.etaMin);
  else if (sort === 'price') out.sort((a, b) => a.priceLevel - b.priceLevel);
  return out;
}

export const api = {
  async getCategories(): Promise<Category[]> {
    await delay();
    maybeFail();
    return categories;
  },

  async getRestaurants(params?: FeedParams): Promise<RestaurantDetail[]> {
    await delay();
    maybeFail();
    let list = [...restaurants];
    if (params?.cuisine) list = list.filter((r) => cuisineMatches(r.cuisines, params.cuisine!));
    return sortFeed(list, params?.sort);
  },

  async getRestaurant(id: string): Promise<RestaurantDetail> {
    await delay();
    maybeFail();
    const r = restaurants.find((x) => x.id === id);
    if (!r) throw new Error('Restaurant not found');
    return r;
  },

  async getMenu(restaurantId: string): Promise<MenuSection[]> {
    await delay();
    maybeFail();
    return menusByRestaurant[restaurantId] ?? [];
  },

  async searchRestaurants(q: string, filters?: Filters): Promise<RestaurantDetail[]> {
    await delay();
    maybeFail();
    const t = q.trim().toLowerCase();
    let list = restaurants.filter(
      (r) => t === '' || r.name.toLowerCase().includes(t) || cuisineMatches(r.cuisines, t),
    );
    if (filters?.cuisines?.length) {
      list = list.filter((r) => filters.cuisines!.some((c) => cuisineMatches(r.cuisines, c)));
    }
    if (filters?.maxPriceLevel) {
      list = list.filter((r) => r.priceLevel <= filters.maxPriceLevel!);
    }
    return sortFeed(list, filters?.sort);
  },

  async placeOrder(input: PlaceOrderInput): Promise<Order> {
    await delay();
    maybeFail();
    const now = Date.now();
    const r = restaurants.find((x) => x.id === input.restaurantId);
    const courier = COURIERS[Math.floor(Math.random() * COURIERS.length)];
    const order: Order = {
      ...input,
      id: `ord_${now}`,
      status: 'confirmed',
      placedAt: now,
      etaMin: r ? Math.round((r.etaMin + r.etaMax) / 2) : 30,
      courier: { ...courier, etaMin: r?.etaMax ?? 30 },
    };
    await saveOrder(order);
    orderClock.start(order);
    return order;
  },

  async getOrders(): Promise<Order[]> {
    await delay();
    maybeFail();
    return loadOrders();
  },

  async getOrder(id: string): Promise<Order> {
    await delay();
    const o = await getOrderById(id);
    if (!o) throw new Error('Order not found');
    return o;
  },
};

export type Api = typeof api;
export { orderClock };
