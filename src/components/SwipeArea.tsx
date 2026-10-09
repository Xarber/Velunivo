import React, { useMemo } from 'react';
import { PanResponder, View, ViewProps } from 'react-native';
export default function SwipeArea({ onSwipe, ...props }: ViewProps & { onSwipe(open: boolean): void }) {
  const drag = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderRelease: (_, g) => { if (g.dy < -25) onSwipe(true); else if (g.dy > 25) onSwipe(false); },
  }), [onSwipe]);
  return <View {...props} {...drag.panHandlers} />;
}
