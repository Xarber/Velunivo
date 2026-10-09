import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CameraTracker, headingDelta } from '../src/core/camera';
const sample = (heading: number, lon = 9): { position: [number, number]; heading: number } => ({ position: [lon, 45], heading });
test('camera lets overview-to-follow transition finish and coalesces the latest turn', () => {
  const camera = new CameraTracker();
  assert.equal(camera.next(sample(0), 'follow', 1000)?.duration, 900);
  assert.equal(camera.next(sample(15), 'follow', 1300), null);
  assert.equal(camera.next(sample(30), 'follow', 1700), null);
  assert.equal(camera.next(sample(35), 'follow', 2000)?.heading, 35);
});
test('camera deadzones suppress jitter but slow movement is not held forever', () => {
  const camera = new CameraTracker();
  camera.next(sample(0), 'flat', 0);
  assert.equal(camera.next(sample(2, 9.00001), 'flat', 1200), null);
  assert.equal(camera.next(sample(2, 9.00001), 'flat', 2600)?.heading, 2);
  assert.equal(camera.next(sample(2, 9.00001), 'flat', 6000), null);
});
test('camera handles compass wraparound and deliberate mode changes immediately', () => {
  assert.equal(headingDelta(359, 1), 2);
  assert.equal(headingDelta(1, 359), -2);
  const camera = new CameraTracker(); camera.next(sample(359), 'flat', 0);
  assert.equal(camera.next(sample(1), 'flat', 1500), null);
  assert.equal(camera.next(sample(1), 'tilted', 1600, true)?.duration, 0);
  camera.reset(); assert.equal(camera.next(sample(50), 'tilted', 1700)?.duration, 900);
});
