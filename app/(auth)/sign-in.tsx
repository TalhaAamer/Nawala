import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme, useThemedStyles } from '@/theme';
import { Button, PressableScale } from '@/components';
import { useSession } from '@/store/session';
import { validateCredential, classifyCredential, makeUserId } from '@/features/auth/validators';

export default function SignIn() {
  const { theme } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const signIn = useSession((s) => s.signIn);
  const continueAsGuest = useSession((s) => s.continueAsGuest);

  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const error = touched ? validateCredential(value) : null;

  const onContinue = () => {
    setTouched(true);
    if (validateCredential(value)) return;
    const kind = classifyCredential(value.trim());
    signIn({
      id: makeUserId(),
      email: kind === 'email' ? value.trim() : undefined,
      phone: kind === 'phone' ? value.trim() : undefined,
    });
    router.replace('/(tabs)');
  };

  const onGuest = () => {
    continueAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <PressableScale
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.back}
            hitSlop={8}
            noAnimation
          >
            <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
          </PressableScale>

          <Text style={styles.title}>Welcome to Crave</Text>
          <Text style={styles.subtitle}>
            {reason === 'checkout'
              ? 'Sign in to place your order and track delivery.'
              : 'Enter your email or phone to get started.'}
          </Text>

          <View style={styles.field}>
            <TextInput
              value={value}
              onChangeText={setValue}
              onBlur={() => setTouched(true)}
              placeholder="Email or phone number"
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={[styles.input, error && styles.inputError]}
              accessibilityLabel="Email or phone number"
              returnKeyType="go"
              onSubmitEditing={onContinue}
            />
            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}
          </View>

          <Button label="Continue" onPress={onContinue} />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>

          <Button label="Continue with Apple" icon="logo-apple" variant="secondary" disabled onPress={() => {}} />
          <Button label="Continue with Google" icon="logo-google" variant="secondary" disabled onPress={() => {}} />
          <Text style={styles.demoNote}>Social sign-in is disabled in this demo build.</Text>

          <View style={{ flex: 1 }} />
          <Button label="Continue as guest" variant="ghost" onPress={onGuest} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function useStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    scroll: { flexGrow: 1, paddingHorizontal: t.screenPaddingX, paddingBottom: t.spacing.lg, gap: t.spacing.md },
    back: { width: t.minHitTarget, height: t.minHitTarget, justifyContent: 'center' as const, marginLeft: -t.spacing.sm },
    title: { ...t.typography.display, color: t.colors.textPrimary },
    subtitle: { ...t.typography.body, color: t.colors.textSecondary, marginBottom: t.spacing.sm },
    field: { gap: t.spacing.xs },
    input: {
      ...t.typography.body,
      color: t.colors.textPrimary,
      backgroundColor: t.colors.bgMuted,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: t.spacing.lg,
      minHeight: 52,
    },
    inputError: { borderColor: t.colors.accent },
    error: { ...t.typography.meta, color: t.colors.accent },
    divider: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.md, marginVertical: t.spacing.sm },
    line: { flex: 1, height: 1, backgroundColor: t.colors.border },
    dividerText: { ...t.typography.meta, color: t.colors.textTertiary },
    demoNote: { ...t.typography.meta, color: t.colors.textTertiary, textAlign: 'center' as const },
  }));
}
