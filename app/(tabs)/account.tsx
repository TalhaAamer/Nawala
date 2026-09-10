import { useEffect, useState } from 'react';
import { FlatList, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme, useThemedStyles } from '@/theme';
import { Button, Chip, ChipRow, PressableScale, RestaurantCardSmall, Sheet } from '@/components';
import { useSession } from '@/store/session';
import { useFavorites } from '@/store/favorites';
import { useRestaurants } from '@/hooks/useApi';
import { loadAddresses, upsertAddress, removeAddress } from '@/services/storage/addresses';
import { getJSON, setJSON, STORAGE_KEYS } from '@/services/storage/kv';
import { mockCards, type MockCard } from '@/features/checkout/payments';
import { addressSchema } from '@/lib/schemas';
import type { Address } from '@/types';

type NotificationPrefs = { orderUpdates: boolean; promos: boolean; nearby: boolean };
const DEFAULT_PREFS: NotificationPrefs = { orderUpdates: true, promos: true, nearby: false };

type SheetKind = null | 'address' | 'card' | 'legal';

export default function Account() {
  const { theme, mode, setMode } = useTheme();
  const styles = useStyles();
  const router = useRouter();

  const user = useSession((s) => s.user);
  const signOut = useSession((s) => s.signOut);
  const selectedAddressId = useSession((s) => s.selectedAddressId);
  const setAddress = useSession((s) => s.setAddress);
  const favIds = useFavorites((s) => s.ids);
  const restaurants = useRestaurants();

  const isUser = user?.kind === 'user';
  const name = isUser ? (user.email ?? user.phone ?? 'Crave member') : 'Guest';
  const initials = isUser ? name.charAt(0).toUpperCase() : 'G';

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cards, setCards] = useState<MockCard[]>(mockCards);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [legalTitle, setLegalTitle] = useState('');

  useEffect(() => {
    loadAddresses().then(setAddresses);
    getJSON<NotificationPrefs>(STORAGE_KEYS.notifications, DEFAULT_PREFS).then(setPrefs);
  }, []);

  const favRestaurants = (restaurants.data ?? []).filter((r) => favIds.includes(r.id));

  const updatePref = (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    void setJSON(STORAGE_KEYS.notifications, next);
  };

  const onSaveAddress = async (addr: Address) => {
    const next = await upsertAddress(addr);
    setAddresses(next);
    setSheet(null);
    setEditingAddress(null);
  };
  const onDeleteAddress = async (id: string) => {
    const next = await removeAddress(id);
    setAddresses(next);
    setSheet(null);
    setEditingAddress(null);
  };

  const onSignOut = () => {
    signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Account</Text>

        {/* 1 · Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.sub}>{isUser ? 'Crave member' : 'Browsing as guest'}</Text>
          </View>
          {!isUser ? (
            <Button label="Sign in" fullWidth={false} onPress={() => router.push({ pathname: '/(auth)/sign-in', params: { reason: 'account' } })} />
          ) : null}
        </View>

        {/* 2 · Saved addresses (users only) */}
        {isUser ? (
          <Section title="Saved addresses" actionLabel="Add" onAction={() => { setEditingAddress(null); setSheet('address'); }}>
            {addresses.map((a) => (
              <PressableScale
                key={a.id}
                onPress={() => setAddress(a.id)}
                onLongPress={() => { setEditingAddress(a); setSheet('address'); }}
                accessibilityRole="radio"
                accessibilityState={{ selected: a.id === selectedAddressId }}
                accessibilityLabel={`${a.label}, ${a.line1}. Tap to select, long-press to edit`}
                style={styles.listRow}
                noAnimation
              >
                <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowPrimary}>{a.label}</Text>
                  <Text style={styles.rowSecondary} numberOfLines={1}>{a.line1}, {a.city}</Text>
                </View>
                <Ionicons name={a.id === selectedAddressId ? 'radio-button-on' : 'radio-button-off'} size={20} color={a.id === selectedAddressId ? theme.colors.accent : theme.colors.textTertiary} />
              </PressableScale>
            ))}
          </Section>
        ) : null}

        {/* 3 · Payment methods (users only) */}
        {isUser ? (
          <Section title="Payment methods" actionLabel="Add" onAction={() => setSheet('card')}>
            {cards.map((c) => (
              <View key={c.id} style={styles.listRow}>
                <Ionicons name="card-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.rowPrimary, { flex: 1 }]}>{c.brand} {c.label}</Text>
              </View>
            ))}
            <Text style={styles.demoNote}>Demo build — payment is not real.</Text>
          </Section>
        ) : null}

        {/* 4 · Appearance */}
        <Section title="Appearance">
          <ChipRow>
            {(['system', 'light', 'dark'] as const).map((m) => (
              <Chip key={m} label={m[0].toUpperCase() + m.slice(1)} selected={mode === m} onPress={() => setMode(m)} />
            ))}
          </ChipRow>
        </Section>

        {/* 5 · Notifications */}
        <Section title="Notifications">
          <ToggleRow label="Order updates" value={prefs.orderUpdates} onChange={(v) => updatePref('orderUpdates', v)} />
          <ToggleRow label="Promos & deals" value={prefs.promos} onChange={(v) => updatePref('promos', v)} />
          <ToggleRow label="New restaurants near me" value={prefs.nearby} onChange={(v) => updatePref('nearby', v)} />
        </Section>

        {/* 6 · Favorites (users only) */}
        {isUser ? (
          <Section title="Favorites">
            {favRestaurants.length > 0 ? (
              <FlatList
                horizontal
                data={favRestaurants}
                keyExtractor={(r) => r.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.favRow}
                renderItem={({ item }) => <RestaurantCardSmall restaurant={item} onPress={() => router.push(`/restaurant/${item.id}`)} />}
              />
            ) : (
              <Text style={styles.emptyFav}>Heart restaurants to save them here.</Text>
            )}
          </Section>
        ) : null}

        {/* 7 · About + sign out */}
        <Section title="About">
          <LinkRow label="Terms of Service" onPress={() => { setLegalTitle('Terms of Service'); setSheet('legal'); }} />
          <LinkRow label="Privacy Policy" onPress={() => { setLegalTitle('Privacy Policy'); setSheet('legal'); }} />
          <Text style={styles.version}>Crave v{Constants.expoConfig?.version ?? '1.0.0'} · demo build</Text>
        </Section>

        {isUser ? (
          <Button label="Sign out" variant="ghost" onPress={onSignOut} />
        ) : (
          <Button label="Sign in" onPress={() => router.push({ pathname: '/(auth)/sign-in', params: { reason: 'account' } })} />
        )}

        {__DEV__ ? (
          <Button label="Open kitchen sink (dev)" variant="secondary" onPress={() => router.push('/_kitchen-sink')} />
        ) : null}

        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>

      {/* Address form sheet */}
      <Sheet visible={sheet === 'address'} onClose={() => setSheet(null)} title={editingAddress ? 'Edit address' : 'Add address'}>
        <AddressForm
          initial={editingAddress}
          onSave={onSaveAddress}
          onDelete={editingAddress ? () => onDeleteAddress(editingAddress.id) : undefined}
        />
      </Sheet>

      {/* Add card sheet */}
      <Sheet visible={sheet === 'card'} onClose={() => setSheet(null)} title="Add card (demo)">
        <CardForm
          onSave={(last4) => {
            setCards((prev) => [...prev, { id: `card_${last4}`, label: `•••• ${last4}`, brand: 'Card', icon: 'card' }]);
            setSheet(null);
          }}
        />
        <Text style={styles.demoNote}>Demo build — only the last 4 digits are stored locally.</Text>
      </Sheet>

      {/* Legal sheet */}
      <Sheet visible={sheet === 'legal'} onClose={() => setSheet(null)} title={legalTitle}>
        <Text style={styles.legalText}>
          This is a demo build of Crave. No real account, payment, or delivery is provided. All data lives on your device
          and can be cleared at any time. {legalTitle} content is placeholder text for demonstration only.
        </Text>
        <Button label="Got it" onPress={() => setSheet(null)} />
      </Sheet>
    </SafeAreaView>
  );
}

