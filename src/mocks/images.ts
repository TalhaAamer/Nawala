/**
 * Central image URLs for seed data.
 * Source: Unsplash (royalty-free, https://unsplash.com/license). Photos are
 * referenced by stable photo IDs with a width param. If any URL fails to load,
 * expo-image keeps the blurhash placeholder visible (see blurhashes.ts), so the
 * app still works offline / on flaky networks.
 */

const W = 'auto=format&fit=crop&w=800&q=70';
const u = (id: string) => `https://images.unsplash.com/photo-${id}?${W}`;

/** Restaurant hero images, keyed by restaurant id. */
export const heroImages: Record<string, string> = {
  r_pizza: u('1513104890138-7c749659a591'),
  r_sushi: u('1579584425555-c3ce17fd4351'),
  r_burger: u('1568901346375-23c9450c58cd'),
  r_breakfast: u('1525351484163-7529414344d8'),
  r_healthy: u('1512621776951-a57141f2eefd'),
  r_dessert: u('1551024601-bec78aea704b'),
  r_coffee: u('1554118811-1e0d58224f24'),
  r_grocery: u('1542838132-92c53300491e'),
  r_tacos: u('1565299624946-b28f40a0ae38'),
  r_thai: u('1559314809-0d155014e29e'),
  r_indian: u('1585937421612-70a008356fbe'),
  r_mediterranean: u('1540420773420-3366772f4999'),
  r_ramen: u('1569718212165-3a8278d5f624'),
  r_bbq: u('1529193591184-b1d58069ecdd'),
};

/** Dish photo pools per cuisine bucket. Items pick deterministically from these. */
export const dishImages: Record<string, string[]> = {
  pizza: [u('1513104890138-7c749659a591'), u('1565299624946-b28f40a0ae38'), u('1574071318508-1cdbab80d002')],
  sushi: [u('1579584425555-c3ce17fd4351'), u('1583623025817-d180a2221d0a'), u('1611143669185-af224c5e3252')],
  burger: [u('1568901346375-23c9450c58cd'), u('1550547660-d9450f859349'), u('1571091718767-18b5b1457add')],
  breakfast: [u('1525351484163-7529414344d8'), u('1484723091739-30a097e8f929'), u('1528207776546-365bb710ee93')],
  healthy: [u('1512621776951-a57141f2eefd'), u('1546069901-ba9599a7e63c'), u('1540420773420-3366772f4999')],
  dessert: [u('1551024601-bec78aea704b'), u('1488477181946-6428a0291777'), u('1565958011703-44f9829ba187')],
  coffee: [u('1554118811-1e0d58224f24'), u('1509042239860-f550ce710b93'), u('1461023058943-07fcbe16d735')],
  grocery: [u('1542838132-92c53300491e'), u('1583258292688-d0213dc5a3a8'), u('1604719312566-8912e9227c6a')],
  tacos: [u('1565299624946-b28f40a0ae38'), u('1551504734-5ee1c4a1479b'), u('1599974579688-8dbdd335c77f')],
  thai: [u('1559314809-0d155014e29e'), u('1562565652-a0d8f0c59eb4'), u('1455619452474-d2be8b1e70cd')],
  indian: [u('1585937421612-70a008356fbe'), u('1567188040759-fb8a883dc6d8'), u('1631292784640-2b24be784d5d')],
  mediterranean: [u('1540420773420-3366772f4999'), u('1544510808-5e41d03e8b46'), u('1505253716362-afaea1d3d1af')],
  ramen: [u('1569718212165-3a8278d5f624'), u('1557872943-16a5ac26437e'), u('1591814468924-caf88d1232e1')],
  bbq: [u('1529193591184-b1d58069ecdd'), u('1544025162-d76694265947'), u('1558030006-450675393462')],
  drinks: [u('1437418747212-8d9709afab22'), u('1556679343-c7306c1976bc'), u('1622483767028-3f66f32aef97')],
};
