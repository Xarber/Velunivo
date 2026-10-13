import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {patchH3Source, originalDecoder, compatibleDecoder, applyH3Patch} from '../scripts/patch-h3.mjs';

class Utf8OnlyDecoder extends TextDecoder {
  constructor(encoding = 'utf-8', options) {
    if (!['utf8', 'utf-8'].includes(encoding.toLowerCase())) throw new RangeError(`Unknown encoding: ${encoding}`);
    super(encoding, options);
  }
}
function load(source, Decoder) {
  const exports = {};
  vm.runInNewContext(source, {exports, TextDecoder: Decoder, console}, {timeout: 10000});
  return exports;
}
test('actual H3 bundle reproduces native startup failure and works with the guarded decoder', () => {
  for (const entry of ['dist/h3-js.js', 'dist/browser/h3-js.js']) {
    const source = fs.readFileSync(`node_modules/h3-js/${entry}`, 'utf8').replace(compatibleDecoder, originalDecoder);
    assert.throws(() => load(source, Utf8OnlyDecoder), /Unknown encoding: utf-16le/);
    for (const Decoder of [Utf8OnlyDecoder, TextDecoder, undefined]) {
      const h3 = load(patchH3Source(source), Decoder);
      const cell = h3.latLngToCell(41.89, 12.49, 10);
      assert.equal(h3.isValidCell(cell), true);
      assert.equal(h3.getResolution(cell), 10);
      assert.equal(h3.cellToBoundary(cell).length, 6);
      assert.ok(h3.cellsToMultiPolygon(h3.gridDisk(cell, 1), true)[0][0].length > 6);
    }
  }
});
test('dependency patch is idempotent and rejects unreviewed source changes', () => {
  assert.equal(patchH3Source(patchH3Source(originalDecoder)), compatibleDecoder);
  assert.throws(() => patchH3Source('different upstream source'), /source changed/);
  applyH3Patch();
  applyH3Patch();
  for (const entry of ['dist/h3-js.js', 'dist/h3-js.es.js', 'dist/browser/h3-js.js', 'dist/browser/h3-js.es.js']) {
    assert.ok(fs.readFileSync(`node_modules/h3-js/${entry}`, 'utf8').includes(compatibleDecoder));
  }
});
