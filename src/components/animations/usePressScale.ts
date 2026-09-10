import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PRESS_SCALE, PRESS_SPRING } from './motion';

/**
 * Reusable press micro-interaction. Returns an animated style plus the
 * onPressIn/onPressOut handlers to spread onto an Animated.View-backed pressable.
 *
 * Honors reduce-motion: falls back to a subtle opacity flicker instead of scale.
 */
export function usePressScale() {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const onPressIn = () => {
    if (reduced) {
      opacity.value = withTiming(0.7, { duration: 80 });
    } else {
      scale.value = withSpring(PRESS_SCALE, PRESS_SPRING);
    }
  };

  const onPressOut = () => {
    if (reduced) {
      opacity.value = withTiming(1, { duration: 120 });
    } else {
      scale.value = withSpring(1, PRESS_SPRING);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { animatedStyle, onPressIn, onPressOut };
}
