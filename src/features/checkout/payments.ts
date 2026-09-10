/**
 * Mock payment methods (demo only — never real card data). Feature-level UI
 * options, not backend data, so screens may import these directly.
 */
export type MockCard = { id: string; label: string; brand: string; icon: 'card' };

export const mockCards: MockCard[] = [
  { id: 'visa', label: '•••• 4242', brand: 'Visa', icon: 'card' },
  { id: 'mc', label: '•••• 5555', brand: 'Mastercard', icon: 'card' },
  { id: 'amex', label: '•••• 0005', brand: 'Amex', icon: 'card' },
];

export const defaultCardId = mockCards[0].id;
