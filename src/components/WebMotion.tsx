import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
export default function WebMotion() { return null; }
export function motionProps(_kind: string, _state?: string) { return {}; }
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { mounted = false; listener.remove(); };
  }, []);
  return reduced;
}
