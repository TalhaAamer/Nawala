import type { MenuSection, MenuItem, OptionGroup } from '@/types';
import { dishImages } from './images';
import { blurhashFor } from './blurhashes';
import { menuBucketByRestaurant, restaurants } from './restaurants';

/**
 * Menus are authored as compact per-cuisine pools and assembled by a deterministic
 * builder that fills ids/images/currency/blurhash. No Math.random / Date.now —
 * images cycle by index so the same restaurant always renders identically.
 */

// ── Reusable option groups ───────────────────────────────────────────────────
const SIZE: OptionGroup = {
  id: 'size',
  title: 'Choose a size',
  type: 'radio',
  required: true,
  options: [
    { id: 'sm', label: 'Small', priceDeltaMinor: 0 },
    { id: 'md', label: 'Medium', priceDeltaMinor: 200 },
    { id: 'lg', label: 'Large', priceDeltaMinor: 400 },
  ],
};

const ADDONS: OptionGroup = {
  id: 'addons',
  title: 'Add extras',
  type: 'checkbox',
  options: [
    { id: 'cheese', label: 'Extra cheese', priceDeltaMinor: 150 },
    { id: 'bacon', label: 'Bacon', priceDeltaMinor: 250 },
    { id: 'avocado', label: 'Avocado', priceDeltaMinor: 200 },
    { id: 'egg', label: 'Fried egg', priceDeltaMinor: 175 },
  ],
};

const SPICE: OptionGroup = {
  id: 'spice',
  title: 'Spice level',
  type: 'radio',
  required: true,
  options: [
    { id: 'mild', label: 'Mild', priceDeltaMinor: 0 },
    { id: 'medium', label: 'Medium', priceDeltaMinor: 0 },
    { id: 'hot', label: 'Thai hot', priceDeltaMinor: 0 },
  ],
};

const OPTION_PRESETS = {
  full: [SIZE, ADDONS], // size radio + add-ons checkbox (exercises the item modal)
  size: [SIZE],
  addons: [ADDONS],
  spice: [SPICE],
  spiceFull: [SPICE, ADDONS],
} as const;

type Opt = keyof typeof OPTION_PRESETS;
type Dish = { n: string; d: string; p: number; pop?: boolean; opt?: Opt };
type SectionSeed = { title: string; imgBucket?: string; items: Dish[] };

