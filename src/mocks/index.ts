/**
 * Seed data barrel. In dev, validates the data once at module load so a typo
 * surfaces immediately rather than as a confusing render error downstream.
 *
 * NOTE: only the mock API (src/services/api) and validation/tests import this.
 * Components/screens never import from src/mocks directly.
 */
import { categories } from './categories';
import { restaurants } from './restaurants';
import { menusByRestaurant } from './menus';
import { addresses } from './addresses';
import {
  categorySchema,
  restaurantDetailSchema,
  menuSectionSchema,
  addressSchema,
} from '@/lib/schemas';

export { categories } from './categories';
export { restaurants, menuBucketByRestaurant } from './restaurants';
export { menusByRestaurant } from './menus';
export { addresses, defaultAddressId } from './addresses';

if (__DEV__) {
  try {
    categorySchema.array().parse(categories);
    restaurantDetailSchema.array().parse(restaurants);
    addressSchema.array().parse(addresses);
    for (const r of restaurants) {
      const menu = menusByRestaurant[r.id];
      if (!menu || menu.length === 0) {
        throw new Error(`Restaurant "${r.id}" has no menu`);
      }
      menuSectionSchema.array().parse(menu);
    }
  } catch (err) {
    // Fail loud in dev — bad seed data should never reach the UI.
    console.error('[mocks] Seed data validation failed:', err);
    throw err;
  }
}
