/**
 * Simulated network latency + optional failure injection for the mock API.
 * Toggle errors at runtime with: (globalThis as any).__simulateErrors = true
 */

/** Resolve after a random 300–800ms (configurable) to mimic a network round-trip. */
export function delay(min = 300, max = 800): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Throw ~20% of the time when error simulation is enabled, to exercise UI error states. */
export function maybeFail(): void {
  if ((globalThis as { __simulateErrors?: boolean }).__simulateErrors && Math.random() < 0.2) {
    throw new Error('network');
  }
}
