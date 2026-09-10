import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemedStyles } from '@/theme';
import { EmptyState } from '@/components';

export default function NotFound() {
  const styles = useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg, justifyContent: 'center' as const },
  }));
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="help-buoy-outline"
          title="Page not found"
          message="That screen doesn’t exist."
          actionLabel="Go home"
          onAction={() => router.replace('/(tabs)')}
        />
      </SafeAreaView>
    </>
  );
}
