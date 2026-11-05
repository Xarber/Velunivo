// SPDX-License-Identifier: AGPL-3.0-only
// Independent diagnostic reads; research provenance and uncertainty: docs/M365_INSPECTION.md.
import type {BLELink} from '../../src/bluetooth/types';
import {MiUART} from '../../src/bluetooth/plugins/miAuth';
import {NUS, TX, RX, PacketStream} from '../../src/bluetooth/plugins/m365Packets';
import {VehicleRequestChannel} from '../../src/bluetooth/requestChannel';

export const inspectionReads = Object.freeze({
  activeProfile: {register: 0xb2, length: 2},
  profile1Start: {register: 1, length: 32},
  profile1Later: {register: 17, length: 32},
  profile2Start: {register: 60, length: 32},
  profile2Later: {register: 76, length: 32},
  profile3Start: {register: 119, length: 32},
  profile3Later: {register: 135, length: 32},
  // Exploratory continuations from the observed global/profile selector region.
  // These bytes have no setting names or write addresses assigned to them.
  globalStart: {register: 178, length: 32},
  globalLater: {register: 194, length: 32},
  globalEnd: {register: 210, length: 32},
  // Fixed, read-only survey of the full 8-bit SHFW word-address window.
  // Raw response locations only: these are not inferred setting/write addresses.
  window000: {register: 0, length: 32},
  window016: {register: 16, length: 32},
  window032: {register: 32, length: 32},
  window048: {register: 48, length: 32},
  window064: {register: 64, length: 32},
  window080: {register: 80, length: 32},
  window096: {register: 96, length: 32},
  window112: {register: 112, length: 32},
  window128: {register: 128, length: 32},
  window144: {register: 144, length: 32},
  window160: {register: 160, length: 32},
  window176: {register: 176, length: 32},
  window192: {register: 192, length: 32},
  window208: {register: 208, length: 32},
  window224: {register: 224, length: 32},
  window240: {register: 240, length: 32},
} satisfies Record<string, {register: number; length: number}>);
for (const read of Object.values(inspectionReads)) Object.freeze(read);
export type InspectionRead = keyof typeof inspectionReads;

/** No arbitrary registers or SHFW writes are available, even to callers using plain JS. */
export function inspectionReadBody(name: InspectionRead): Uint8Array {
  if (!Object.hasOwn(inspectionReads, name)) throw new Error('Read is not allowlisted');
  const {register, length} = inspectionReads[name];
  return Uint8Array.of(0x20, 0x31, register, length, 0);
}

export function inspectionReply(name: InspectionRead, body: Uint8Array): Uint8Array | undefined {
  if (!Object.hasOwn(inspectionReads, name)) return undefined;
  const {register, length} = inspectionReads[name];
  if (body.length !== length + 3 || body[0] !== 0x23 || body[1] !== 0x31 || body[2] !== register) return undefined;
  return body.slice(3);
}

export interface InspectionResult {
  schema: 1;
  probeRevision: 'readonly-shfw-3';
  capturedAt: string;
  provenance: 'authenticated-vehicle-response';
  firmwareBytes: number[];
  batteryPercent: number;
  speedMetresPerSecond: number;
  blocks: Partial<Record<InspectionRead, {register: number; bytes: number[]; capturedAt: string}>>;
  failures: InspectionRead[];
}

/** Uses existing authenticated transport and framing. Raw blocks are not decoded as settings. */
export async function inspectMiSession(link: BLELink, uart: MiUART, signal: AbortSignal): Promise<InspectionResult> {
  if (signal.aborted) throw new Error('Inspection cancelled');
  const stream = new PacketStream();
  let disconnected = false;
  const channel = new VehicleRequestChannel(wire => link.write(NUS, TX, wire));
  const cancel = () => channel.cancel(new Error('Inspection cancelled or disconnected'));
  const stopDisconnect = link.onDisconnect(() => {disconnected = true; cancel();});
  const stop = link.monitor(NUS, RX, chunk => {
    for (const wire of stream.feed(chunk)) {
      try {channel.receive(uart.decrypt(wire));} catch {/* Invalid authentication/replayed frames never become observations. */}
    }
  }, error => channel.cancel(error));
  signal.addEventListener('abort', cancel, {once: true});
  const exchange = (body: Uint8Array, match: (reply: Uint8Array) => boolean) => {
    if (signal.aborted || disconnected) throw new Error('Inspection cancelled or disconnected');
    return channel.send(uart.encrypt(body), match, 2500);
  };
  const ordinaryRead = async (register: number, length: number) => {
    const reply = await exchange(Uint8Array.of(0x20, 1, register, length),
      b => b.length === length + 3 && b[0] === 0x23 && b[1] === 1 && b[2] === register);
    return reply.slice(3);
  };
  try {
    // Verify the same controller telemetry contract already used by Velunivo before probing SHFW.
    const telemetry = await ordinaryRead(0xb4, 16);
    const view = new DataView(telemetry.buffer, telemetry.byteOffset, telemetry.byteLength);
    const batteryPercent = view.getUint16(0, true), speedMetresPerSecond = view.getInt16(2, true) / 3600;
    if (batteryPercent > 100 || speedMetresPerSecond < 0 || speedMetresPerSecond > 0.15) {
      throw new Error('A stationary compatible controller response is required');
    }
    const firmwareBytes = Array.from(await ordinaryRead(0x1a, 2));
    const result: InspectionResult = {schema: 1, probeRevision: 'readonly-shfw-3', capturedAt: new Date().toISOString(),
      provenance: 'authenticated-vehicle-response', firmwareBytes, batteryPercent, speedMetresPerSecond, blocks: {}, failures: []};
    for (const name of Object.keys(inspectionReads) as InspectionRead[]) {
      try {
        const response = await exchange(inspectionReadBody(name), b => inspectionReply(name, b) !== undefined);
        result.blocks[name] = {register: inspectionReads[name].register, bytes: Array.from(inspectionReply(name, response)!), capturedAt: new Date().toISOString()};
      } catch (error) {
        if (signal.aborted || disconnected) throw error;
        result.failures.push(name);
      }
    }
    return result;
  } finally {
    signal.removeEventListener('abort', cancel);
    stopDisconnect(); stop(); channel.close();
  }
}
