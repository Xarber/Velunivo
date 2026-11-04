// SPDX-License-Identifier: AGPL-3.0-only
import {BridgeSnapshot} from '../bluetooth/types';
/** Detect actual vehicle motion, never GPS drift or a cached/simulated speed. */
export class AutomaticRideDetector {
  private first = 0;
  private previous = 0;
  private vehicle = '';
  private count = 0;
  reset() { this.first = 0; this.previous = 0; this.count = 0; this.vehicle = ''; }
  accept(snapshot: BridgeSnapshot, vehicleId: string, now: number): boolean {
    const speed = snapshot.fields.speed;
    if (snapshot.state !== 'connected' || snapshot.simulated || snapshot.vehicleId !== vehicleId ||
        !speed || speed.source !== 'vehicle' || speed.unit !== 'm/s' || typeof speed.value !== 'number' ||
        !Number.isFinite(speed.value) || speed.value < 2 || speed.value > 30 ||
        speed.timestamp > now + 1000 || now - speed.timestamp > 3000) {
      this.reset(); return false;
    }
    if (this.vehicle !== vehicleId || speed.timestamp - this.previous > 5000) this.reset();
    if (speed.timestamp <= this.previous) return false;
    this.vehicle = vehicleId;
    if (!this.count) this.first = speed.timestamp;
    this.previous = speed.timestamp; this.count++;
    return this.count >= 4 && this.previous - this.first >= 10000;
  }
}
export const AUTOMATIC_RIDE_COOLDOWN = 5 * 60 * 1000;
export const AUTOMATIC_RIDE_DISCONNECT_GRACE = 60 * 1000;
