import React, { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, { LinearTransition, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from './WebMotion';
export default function MotionView(props: ViewProps) {
  const reduced = useReducedMotion();
  const offset = useSharedValue(reduced ? 0 : 12);
  useEffect(() => { offset.value = withTiming(0, { duration: reduced ? 0 : 280, reduceMotion: ReduceMotion.System }); }, [offset, reduced]);
  const animation = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  // Translation and layout only: zero-opacity ancestors suppress iOS Liquid Glass.
  return <Animated.View {...props} layout={LinearTransition.duration(320).reduceMotion(ReduceMotion.System)} style={[props.style, animation]} />;
}
