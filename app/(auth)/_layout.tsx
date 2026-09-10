import { Stack } from 'expo-router';

/**
 * Auth group. No blanket redirect here: a guest (who already has a session) must
 * still be able to reach sign-in to upgrade. The "no session at all" redirect to
 * welcome lives in (tabs)/_layout.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
