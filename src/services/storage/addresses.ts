import type { Address } from '@/types';
import { addressSchema } from '@/lib/schemas';
import { addresses as seedAddresses } from '@/mocks';
import { getJSON, setJSON, STORAGE_KEYS } from './kv';

/**
 * Saved delivery addresses. Seeded from mocks on first run so the picker always
 * has options, then user edits persist on top.
 */
export async function loadAddresses(): Promise<Address[]> {
  const raw = await getJSON<unknown[]>(STORAGE_KEYS.addresses, seedAddresses);
  const parsed = addressSchema.array().safeParse(raw);
  return parsed.success && parsed.data.length > 0 ? parsed.data : seedAddresses;
}

export async function saveAddresses(list: Address[]): Promise<void> {
  await setJSON(STORAGE_KEYS.addresses, list);
}

export async function upsertAddress(addr: Address): Promise<Address[]> {
  const all = await loadAddresses();
  const exists = all.some((a) => a.id === addr.id);
  const next = exists ? all.map((a) => (a.id === addr.id ? addr : a)) : [...all, addr];
  await saveAddresses(next);
  return next;
}

export async function removeAddress(id: string): Promise<Address[]> {
  const next = (await loadAddresses()).filter((a) => a.id !== id);
  await saveAddresses(next);
  return next;
}
