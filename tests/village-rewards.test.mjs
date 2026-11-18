import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {REWARD_CARDS,ownedRewardCards,newRewardCards} from '../src/village-rewards.js';
import {normalizeVillageEncounters} from '../src/village-encounters.js';
import {STAGES} from '../src/expedition.js';
import {REWARD_SOUNDS,soundName} from '../src/audio.js';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('one card per map villain, in the villain order, named after the place on screen',()=>{
  assert.deepEqual(REWARD_CARDS.map(card=>card.id),Object.keys(normalizeVillageEncounters({stamp:1,label:1,flip:1,photo:1,plans:1})));
  assert.deepEqual(REWARD_CARDS.map(card=>card.stage),STAGES.map(stage=>stage.name));
  for(const card of REWARD_CARDS)assert.ok(card.title.length>3&&card.title.length<=12,card.title);
});

test('a card is owned only when its villain took all three hits; nothing extra is saved',()=>{
  assert.deepEqual(ownedRewardCards(undefined),[false,false,false,false,false]);
  assert.deepEqual(ownedRewardCards({}),[false,false,false,false,false]);
  assert.deepEqual(ownedRewardCards({stamp:3,label:2,flip:1,plans:3}),[true,false,false,false,true]);
});

test('a card appears only on the hit that takes a villain from under three to three',()=>{
  assert.deepEqual(newRewardCards({},{stamp:1}),[]);
  assert.deepEqual(newRewardCards({stamp:1},{stamp:2}),[]);
  assert.deepEqual(newRewardCards({stamp:2},{stamp:3}),[0]);
  assert.deepEqual(newRewardCards({stamp:3},{stamp:3}),[],'an already defeated villain never shows its card again');
  assert.deepEqual(newRewardCards({stamp:3,photo:2},{stamp:3,photo:3}),[3],'the save patch repeats earlier hits of the same visit');
  assert.deepEqual(newRewardCards(undefined,{plans:3}),[4]);
});

test('card art, thumbnails and sounds ship with the build and the page loads the card styles',()=>{
  const build=read('scripts/build.mjs');
  REWARD_CARDS.forEach((card,index)=>{
    for(const kind of ['card','thumb'])assert.ok(existsSync(new URL(`../assets/reward-cards/${kind}-${index+1}-${card.id}.webp`,import.meta.url)),`${kind}-${index+1}-${card.id}.webp is missing`);
  });
  assert.match(build,/REWARD_CARDS/);
  assert.match(build,/REWARD_SOUNDS/);
  assert.match(build,/src\/reward-cards\.css/);
  assert.match(read('index.html'),/href="\.\/src\/reward-cards\.css"/);
  assert.equal(REWARD_SOUNDS.length,5);
  for(const name of REWARD_SOUNDS){
    assert.equal(soundName(name),name);
    assert.ok(existsSync(new URL(`../assets/sfx/${name}.mp3`,import.meta.url)),`${name}.mp3 is missing`);
  }
});
