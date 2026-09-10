import { useEffect, useRef, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme, useThemedStyles } from '@/theme';
import {
  SearchPillInput,
  Chip,
  ChipRow,
  RestaurantCard,
  RestaurantCardSkeleton,
  EmptyState,
  Sheet,
  Button,
  PressableScale,
  SectionHeader,
} from '@/components';
import { useSearchRestaurants } from '@/hooks/useApi';
import { useFavorites } from '@/store/favorites';
import { useDebounce } from '@/hooks/useDebounce';
import { getJSON, setJSON, STORAGE_KEYS } from '@/services/storage/kv';
import type { Filters, FeedSort } from '@/types';

const CUISINES = ['Pizza', 'Sushi', 'Burgers', 'Breakfast', 'Healthy', 'Dessert', 'Coffee', 'Tacos', 'Thai', 'Indian', 'Mediterranean', 'Ramen', 'BBQ'];
const SUGGESTED = ['Pizza', 'Sushi', 'Burgers', 'Tacos'];
const SORTS: { key: FeedSort; label: string }[] = [
  { key: 'rating', label: 'Top rated' },
  { key: 'eta', label: 'Fastest' },
  { key: 'price', label: 'Price' },
];

export default function Search() {
  const { theme } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const favIds = useFavorites((s) => s.ids);
  const toggleFav = useFavorites((s) => s.toggle);

  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const [recents, setRecents] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [draft, setDraft] = useState<Filters>({});

  useEffect(() => {
    getJSON<string[]>(STORAGE_KEYS.recentSearches, []).then(setRecents);
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const hasQuery = debounced.trim().length > 0;
  const hasFilters = !!(filters.sort || filters.maxPriceLevel || filters.cuisines?.length);
  const active = hasQuery || hasFilters;

  const results = useSearchRestaurants(debounced, filters);

  const commitRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecents((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8);
      void setJSON(STORAGE_KEYS.recentSearches, next);
      return next;
    });
  };

  const openFilters = () => {
    setDraft(filters);
    setFilterOpen(true);
  };
  const applyFilters = () => {
    setFilters(draft);
    setFilterOpen(false);
  };
  const filterCount = (filters.cuisines?.length ?? 0) + (filters.sort ? 1 : 0) + (filters.maxPriceLevel ? 1 : 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchPillInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => commitRecent(query)}
            />
          </View>
          <PressableScale
            onPress={openFilters}
            accessibilityRole="button"
            accessibilityLabel={`Filters${filterCount ? `, ${filterCount} active` : ''}`}
            style={styles.filterBtn}
            hitSlop={6}
          >
            <Ionicons name="options-outline" size={22} color={theme.colors.textPrimary} />
            {filterCount > 0 ? <View style={styles.filterDot} /> : null}
          </PressableScale>
        </View>
      </View>

      {!active ? (
        <View style={styles.discover}>
          {recents.length > 0 ? (
            <View style={styles.block}>
              <View style={styles.recentHead}>
                <SectionHeader title="Recent" />
                <PressableScale
                  onPress={() => {
                    setRecents([]);
                    void setJSON(STORAGE_KEYS.recentSearches, []);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear recent searches"
                  noAnimation
                >
                  <Text style={styles.clear}>Clear</Text>
                </PressableScale>
              </View>
              {recents.map((r) => (
                <PressableScale
                  key={r}
                  onPress={() => setQuery(r)}
                  accessibilityRole="button"
                  accessibilityLabel={`Search ${r}`}
                  style={styles.recentRow}
                  noAnimation
                >
                  <Ionicons name="time-outline" size={18} color={theme.colors.textSecondary} />
                  <Text style={styles.recentText}>{r}</Text>
                </PressableScale>
              ))}
            </View>
          ) : null}

          <View style={styles.block}>
            <SectionHeader title="Suggested" />
            <ChipRow>
              {SUGGESTED.map((s) => (
                <Chip key={s} label={s} onPress={() => setQuery(s)} />
              ))}
            </ChipRow>
          </View>
        </View>
      ) : results.loading && !results.data ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </View>
      ) : results.error && !results.data ? (
        <EmptyState variant="error" title="Search failed" message="Please try again." actionLabel="Retry" onAction={results.refetch} />
      ) : (results.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon="search"
          title={hasQuery ? `No results for “${debounced.trim()}”` : 'No matches'}
          message="Try a different term or adjust your filters."
        />
      ) : (
        <FlatList
          data={results.data ?? []}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              favorite={favIds.includes(item.id)}
              onToggleFavorite={() => toggleFav(item.id)}
              onPress={() => {
                commitRecent(debounced);
                router.push(`/restaurant/${item.id}`);
              }}
            />
          )}
        />
      )}

      <Sheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
        <Text style={styles.filterLabel}>Sort by</Text>
        <ChipRow>
          {SORTS.map((s) => (
            <Chip
              key={s.key}
              label={s.label}
              selected={draft.sort === s.key}
              onPress={() => setDraft((d) => ({ ...d, sort: d.sort === s.key ? undefined : s.key }))}
            />
          ))}
        </ChipRow>

        <Text style={styles.filterLabel}>Max price</Text>
        <ChipRow>
          {([1, 2, 3, 4] as const).map((p) => (
            <Chip
              key={p}
              label={'$'.repeat(p)}
              selected={draft.maxPriceLevel === p}
              onPress={() => setDraft((d) => ({ ...d, maxPriceLevel: d.maxPriceLevel === p ? undefined : p }))}
            />
          ))}
        </ChipRow>

        <Text style={styles.filterLabel}>Cuisine</Text>
        <ChipRow>
          {CUISINES.map((c) => {
            const sel = draft.cuisines?.includes(c) ?? false;
            return (
              <Chip
                key={c}
                label={c}
                selected={sel}
                onPress={() =>
                  setDraft((d) => {
                    const cur = new Set(d.cuisines ?? []);
                    if (cur.has(c)) cur.delete(c);
                    else cur.add(c);
                    return { ...d, cuisines: [...cur] };
                  })
                }
              />
            );
          })}
        </ChipRow>

        <View style={styles.filterActions}>
          <View style={{ flex: 1 }}>
            <Button label="Clear" variant="secondary" onPress={() => setDraft({})} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Apply" onPress={applyFilters} />
          </View>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function useStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    header: { paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.sm, paddingBottom: t.spacing.sm },
    searchRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.sm },
    filterBtn: { width: t.minHitTarget, height: t.minHitTarget, borderRadius: t.radii.pill, backgroundColor: t.colors.bgMuted, alignItems: 'center' as const, justifyContent: 'center' as const },
    filterDot: { position: 'absolute' as const, top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.accent },
    discover: { padding: t.screenPaddingX, gap: t.spacing.xl },
    block: { gap: t.spacing.sm },
    recentHead: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    clear: { ...t.typography.chip, color: t.colors.accent },
    recentRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.md, paddingVertical: t.spacing.sm },
    recentText: { ...t.typography.body, color: t.colors.textPrimary },
    list: { padding: t.screenPaddingX, gap: t.spacing.lg },
    filterLabel: { ...t.typography.title, color: t.colors.textPrimary, marginTop: t.spacing.sm },
    filterActions: { flexDirection: 'row' as const, gap: t.spacing.md, marginTop: t.spacing.md },
  }));
}
