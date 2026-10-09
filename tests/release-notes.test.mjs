import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conventionalChanges } from '../scripts/conventional-changes.mjs';
test('multiple conventional clauses get separate release-note groups', () => {
  assert.deepEqual(conventionalChanges('feat: Scheduled navigation; fix: Speed limit'), [{ type: 'feat', text: 'Scheduled navigation' }, { type: 'fix', text: 'Speed limit' }]);
  assert.deepEqual(conventionalChanges('fix(audio)!: Duck speech; preserve music'), [{ type: 'fix', text: 'BREAKING: audio: Duck speech; preserve music' }]);
});
