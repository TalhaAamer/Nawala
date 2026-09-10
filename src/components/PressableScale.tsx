import { forwardRef } from 'react';
import { Pressable, type PressableProps, type View, type ViewStyle, type StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from './animations/usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
  /** Disable the scale/opacity micro-interaction (still pressable). */
  noAnimation?: boolean;
};

/**
 * Pressable with the standard spring press scale (DESIGN-SPEC §8) baked in.
 * The foundation for Button, cards, rows, chips, etc.
 */
export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  { style, noAnimation, onPressIn, onPressOut, disabled, ...rest },
  ref,
) {
  const { animatedStyle, onPressIn: inAnim, onPressOut: outAnim } = usePressScale();

  return (
    <AnimatedPressable
      ref={ref}
      disabled={disabled}
      style={[style, !noAnimation && !disabled && animatedStyle]}
      onPressIn={(e) => {
        if (!noAnimation && !disabled) inAnim();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!noAnimation && !disabled) outAnim();
        onPressOut?.(e);
      }}
      {...rest}
    />
  );
});
