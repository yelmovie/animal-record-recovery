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

test('music ducks by label: it comes back only when every voice has let go, and a volume sync does not undo it', async () => {
  const {duckMusic,setMusicVolume,musicLevel,MUSIC_DUCK,MUSIC_FILES}=await import('../src/audio.js');
  setMusicVolume(.5);assert.equal(musicLevel(), .5);
  const popup=duckMusic('popup'),npc=duckMusic('npc');
  assert.equal(MUSIC_DUCK, .25);assert.equal(musicLevel(), .125);
  setMusicVolume(.5);assert.equal(musicLevel(), .125, 'a redraw-time volume sync keeps the duck');
  setMusicVolume(.8);assert.equal(musicLevel(), .2, 'the slider moves the ducked level too');
  popup();assert.equal(musicLevel(), .2, 'one voice ending does not release another voice');
  popup();npc();assert.equal(musicLevel(), .8);
  const again=duckMusic('npc');duckMusic('npc');again();assert.equal(musicLevel(), .8, 'one label is one hold, however often it is taken');
  setMusicVolume(.5);
  // Both songs ship: the village theme and the finale song (map finale dialog, certificate screen).
  assert.deepEqual(MUSIC_FILES, ['assets/music/village-theme.mp3','assets/music/finale-theme.mp3']);
  for(const file of MUSIC_FILES)assert.ok(existsSync(new URL('../'+file, import.meta.url)), `${file} is missing`);
});
