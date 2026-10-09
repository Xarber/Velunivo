import React, { useState } from 'react';
import { Animated, Pressable, PressableProps } from 'react-native';
import { useReducedMotion } from './WebMotion';
export default function PressMotion(props: PressableProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  const animate = (value: number) => { if (reduced) scale.setValue(1); else Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 30, bounciness: 3 }).start(); };
  return <Animated.View style={{ transform: [{ scale }] }}><Pressable {...props} onPressIn={e => { animate(.97); props.onPressIn?.(e); }} onPressOut={e => { animate(1); props.onPressOut?.(e); }} /></Animated.View>;
}
