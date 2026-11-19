import test from 'node:test';
import assert from 'node:assert/strict';
import {afterVillainLine} from '../src/popup-voice.js';

test('a resident voice starts at once when no villain line is playing', () => {
  let started = 0;
  afterVillainLine(() => started++);
  assert.equal(started, 1);
});
