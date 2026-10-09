import { useEffect, useRef, useState } from 'react';
import { CameraTracker, CameraTarget } from '../core/camera';
import { Coord } from '../core/types';
import { useReducedMotion } from '../components/WebMotion';
export function useCameraTarget(position: Coord | undefined, heading: number, enabled: boolean, mode: string) {
  const [target, setTarget] = useState<CameraTarget | null>(null);
  const latest = useRef({ position, heading, enabled, mode });
  const reduced = useReducedMotion();
  useEffect(() => { latest.current = { position, heading, enabled, mode }; }, [position, heading, enabled, mode]);
  useEffect(() => {
    const tracker = new CameraTracker();
    const tick = () => {
      const input = latest.current;
      if (!input.enabled || !input.position) { tracker.reset(); return; }
      const next = tracker.next({ position: input.position, heading: input.heading }, input.mode, Date.now(), reduced);
      if (next) setTarget(next);
    };
    const timer = setInterval(tick, 100);
    return () => clearInterval(timer);
  }, [reduced]);
  return target;
}