function AddressForm({ initial, onSave, onDelete }: { initial: Address | null; onSave: (a: Address) => void; onDelete?: () => void }) {
  const { theme } = useTheme();
  const styles = useStyles();
  const [form, setForm] = useState<Address>(
    initial ?? { id: '', label: '', line1: '', city: '', state: '', zip: '' },
  );
  const [error, setError] = useState<string | null>(null);

  const field = (key: keyof Address, placeholder: string, extra?: object) => (
    <TextInput
      value={form[key]}
      onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textTertiary}
      style={styles.input}
      accessibilityLabel={placeholder}
      {...extra}
    />
  );

  const save = () => {
    const finalAddress: Address = { ...form, id: form.id || `addr_${Date.now().toString(36)}` };
    const result = addressSchema.safeParse(finalAddress);
    if (!result.success || !finalAddress.label || !finalAddress.line1 || !finalAddress.city) {
      setError('Please fill in label, street, and city.');
      return;
    }
    onSave(finalAddress);
  };

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {field('label', 'Label (Home, Work…)')}
      {field('line1', 'Street address')}
      {field('city', 'City')}
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>{field('state', 'State')}</View>
        <View style={{ flex: 1 }}>{field('zip', 'ZIP', { keyboardType: 'number-pad' })}</View>
      </View>
      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <Button label="Save address" onPress={save} />
      {onDelete ? <Button label="Delete address" variant="ghost" onPress={onDelete} /> : null}
    </View>
  );
}

