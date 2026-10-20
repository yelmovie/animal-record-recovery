import test from 'node:test';
import assert from 'node:assert/strict';
import {soundName} from '../src/audio.js';
import {withParticle} from '../src/korean.js';

test('synth-only sounds keep their own voice instead of falling back to tap', () => {
  assert.equal(soundName('drop'), 'drop');
  assert.equal(soundName('star'), 'star');
  assert.equal(soundName(true), 'correct');
  assert.equal(soundName(false), 'tap');
  assert.equal(soundName('nope'), 'tap');
  assert.equal(soundName(undefined), 'tap');
});

test('dynamic place names get the right particle', () => {
  assert.equal(withParticle('안전모'), '안전모를');
  assert.equal(withParticle('생태의 물가','으로/로'), '생태의 물가로');
  assert.equal(withParticle('관찰의 숲','이야/야'), '관찰의 숲이야');
  assert.equal(withParticle('‘물갈퀴’','은/는'), '‘물갈퀴’는');
});
