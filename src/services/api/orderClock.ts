/**
 * Drives order status forward on a timer (DESIGN-SPEC §6.10). Persists each
 * transition and notifies subscribers so the tracking screen updates without
 * polling. Survives app restarts: on launch, in-flight orders are reconciled to
 * the status implied by elapsed time and remaining transitions are rescheduled.
 */
import type { Order, OrderStatus } from '@/types';
import { loadOrders, updateOrderStatus } from '@/services/storage/orders';

type Step = { at: number; status: OrderStatus }; // `at` = ms after placedAt

// Compressed-for-demo schedule:
// confirmed →(8s)→ preparing →(12s)→ picked_up →(6s)→ on_the_way →(18s)→ delivered
const SCHEDULE: Step[] = [
  { at: 8_000, status: 'preparing' },
  { at: 20_000, status: 'picked_up' },
  { at: 26_000, status: 'on_the_way' },
  { at: 44_000, status: 'delivered' },
];

export const TOTAL_DURATION_MS = SCHEDULE[SCHEDULE.length - 1].at;

const timers = new Map<string, ReturnType<typeof setTimeout>[]>();
const listeners = new Map<string, Set<(status: OrderStatus) => void>>();

function notify(orderId: string, status: OrderStatus) {
  listeners.get(orderId)?.forEach((cb) => cb(status));
}

function applyStatus(orderId: string, status: OrderStatus) {
  void updateOrderStatus(orderId, status);
  notify(orderId, status);
}

/** Status implied by how long ago the order was placed. */
export function statusForElapsed(elapsedMs: number): OrderStatus {
  let status: OrderStatus = 'confirmed';
  for (const step of SCHEDULE) {
    if (elapsedMs >= step.at) status = step.status;
  }
  return status;
}

/** Begin (or resume) advancing an order. Idempotent per order id. */
export function start(order: Pick<Order, 'id' | 'placedAt'>): void {
  stop(order.id);
  const now = Date.now();
  const handles: ReturnType<typeof setTimeout>[] = [];

  const past = SCHEDULE.filter((s) => order.placedAt + s.at <= now);
  const future = SCHEDULE.filter((s) => order.placedAt + s.at > now);

  // Reconcile any transitions that should already have happened.
  if (past.length > 0) {
    applyStatus(order.id, past[past.length - 1].status);
  }
  // Schedule the rest.
  for (const step of future) {
    const wait = order.placedAt + step.at - now;
    handles.push(setTimeout(() => applyStatus(order.id, step.status), wait));
  }
  if (handles.length > 0) timers.set(order.id, handles);
}

/** Subscribe to status changes for an order. Returns an unsubscribe fn. */
export function subscribe(orderId: string, cb: (status: OrderStatus) => void): () => void {
  let set = listeners.get(orderId);
  if (!set) {
    set = new Set();
    listeners.set(orderId, set);
  }
  set.add(cb);
  return () => {
    set?.delete(cb);
    if (set && set.size === 0) listeners.delete(orderId);
  };
}

export function stop(orderId: string): void {
  timers.get(orderId)?.forEach(clearTimeout);
  timers.delete(orderId);
}

/** Clear every running clock (sign-out / cart clear / reset). */
export function stopAll(): void {
  timers.forEach((handles) => handles.forEach(clearTimeout));
  timers.clear();
}

/** On app launch, resume any orders that haven't finished delivering. */
export async function restoreAll(): Promise<void> {
  const orders = await loadOrders();
  for (const o of orders) {
    if (o.status !== 'delivered') start(o);
  }
}