function CardForm({ onSave }: { onSave: (last4: string) => void }) {
  const { theme } = useTheme();
  const styles = useStyles();
  const [last4, setLast4] = useState('');
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <TextInput
        value={last4}
        onChangeText={(t) => setLast4(t.replace(/[^0-9]/g, '').slice(0, 4))}
        placeholder="Last 4 digits"
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType="number-pad"
        style={styles.input}
        accessibilityLabel="Card last 4 digits"
      />
      <Button label="Add card" disabled={last4.length !== 4} onPress={() => onSave(last4)} />
    </View>
  );
}

function Section({ title, children, actionLabel, onAction }: { title: string; children: React.ReactNode; actionLabel?: string; onAction?: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>
        {onAction ? (
          <PressableScale onPress={onAction} accessibilityRole="button" accessibilityLabel={`${actionLabel} ${title}`} noAnimation>
            <Text style={styles.action}>{actionLabel}</Text>
          </PressableScale>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.rowPrimary}>{label}</Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useTheme();
  const styles = useStyles();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.linkRow} noAnimation>
      <Text style={styles.rowPrimary}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
    </PressableScale>
  );
}

function useStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    scroll: { padding: t.screenPaddingX, gap: t.spacing.lg },
    title: { ...t.typography.display, color: t.colors.textPrimary },
    profileCard: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.md, backgroundColor: t.colors.surface, borderRadius: t.radii.lg, padding: t.spacing.lg, borderWidth: 1, borderColor: t.colors.border },
    avatar: { width: 52, height: 52, borderRadius: t.radii.pill, backgroundColor: t.colors.accentSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
    avatarText: { ...t.typography.titleLg, color: t.colors.onAccentSoft },
    name: { ...t.typography.title, color: t.colors.textPrimary },
    sub: { ...t.typography.meta, color: t.colors.textSecondary },
    section: { gap: t.spacing.sm },
    sectionHead: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    sectionTitle: { ...t.typography.titleLg, color: t.colors.textPrimary },
    action: { ...t.typography.chip, color: t.colors.accent },
    listRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.md, paddingVertical: t.spacing.sm, minHeight: t.minHitTarget },
    rowPrimary: { ...t.typography.body, color: t.colors.textPrimary },
    rowSecondary: { ...t.typography.meta, color: t.colors.textSecondary },
    demoNote: { ...t.typography.meta, color: t.colors.textTertiary },
    toggleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, minHeight: t.minHitTarget },
    favRow: { gap: t.spacing.md, paddingVertical: t.spacing.xs },
    emptyFav: { ...t.typography.body, color: t.colors.textSecondary },
    linkRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, minHeight: t.minHitTarget },
    version: { ...t.typography.meta, color: t.colors.textTertiary, marginTop: t.spacing.xs },
    input: { ...t.typography.body, color: t.colors.textPrimary, backgroundColor: t.colors.bgMuted, borderRadius: t.radii.md, paddingHorizontal: t.spacing.lg, minHeight: 48 },
    formError: { ...t.typography.meta, color: t.colors.accent },
    legalText: { ...t.typography.body, color: t.colors.textSecondary },
  }));
}
