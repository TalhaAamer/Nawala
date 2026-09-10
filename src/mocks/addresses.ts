import type { Address } from '@/types';

/** Seed delivery addresses for the mock onboarding picker + checkout. */
export const addresses: Address[] = [
  { id: 'addr_home', label: 'Home', line1: '123 Market St, Apt 5B', city: 'San Francisco', state: 'CA', zip: '94103' },
  { id: 'addr_work', label: 'Work', line1: '500 Howard St, Floor 12', city: 'San Francisco', state: 'CA', zip: '94105' },
  { id: 'addr_friend', label: 'Friend’s place', line1: '88 King St, Unit 3', city: 'San Francisco', state: 'CA', zip: '94107' },
];

export const defaultAddressId = addresses[0].id;
