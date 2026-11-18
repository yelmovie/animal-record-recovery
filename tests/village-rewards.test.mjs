import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {REWARD_CARDS,ownedRewardCards,newRewardCards,awardRewardCard,rewardCardDue} from '../src/village-rewards.js';
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

test('a won card holds the map from its turn until it is put away, and waits while a dialog covers the map',async()=>{
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let onMap=true;
  awardRewardCard(0,()=>({stamp:3}),()=>onMap,30,()=>true);
  assert.equal(rewardCardDue(),false,'the villain is still leaving');
  await sleep(80);
  assert.equal(rewardCardDue(),true,'the card is waiting for the dialog, so the finale has to wait too');
  onMap=false;
  await sleep(400);
  assert.equal(rewardCardDue(),false,'leaving the map gives the turn back');
  const app=read('src/adventure-app.js');
  assert.match(app,/isBlocked:\(\)=>[^,]*rewardCardDue\(\)/);
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