// ── Per-cuisine menus ────────────────────────────────────────────────────────
const MENUS: Record<string, SectionSeed[]> = {
  pizza: [
    {
      title: 'Most Ordered',
      items: [
        { n: 'Margherita', d: 'San Marzano tomato, fresh mozzarella, basil', p: 1499, pop: true, opt: 'full' },
        { n: 'Pepperoni', d: 'Cup-and-char pepperoni, aged mozzarella', p: 1699, pop: true, opt: 'full' },
        { n: 'Garlic Knots (6)', d: 'Butter, parmesan, marinara dip', p: 699, opt: 'addons' },
      ],
    },
    {
      title: 'Signature Pies',
      items: [
        { n: 'Diavola', d: 'Spicy salami, chili, honey drizzle', p: 1899, opt: 'full' },
        { n: 'Quattro Formaggi', d: 'Mozzarella, gorgonzola, fontina, parmesan', p: 1999, opt: 'size' },
        { n: 'Funghi', d: 'Wild mushrooms, taleggio, thyme', p: 1849, opt: 'size' },
        { n: 'Hawaiian', d: 'Pineapple, smoked ham, jalapeño', p: 1749 },
      ],
    },
    {
      title: 'Sides & Salads',
      items: [
        { n: 'Caesar Salad', d: 'Romaine, croutons, parmesan, anchovy dressing', p: 999 },
        { n: 'Meatballs (4)', d: 'Beef-pork blend, sugo, ricotta', p: 1199, pop: true },
      ],
    },
    {
      title: 'Drinks',
      imgBucket: 'drinks',
      items: [
        { n: 'San Pellegrino', d: 'Sparkling, 500ml', p: 399 },
        { n: 'Italian Soda', d: 'Blood orange', p: 449 },
      ],
    },
  ],
  sushi: [
    {
      title: 'Chef’s Picks',
      items: [
        { n: 'Omakase Nigiri (8)', d: 'Daily selection, chef’s choice', p: 3200, pop: true, opt: 'size' },
        { n: 'Dragon Roll', d: 'Eel, avocado, cucumber, unagi glaze', p: 1699, pop: true },
        { n: 'Spicy Tuna Roll', d: 'Tuna, sriracha aioli, scallion', p: 1299, pop: true },
      ],
    },
    {
      title: 'Nigiri & Sashimi',
      items: [
        { n: 'Salmon Nigiri (2)', d: 'Scottish salmon', p: 799 },
        { n: 'Otoro (2)', d: 'Fatty bluefin tuna belly', p: 1899 },
        { n: 'Hamachi Sashimi (5)', d: 'Yellowtail, yuzu kosho', p: 1599 },
        { n: 'Ikura (2)', d: 'Salmon roe, gunkan', p: 999 },
      ],
    },
    {
      title: 'From the Kitchen',
      items: [
        { n: 'Edamame', d: 'Sea salt or spicy garlic', p: 599, opt: 'spice' },
        { n: 'Miso Soup', d: 'Tofu, wakame, scallion', p: 499 },
        { n: 'Agedashi Tofu', d: 'Crispy tofu, dashi broth', p: 899 },
      ],
    },
  ],
  burger: [
    {
      title: 'Most Ordered',
      items: [
        { n: 'The Classic Smash', d: 'Double patty, American cheese, house sauce', p: 1299, pop: true, opt: 'full' },
        { n: 'Bacon Cheeseburger', d: 'Smoked bacon, cheddar, pickles', p: 1499, pop: true, opt: 'full' },
        { n: 'Crispy Fries', d: 'Sea salt, double-cooked', p: 499, opt: 'size' },
      ],
    },
    {
      title: 'Burgers',
      items: [
        { n: 'Mushroom Swiss', d: 'Caramelized onion, swiss, garlic aioli', p: 1399, opt: 'full' },
        { n: 'Spicy Jalapeño', d: 'Pepper jack, jalapeño, chipotle mayo', p: 1449, opt: 'spiceFull' },
        { n: 'Veggie Smash', d: 'Black bean patty, avocado, sprouts', p: 1349, opt: 'addons' },
      ],
    },
    {
      title: 'Sides & Shakes',
      imgBucket: 'dessert',
      items: [
        { n: 'Loaded Tots', d: 'Cheese sauce, bacon, scallion', p: 699, pop: true },
        { n: 'Vanilla Shake', d: 'Hand-spun, real ice cream', p: 599, opt: 'size' },
        { n: 'Onion Rings', d: 'Beer-battered, ranch', p: 549 },
      ],
    },
  ],
  breakfast: [
    {
      title: 'Most Ordered',
      items: [
        { n: 'Buttermilk Pancakes', d: 'Stack of 3, maple butter', p: 1199, pop: true, opt: 'addons' },
        { n: 'Avocado Toast', d: 'Sourdough, chili flakes, poached egg', p: 1099, pop: true },
        { n: 'Breakfast Burrito', d: 'Eggs, cheddar, potato, salsa', p: 1299, pop: true, opt: 'addons' },
      ],
    },
    {
      title: 'Eggs & Scrambles',
      items: [
        { n: 'Farmhouse Scramble', d: 'Three eggs, bacon, toast', p: 1399, opt: 'addons' },
        { n: 'Eggs Benedict', d: 'English muffin, ham, hollandaise', p: 1499 },
        { n: 'Veggie Omelette', d: 'Spinach, mushroom, feta', p: 1349 },
      ],
    },
    {
      title: 'Coffee & Juice',
      imgBucket: 'coffee',
      items: [
        { n: 'Drip Coffee', d: 'Bottomless, locally roasted', p: 399, opt: 'size' },
        { n: 'Fresh OJ', d: 'Cold-pressed', p: 549 },
      ],
    },
  ],
  healthy: [
    {
      title: 'Signature Bowls',
      items: [
        { n: 'Harvest Grain Bowl', d: 'Quinoa, roasted veg, tahini', p: 1399, pop: true, opt: 'addons' },
        { n: 'Poke Bowl', d: 'Ahi tuna, edamame, sushi rice', p: 1599, pop: true, opt: 'addons' },
        { n: 'Chicken Caesar', d: 'Grilled chicken, kale, parmesan', p: 1299 },
      ],
    },
    {
      title: 'Salads & Wraps',
      items: [
        { n: 'Cobb Salad', d: 'Egg, avocado, bacon, blue cheese', p: 1349 },
        { n: 'Mediterranean Wrap', d: 'Falafel, hummus, pickled veg', p: 1199 },
        { n: 'Superfood Salad', d: 'Beet, goat cheese, walnut', p: 1249, pop: true },
      ],
    },
    {
      title: 'Cold-Pressed Juice',
      imgBucket: 'drinks',
      items: [
        { n: 'Green Machine', d: 'Kale, apple, ginger, lemon', p: 799, opt: 'size' },
        { n: 'Citrus Immunity', d: 'Orange, carrot, turmeric', p: 799 },
      ],
    },
  ],
  dessert: [
    {
      title: 'Most Loved',
      items: [
        { n: 'Warm Cookie Skillet', d: 'Chocolate chip, vanilla soft-serve', p: 899, pop: true, opt: 'addons' },
        { n: 'Tiramisu', d: 'Espresso-soaked ladyfingers, mascarpone', p: 799, pop: true },
        { n: 'Funfetti Cake Slice', d: 'Vanilla buttercream', p: 699 },
      ],
    },
    {
      title: 'Soft-Serve Sundaes',
      items: [
        { n: 'Classic Sundae', d: 'Soft-serve, hot fudge, sprinkles', p: 649, opt: 'size' },
        { n: 'Brownie Sundae', d: 'Fudge brownie, caramel, pecans', p: 849, pop: true },
        { n: 'Affogato', d: 'Vanilla gelato, espresso shot', p: 599 },
      ],
    },
    {
      title: 'Cookies by the Box',
      items: [
        { n: 'Cookie Box (6)', d: 'Assorted, baked fresh', p: 1499 },
        { n: 'Double Chocolate (4)', d: 'Gooey center', p: 1099 },
      ],
    },
  ],
  coffee: [
    {
      title: 'Espresso Bar',
      items: [
        { n: 'Cappuccino', d: 'Double shot, velvety microfoam', p: 499, pop: true, opt: 'size' },
        { n: 'Oat Latte', d: 'House oat milk, single-origin', p: 599, pop: true, opt: 'size' },
        { n: 'Cortado', d: 'Equal parts espresso and milk', p: 449 },
      ],
    },
    {
      title: 'Pour-Over & Cold',
      items: [
        { n: 'Pour-Over', d: 'Rotating single origin', p: 549, opt: 'size' },
        { n: 'Cold Brew', d: '18-hour steep, smooth', p: 549, pop: true, opt: 'size' },
        { n: 'Iced Matcha', d: 'Ceremonial grade, oat milk', p: 599 },
      ],
    },
    {
      title: 'Pastries',
      imgBucket: 'dessert',
      items: [
        { n: 'Butter Croissant', d: 'Laminated, flaky', p: 399 },
        { n: 'Almond Danish', d: 'Frangipane, sliced almonds', p: 449 },
      ],
    },
  ],
  grocery: [
    {
      title: 'Fresh Produce',
      items: [
        { n: 'Bananas (bunch)', d: 'Organic, ~5 ct', p: 199, pop: true },
        { n: 'Avocados (3)', d: 'Hass, ripe', p: 499, pop: true },
        { n: 'Baby Spinach', d: 'Triple-washed, 5 oz', p: 399 },
        { n: 'Strawberries', d: '1 lb, sweet', p: 549 },
      ],
    },
    {
      title: 'Pantry',
      items: [
        { n: 'Sourdough Loaf', d: 'Baked daily', p: 599 },
        { n: 'Free-Range Eggs (12)', d: 'Grade A large', p: 549, pop: true },
        { n: 'Olive Oil 500ml', d: 'Cold-pressed extra virgin', p: 1299 },
      ],
    },
    {
      title: 'Household',
      items: [
        { n: 'Paper Towels (6)', d: 'Select-a-size', p: 999 },
        { n: 'Dish Soap', d: 'Lemon, 24 oz', p: 449 },
      ],
    },
  ],
  tacos: [
    {
      title: 'Most Ordered',
      items: [
        { n: 'Al Pastor Tacos (3)', d: 'Marinated pork, pineapple, onion, cilantro', p: 999, pop: true, opt: 'spice' },
        { n: 'Super Burrito', d: 'Carne asada, rice, beans, guac, cheese', p: 1299, pop: true, opt: 'spiceFull' },
        { n: 'Chips & Guac', d: 'Fresh-made guacamole', p: 699, pop: true },
      ],
    },
    {
      title: 'Tacos',
      items: [
        { n: 'Carnitas Tacos (3)', d: 'Slow-cooked pork, salsa verde', p: 1049, opt: 'spice' },
        { n: 'Baja Fish Tacos (2)', d: 'Beer-battered, cabbage slaw', p: 1149, opt: 'spice' },
        { n: 'Veggie Tacos (3)', d: 'Grilled nopales, mushroom', p: 949 },
      ],
    },
    {
      title: 'Sides & Drinks',
      imgBucket: 'drinks',
      items: [
        { n: 'Elote', d: 'Grilled corn, cotija, lime', p: 549 },
        { n: 'Horchata', d: 'Cinnamon rice milk', p: 449, opt: 'size' },
      ],
    },
  ],
  thai: [
    {
      title: 'Most Ordered',
      items: [
        { n: 'Pad Thai', d: 'Rice noodles, tamarind, peanut, egg', p: 1399, pop: true, opt: 'spiceFull' },
        { n: 'Green Curry', d: 'Coconut, bamboo, Thai basil', p: 1499, pop: true, opt: 'spice' },
        { n: 'Crispy Spring Rolls (4)', d: 'Sweet chili dip', p: 699 },
      ],
    },
    {
      title: 'Curries & Noodles',
      items: [
        { n: 'Drunken Noodles', d: 'Wide noodles, chili, holy basil', p: 1449, opt: 'spice' },
        { n: 'Massaman Curry', d: 'Potato, peanut, tender beef', p: 1599 },
        { n: 'Pad See Ew', d: 'Wide noodles, Chinese broccoli', p: 1349, opt: 'spice' },
      ],
    },
    {
      title: 'Salads & Sides',
      items: [
        { n: 'Papaya Salad', d: 'Green papaya, lime, chili, peanut', p: 999, pop: true, opt: 'spice' },
        { n: 'Tom Yum Soup', d: 'Hot-and-sour shrimp', p: 1099, opt: 'spice' },
      ],
    },
  ],
  indian: [
    {
      title: 'Most Ordered',
      items: [
        { n: 'Chicken Tikka Masala', d: 'Creamy tomato, fenugreek', p: 1599, pop: true, opt: 'spiceFull' },
        { n: 'Garlic Naan', d: 'Tandoor-baked, brushed with ghee', p: 399, pop: true },
        { n: 'Samosas (2)', d: 'Spiced potato, peas, tamarind', p: 599, pop: true },
      ],
    },
    {
      title: 'Curries',
      items: [
        { n: 'Butter Chicken', d: 'Rich tomato-butter gravy', p: 1649, opt: 'spice' },
        { n: 'Palak Paneer', d: 'Spinach, house cheese', p: 1399, opt: 'spice' },
        { n: 'Lamb Rogan Josh', d: 'Kashmiri chili, yogurt', p: 1799, opt: 'spice' },
        { n: 'Chana Masala', d: 'Chickpea, ginger, tomato', p: 1249 },
      ],
    },
    {
      title: 'Rice & Bread',
      items: [
        { n: 'Lamb Biryani', d: 'Basmati, saffron, fried onion', p: 1699, pop: true, opt: 'spice' },
        { n: 'Butter Naan', d: 'Soft, buttery', p: 349 },
      ],
    },
  ],
  mediterranean: [
    {
      title: 'Most Ordered',
      items: [
        { n: 'Chicken Shawarma Plate', d: 'Rice, salad, garlic toum', p: 1499, pop: true, opt: 'spiceFull' },
        { n: 'Falafel Wrap', d: 'Crispy falafel, hummus, pickles', p: 1099, pop: true },
        { n: 'Hummus & Pita', d: 'Olive oil, za’atar, warm pita', p: 799, pop: true },
      ],
    },
    {
      title: 'Grill',
      items: [
        { n: 'Lamb Kofta', d: 'Charcoal-grilled, sumac onion', p: 1649, opt: 'spice' },
        { n: 'Chicken Souvlaki', d: 'Skewers, tzatziki', p: 1449 },
        { n: 'Mixed Grill', d: 'Kofta, chicken, lamb', p: 1999, opt: 'spice' },
      ],
    },
    {
      title: 'Mezze',
      items: [
        { n: 'Baba Ganoush', d: 'Smoky eggplant, tahini', p: 849 },
        { n: 'Tabbouleh', d: 'Parsley, bulgur, lemon', p: 749 },
      ],
    },
  ],
  ramen: [
    {
      title: 'Signature Ramen',
      items: [
        { n: 'Tonkotsu Ramen', d: '20-hour pork broth, chashu, egg', p: 1599, pop: true, opt: 'spiceFull' },
        { n: 'Spicy Miso Ramen', d: 'Miso tare, chili oil, corn', p: 1649, pop: true, opt: 'spice' },
        { n: 'Shoyu Ramen', d: 'Soy-based clear broth, bamboo', p: 1549 },
      ],
    },
    {
      title: 'Small Plates',
      items: [
        { n: 'Pork Gyoza (5)', d: 'Pan-fried dumplings, ponzu', p: 799, pop: true },
        { n: 'Karaage', d: 'Japanese fried chicken, lemon', p: 899 },
        { n: 'Takoyaki (6)', d: 'Octopus balls, bonito', p: 849 },
      ],
    },
    {
      title: 'Extras',
      items: [
        { n: 'Ajitama Egg', d: 'Soft-marinated, jammy yolk', p: 250 },
        { n: 'Extra Chashu', d: 'Braised pork belly', p: 450 },
      ],
    },
  ],
  bbq: [
    {
      title: 'Most Ordered',
      items: [
        { n: 'Brisket Plate', d: '½ lb smoked brisket, two sides', p: 1899, pop: true, opt: 'addons' },
        { n: 'Pulled Pork Sandwich', d: 'Brioche bun, slaw, pickles', p: 1299, pop: true },
        { n: 'Baby Back Ribs', d: 'Full rack, house rub', p: 2499, pop: true, opt: 'addons' },
      ],
    },
    {
      title: 'Plates & Combos',
      items: [
        { n: 'Smoked Half Chicken', d: 'Two sides, cornbread', p: 1599 },
        { n: 'The Pitmaster Combo', d: 'Brisket, ribs, sausage, two sides', p: 2899, opt: 'addons' },
        { n: 'Hot Links (2)', d: 'Smoked beef sausage', p: 1199, opt: 'spice' },
      ],
    },
    {
      title: 'Sides',
      items: [
        { n: 'Mac & Cheese', d: 'Three-cheese, crispy top', p: 599, pop: true },
        { n: 'Baked Beans', d: 'Burnt ends, molasses', p: 499 },
        { n: 'Cornbread', d: 'Honey butter', p: 399 },
      ],
    },
  ],
};

