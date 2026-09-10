import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const VB_W = 100;
const VB_H = 60;
const PAD = 10;

export type LatLng = { lat: number; lng: number };

/**
 * Map placeholder contract — a real react-native-maps / expo-maps view must be
 * droppable behind these exact props later (DESIGN-SPEC §6.10, TECH-STACK §9).
 */
export type MapViewProps = {
  route: LatLng[];
  courier?: { progress: number }; // 0..1 along the route
  origin?: LatLng;
  destination?: LatLng;
  height?: number;
};

/** Project lat/lng points into the fixed SVG viewBox. */
function projectPoints(route: LatLng[]): { x: number; y: number }[] {
  if (route.length === 0) return [];
  const lats = route.map((p) => p.lat);
  const lngs = route.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;
  return route.map((p) => ({
    x: PAD + ((p.lng - minLng) / spanLng) * (VB_W - PAD * 2),
    // invert y so north is up
    y: PAD + (1 - (p.lat - minLat) / spanLat) * (VB_H - PAD * 2),
  }));
}

/** Cumulative-length lookup for the point at progress t in [0,1]. */
function pointAtProgress(pts: { x: number; y: number }[], t: number): { x: number; y: number } {
  if (pts.length === 0) return { x: VB_W / 2, y: VB_H / 2 };
  if (pts.length === 1) return pts[0];
  const segLens = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const total = segLens.reduce((a, b) => a + b, 0) || 1;
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i]) {
      const f = segLens[i] === 0 ? 0 : target / segLens[i];
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * f, y: pts[i].y + (pts[i + 1].y - pts[i].y) * f };
    }
    target -= segLens[i];
  }
  return pts[pts.length - 1];
}

export function MapView({ route, courier, height = 200 }: MapViewProps) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const progress = courier?.progress ?? 0;

  const pts = useMemo(() => projectPoints(route), [route]);
  const pathD = useMemo(
    () => (pts.length ? `M ${pts.map((p) => `${p.x} ${p.y}`).join(' L ')}` : ''),
    [pts],
  );
  const courierPt = useMemo(() => pointAtProgress(pts, progress), [pts, progress]);
  const start = pts[0];
  const end = pts[pts.length - 1];

  // Animate the courier dot toward its target position when progress changes.
  const cx = useDerivedValue(() =>
    reduced ? courierPt.x : withTiming(courierPt.x, { duration: 800 }),
  );
  const cy = useDerivedValue(() =>
    reduced ? courierPt.y : withTiming(courierPt.y, { duration: 800 }),
  );
  const dotProps = useAnimatedProps(() => ({ cx: cx.value, cy: cy.value }));

  const styles = useThemedStyles((t) => ({
    wrap: { height, borderRadius: t.radii.lg, overflow: 'hidden' as const, backgroundColor: t.colors.bgMuted },
    pinDest: {
      position: 'absolute' as const,
      top: t.spacing.md,
      right: t.spacing.md,
      backgroundColor: t.colors.surface,
      borderRadius: t.radii.pill,
      padding: t.spacing.sm,
      ...t.elevation.card,
    },
  }));

  return (
    <View style={styles.wrap} accessibilityLabel="Delivery map" accessibilityRole="image">
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="mapbg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.bgMuted} />
            <Stop offset="1" stopColor={theme.colors.border} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#mapbg)" />
        {pathD ? (
          <Path d={pathD} stroke={theme.colors.accent} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.5} />
        ) : null}
        {start ? <Circle cx={start.x} cy={start.y} r={3} fill={theme.colors.textSecondary} /> : null}
        {end ? <Circle cx={end.x} cy={end.y} r={3.5} fill={theme.colors.accent} /> : null}
        {courier ? (
          <>
            <AnimatedCircle animatedProps={dotProps} r={5} fill={theme.colors.accent} opacity={0.25} />
            <AnimatedCircle animatedProps={dotProps} r={2.8} fill={theme.colors.accent} />
          </>
        ) : null}
      </Svg>
      <View style={styles.pinDest}>
        <Ionicons name="bicycle" size={18} color={theme.colors.accent} />
      </View>
    </View>
  );
}
