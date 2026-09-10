import { z } from 'zod';

/** Loose mock check: accepts anything email-shaped OR phone-shaped. */
export const credentialSchema = z.union([
  z.string().email(),
  z.string().regex(/^\+?[\d\s\-()]{7,}$/, 'Enter a valid phone number'),
]);

export type CredentialKind = 'email' | 'phone';

export function classifyCredential(value: string): CredentialKind {
  return value.includes('@') ? 'email' : 'phone';
}

export function validateCredential(value: string): string | null {
  const result = credentialSchema.safeParse(value.trim());
  if (result.success) return null;
  return 'Enter a valid email or phone number';
}

/** Deterministic-ish mock user id (no real auth). */
export function makeUserId(): string {
  return `user_${Date.now().toString(36)}`;
}
