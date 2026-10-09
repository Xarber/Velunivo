import { Coord } from './types';
import { distance } from './geo';
import { normalizeHeading } from './rideView';
export const headingDelta = (a: number, b: number) => ((b - a + 540) % 360) - 180;
export interface CameraSample { position: Coord; heading: number; }
export interface CameraTarget extends CameraSample { duration: number; }
// Only visual camera updates are filtered. Guidance, speed and recording use raw fixes.
export class CameraTracker {
  last: CameraSample | null = null;
  sentAt = 0;
  mode = '';
  next(sample: CameraSample, mode: string, now: number, reducedMotion = false): CameraTarget | null {
    const first = this.last === null || this.mode !== mode;
    if (!first) {
      const moved = distance(this.last!.position, sample.position);
      const turned = Math.abs(headingDelta(this.last!.heading, sample.heading));
      // Let a full camera transition finish before accepting the latest target.
      if (now - this.sentAt < 1000) return null;
      if (moved < 3 && turned < 4 && (now - this.sentAt < 2500 || (moved < .1 && turned < .1))) return null;
    }
    this.last = { position: sample.position, heading: normalizeHeading(sample.heading) };
    this.sentAt = now; this.mode = mode;
    return { ...this.last, duration: reducedMotion ? 0 : first ? 900 : 650 };
  }
  reset() { this.last = null; this.mode = ''; }
}
