// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectionReads, inspectionReadBody, inspectionReply, inspectMiSession, InspectionRead} from '../scripts/m365-inspection/protocol';
import {MiUART} from '../src/bluetooth/plugins/miAuth';
import type {BLELink} from '../src/bluetooth/types';

test('research reads reject arbitrary register names and cannot be changed into writes', () => {
  for (const name of Object.keys(inspectionReads) as InspectionRead[]) {
    assert.equal(inspectionReadBody(name)[1], 0x31);
    assert.equal(Object.isFrozen(inspectionReads[name]), true);
  }
  for (const bad of ['__proto__', 'constructor', 'shutdown', '0x70']) {
    assert.throws(() => inspectionReadBody(bad as InspectionRead), /allowlisted/);
  }
});

test('profile research cannot confuse ordinary B2 lock status with SHFW replies', () => {
  const good = Uint8Array.of(0x23, 0x31, 0xb2, 3, 0);
  assert.deepEqual(inspectionReply('activeProfile', good), Uint8Array.of(3, 0));
  for (const bad of [Uint8Array.of(0x23, 1, 0xb2, 3, 0), Uint8Array.of(0x25, 0x31, 0xb2, 3, 0),
    Uint8Array.of(0x23, 0x31, 0xb3, 3, 0), good.slice(0, -1), Uint8Array.from([...good, 0])]) {
    assert.equal(inspectionReply('activeProfile', bad), undefined);
  }
});

test('fixed survey reads cover the 8-bit word window without running past its end', () => {
  const windows = Object.entries(inspectionReads).filter(([name]) => name.startsWith('window'));
  assert.equal(windows.length, 16);
  assert.deepEqual(windows.map(([, read]) => read.register), Array.from({length: 16}, (_, i) => i * 16));
  for (const [name, read] of windows) {
    assert.equal(read.length, 32);
    assert.ok(read.register + read.length / 2 <= 256);
    assert.equal(inspectionReadBody(name as InspectionRead)[1], 0x31);
  }
});

function fixture(speed = 0) {
  const app = new Uint8Array(16).fill(1), device = new Uint8Array(16).fill(2);
  const appIV = Uint8Array.of(1, 2, 3, 4), deviceIV = Uint8Array.of(5, 6, 7, 8);
  const random = (length: number) => new Uint8Array(length);
  const client = new MiUART({app, device, appIV, deviceIV}, random);
  const peer = new MiUART({app: device, device: app, appIV: deviceIV, deviceIV: appIV}, random);
  const sent: number[][] = [];
  let receive = (_bytes: Uint8Array) => {}, stopped = false;
  const link: BLELink = {
    device: {id: 'synthetic-only', name: null, rssi: null, services: []},
    hasCharacteristic: async () => true,
    onDisconnect: () => () => {}, disconnect: async () => {}, readRSSI: async () => null,
    monitor: (_service, _characteristic, listener) => {receive = listener; return () => {stopped = true;};},
    write: async (_service, _characteristic, wire) => {
      const body = peer.decrypt(wire); sent.push(Array.from(body));
      assert.equal(body[0], 0x20);
      const length = body[3];
      const data = new Uint8Array(length);
      if (body[1] === 1 && body[2] === 0xb4) {
        data[0] = 60; new DataView(data.buffer).setInt16(2, speed, true);
      } else if (body[1] === 1 && body[2] === 0x1a) {data.set([0x22, 3]);}
      else if (body[1] === 1 && body[2] === 0x75) {data.set([2, 0]);}
      else {
        assert.equal(body[1], 0x31); assert.equal(body[4], 0);
        assert.ok(Object.values(inspectionReads).some(r => r.register === body[2] && r.length === length));
        data[0] = 3;
      }
      const response = peer.encrypt(Uint8Array.from([0x23, body[1], body[2], ...data]));
      for (let offset = 0; offset < response.length; offset += 20) receive(response.slice(offset, offset + 20));
    },
  };
  return {client, link, sent, stopped: () => stopped};
}

test('authenticated fragmented synthetic responses produce raw blocks, without settings writes or secret export', async () => {
  const f = fixture();
  const result = await inspectMiSession(f.link, f.client, new AbortController().signal);
  assert.equal(Object.keys(result.blocks).length, Object.keys(inspectionReads).length);
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.blocks.activeProfile?.bytes, [3, 0]);
  assert.equal(result.ridingMode?.rawWord, 2);
  assert.equal(f.sent.length, Object.keys(inspectionReads).length + 3); assert.equal(f.stopped(), true);
  assert.equal(/token|appIV|deviceIV|serial|synthetic-only/.test(JSON.stringify(result)), false);
});

test('movement prevents candidate configuration reads and always cleans up', async () => {
  const f = fixture(3600);
  await assert.rejects(inspectMiSession(f.link, f.client, new AbortController().signal), /stationary/);
  assert.equal(f.sent.length, 1); assert.equal(f.stopped(), true);
});

test('an already-cancelled inspection sends no Bluetooth operations', async () => {
  const f = fixture(), controller = new AbortController(); controller.abort();
  await assert.rejects(inspectMiSession(f.link, f.client, controller.signal), /cancelled/);
  assert.equal(f.sent.length, 0);
});

test('cancellation after an immediate telemetry reply prevents all later research reads', async () => {
  const f = fixture(), controller = new AbortController(), write = f.link.write;
  f.link.write = async (...args) => {await write(...args); controller.abort();};
  await assert.rejects(inspectMiSession(f.link, f.client, controller.signal), /cancelled/);
  assert.equal(f.sent.length, 1); assert.equal(f.stopped(), true);
});
