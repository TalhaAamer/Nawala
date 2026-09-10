import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useSession } from '@/store/session';

/**
 * Gate a route behind a real (non-guest) session. Runs INSIDE the protected
 * route so deep links still resolve to the right screen after sign-in.
 * Guests + signed-out users are bounced to sign-in with a reason.
 *
 * Returns whether access is allowed, so the screen can render a placeholder
 * while the redirect happens.
 */
export function useAuthGate(reason: string = 'checkout'): { allowed: boolean } {
  const user = useSession((s) => s.user);
  const router = useRouter();
  const allowed = user?.kind === 'user';

  useEffect(() => {
    if (!allowed) {
      router.replace({ pathname: '/(auth)/sign-in', params: { reason } });
    }
  }, [allowed, reason, router]);

  return { allowed };
}
