import React, { useRef } from 'react';
import { View, ViewProps } from 'react-native';
export default function SwipeArea({ onSwipe, ...props }: ViewProps & { onSwipe(open: boolean): void }) {
  const start = useRef<{ x: number; y: number } | null>(null), moved = useRef(false);
  return <View {...props} {...({
    onPointerDown: (e: any) => { start.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }; moved.current = false; },
    onPointerMove: (e: any) => { const from = start.current; if (from && Math.abs(e.nativeEvent.pageY - from.y) > 10 && Math.abs(e.nativeEvent.pageY - from.y) > Math.abs(e.nativeEvent.pageX - from.x)) e.currentTarget.setPointerCapture?.(e.nativeEvent.pointerId); },
    onPointerUp: (e: any) => { const from = start.current; start.current = null; if (!from) return; const dy = e.nativeEvent.pageY - from.y, dx = e.nativeEvent.pageX - from.x; if (Math.abs(dy) > 25 && Math.abs(dy) > Math.abs(dx)) { moved.current = true; onSwipe(dy < 0); } },
    onPointerCancel: () => { start.current = null; },
    onClickCapture: (e: any) => { if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; } },
  } as any)} style={[props.style, { touchAction: 'none', userSelect: 'none' } as any]} />;
}