function buildItem(
  restaurantId: string,
  bucket: string,
  section: SectionSeed,
  dish: Dish,
  sIdx: number,
  iIdx: number,
): MenuItem {
  const pool = dishImages[section.imgBucket ?? bucket] ?? dishImages[bucket] ?? dishImages.healthy;
  const image = pool[(sIdx + iIdx) % pool.length];
  return {
    id: `${restaurantId}_s${sIdx}_i${iIdx}`,
    name: dish.n,
    description: dish.d,
    priceMinor: dish.p,
    currency: 'USD',
    image,
    blurhash: blurhashFor(image),
    popular: dish.pop,
    optionGroups: dish.opt ? [...OPTION_PRESETS[dish.opt]] : undefined,
  };
}

function buildMenu(restaurantId: string, bucket: string): MenuSection[] {
  const seeds = MENUS[bucket] ?? MENUS.healthy;
  return seeds.map((section, sIdx) => ({
    id: `${restaurantId}_sec${sIdx}`,
    title: section.title,
    items: section.items.map((dish, iIdx) => buildItem(restaurantId, bucket, section, dish, sIdx, iIdx)),
  }));
}

/** restaurantId -> menu sections, for every seeded restaurant. */
export const menusByRestaurant: Record<string, MenuSection[]> = Object.fromEntries(
  restaurants.map((r) => [r.id, buildMenu(r.id, menuBucketByRestaurant[r.id] ?? 'healthy')]),
);
