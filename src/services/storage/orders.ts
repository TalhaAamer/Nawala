import type { Order, OrderStatus } from '@/types';
import { ordersArraySchema } from '@/lib/schemas';
import { getJSON, setJSON, STORAGE_KEYS } from './kv';

/** Load all persisted orders (newest first), validated against the schema. */
export async function loadOrders(): Promise<Order[]> {
  const raw = await getJSON<unknown[]>(STORAGE_KEYS.orders, []);
  const parsed = ordersArraySchema.safeParse(raw);
  if (!parsed.success) {
    if (__DEV__) console.warn('[storage] orders failed validation, resetting', parsed.error);
    return [];
  }
  return [...parsed.data].sort((a, b) => b.placedAt - a.placedAt);
}

export async function saveOrder(order: Order): Promise<void> {
  const all = await loadOrders();
  const next = [order, ...all.filter((o) => o.id !== order.id)];
  await setJSON(STORAGE_KEYS.orders, next);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const all = await loadOrders();
  let updated: Order | null = null;
  const next = all.map((o) => {
    if (o.id === id) {
      updated = { ...o, status };
      return updated;
    }
    return o;
  });
  if (updated) await setJSON(STORAGE_KEYS.orders, next);
  return updated;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const all = await loadOrders();
  return all.find((o) => o.id === id) ?? null;
}
