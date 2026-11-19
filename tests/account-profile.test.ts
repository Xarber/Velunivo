import test from 'node:test';
import assert from 'node:assert/strict';
import { accountReturnFailed, defaultAccountProfile } from '../src/core/accountProfile';

test('account settings can render on React Native with a window shim and no browser location', () => {
  const nativeWindow = { get location(): never { throw Error('Native code must not query browser location'); } };
  assert.equal(accountReturnFailed('ios', nativeWindow), false);
  assert.equal(accountReturnFailed('android', {}), false);
  assert.equal(accountReturnFailed('web', {}), false);
  assert.equal(accountReturnFailed('web', { location: { search: '?account=failed' } }), true);
});

test('account defaults fill an empty profile and preserve custom and explicitly cleared profiles', () => {
  const picture = 'data:image/jpeg;base64,test';
  const profile = { name: ' Rider ', preferred_username: 'rider' };
  assert.deepEqual(defaultAccountProfile({ groupName: '' }, {}, profile, picture), { groupName: 'Rider', groupPhoto: picture });
  assert.deepEqual(defaultAccountProfile({ groupName: '' }, {}, { preferred_username: 'rider' }), { groupName: 'rider' });
  assert.deepEqual(defaultAccountProfile({ groupName: '' }, {}, {}, picture), { groupPhoto: picture });
  assert.equal(defaultAccountProfile({ groupName: 'Custom' }, {}, profile, picture), undefined);
  assert.equal(defaultAccountProfile({ groupName: '', groupPhoto: picture }, {}, profile), undefined);
  assert.equal(defaultAccountProfile({ groupName: '' }, {
    'navigation.groupPhoto': { value: null, modifiedAt: 20, configured: true },
  }, profile, picture), undefined);
});
