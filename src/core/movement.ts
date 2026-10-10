import { Fix } from './types';
import { distance } from './geo';
export function usableMovementFix(f: Fix) {
  return Number.isFinite(f.timestamp) && Number.isFinite(f.accuracy) && f.accuracy >= 0 && f.accuracy <= 35 && f.coordinate.every(Number.isFinite) && Math.abs(f.coordinate[0]) <= 180 && Math.abs(f.coordinate[1]) <= 90;
}
/** Accuracy-aware movement anchor. Holding still never expires into artificial movement. */
export class MovementTracker {
  anchor: Fix | null = null;
  private lastSeen = 0;
  private candidate: Fix | null = null;
  private interrupted = false;
  next(raw: Fix): { fix: Fix; point: Fix | null; breakBefore: boolean } | null {
    if (raw.timestamp <= this.lastSeen) return null;
    const gap = this.lastSeen > 0 && raw.timestamp - this.lastSeen >= 15000;
    this.lastSeen = raw.timestamp;
    if (!usableMovementFix(raw)) { this.interrupted = true; this.candidate = null; return null; }
    if (!this.anchor || gap || this.interrupted) {
      const breakBefore = !!this.anchor;
      this.anchor = raw; this.interrupted = false; this.candidate = null;
      return { fix: raw, point: raw, breakBefore };
    }
    const meters = distance(this.anchor.coordinate, raw.coordinate);
    const speed = raw.speed !== null && Number.isFinite(raw.speed) && raw.speed >= 0 ? raw.speed : null;
    const accuracy = Math.max(this.anchor.accuracy, raw.accuracy);
    const moving = speed !== null && speed >= 1;
    const radius = moving ? Math.max(3, Math.min(12, accuracy * .5)) : Math.max(8, Math.min(35, accuracy * 1.5));
    const held = () => ({ fix: { ...raw, coordinate: this.anchor!.coordinate }, point: null, breakBefore: false });
    if (meters < radius) { this.candidate = null; return held(); }
    // Reject isolated teleportation even if the sensor reports a spurious speed.
    if (meters / Math.max(.001, (raw.timestamp - this.anchor.timestamp) / 1000) > 25) { this.candidate = null; return held(); }
    if (!moving) {
      const confirmed = this.candidate && raw.timestamp - this.candidate.timestamp <= 5000 && distance(this.candidate.coordinate, raw.coordinate) <= Math.max(5, raw.accuracy * .7);
      this.candidate = raw;
      if (!confirmed) return held();
    }
    this.anchor = raw; this.candidate = null;
    return { fix: raw, point: raw, breakBefore: false };
  }
}
