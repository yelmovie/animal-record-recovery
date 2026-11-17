import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {soundName,encounterSound,ENCOUNTER_SOUNDS} from '../src/audio.js';
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

test('map villain events map to their own sounds and every file ships', () => {
  assert.equal(encounterSound('swing',1), 'encounter-swing');
  assert.equal(encounterSound('hit',1), 'encounter-one');
  assert.equal(encounterSound('hit',2), 'encounter-two');
  assert.equal(encounterSound('finish',3), 'encounter-heavy');
  assert.equal(encounterSound('exit',3), 'encounter-exit');
  assert.equal(encounterSound('appear',0), 'encounter-appear');
  assert.equal(encounterSound('contact',0), 'encounter-contact');
  assert.equal(encounterSound('victory',0), 'encounter-victory');
  assert.equal(encounterSound('unknown',0), null);
  for(const name of ENCOUNTER_SOUNDS){
    assert.equal(soundName(name), name);
    assert.ok(existsSync(new URL(`../assets/sfx/${name}.mp3`, import.meta.url)), `${name}.mp3 is missing`);
  }
});
