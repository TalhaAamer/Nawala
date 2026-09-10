/**
 * Helpers for turning a customized menu item into a cart line. Pure functions so
 * the same selection always produces the same line id (identical lines merge).
 */
import type { CartItem, MenuItem, OptionGroup } from '@/types';

export type Selection = Record<string, string[]>; // groupId -> selected option ids

/** Unit price = base + sum of selected option deltas. */
export function unitPriceMinor(item: MenuItem, selection: Selection): number {
  let total = item.priceMinor;
  for (const group of item.optionGroups ?? []) {
    const picked = selection[group.id] ?? [];
    for (const opt of group.options) {
      if (picked.includes(opt.id)) total += opt.priceDeltaMinor;
    }
  }
  return total;
}

/** "Large · Extra cheese, Bacon" from the selection. */
export function optionsSummary(item: MenuItem, selection: Selection): string {
  const labels: string[] = [];
  for (const group of item.optionGroups ?? []) {
    const picked = selection[group.id] ?? [];
    for (const opt of group.options) {
      if (picked.includes(opt.id)) labels.push(opt.label);
    }
  }
  return labels.join(' · ');
}

/** Stable line id: same item + same options + same notes => same id (so they merge). */
export function cartLineId(itemId: string, selection: Selection, notes?: string): string {
  const sig = Object.keys(selection)
    .sort()
    .map((g) => `${g}:${[...selection[g]].sort().join('+')}`)
    .join('|');
  return `${itemId}#${sig}${notes ? `#${notes}` : ''}`;
}

/** True when every required option group has at least one selection. */
export function selectionComplete(groups: OptionGroup[] | undefined, selection: Selection): boolean {
  if (!groups) return true;
  return groups.every((g) => !g.required || (selection[g.id]?.length ?? 0) > 0);
}

/** Build a CartItem from a menu item + selection + quantity. */
export function buildCartItem(
  item: MenuItem,
  restaurantId: string,
  selection: Selection,
  qty: number,
  notes?: string,
): CartItem {
  return {
    id: cartLineId(item.id, selection, notes),
    itemId: item.id,
    restaurantId,
    name: item.name,
    priceMinor: unitPriceMinor(item, selection),
    qty,
    options: Object.keys(selection).length ? selection : undefined,
    optionsSummary: optionsSummary(item, selection) || undefined,
    notes,
    image: item.image,
    blurhash: item.blurhash,
  };
}
