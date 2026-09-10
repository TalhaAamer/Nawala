/**
 * Blurhash placeholders. expo-image shows these instantly and keeps them visible
 * if the remote photo never loads — so the app degrades gracefully offline.
 *
 * We use a small palette of valid warm-food blurhashes and assign one
 * deterministically per URL (stable string hash → no Math.random).
 */

const PALETTE = [
  'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
  'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
  'L9AB*A%M00xu_3Rj%MM{IUofWBay',
  'LlMtX?of%Mof~qj[ayj[ayfQayfQ',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Deterministic blurhash for any image URL. */
export function blurhashFor(url: string): string {
  return PALETTE[hashString(url) % PALETTE.length];
}
