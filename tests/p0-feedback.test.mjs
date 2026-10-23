import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeInquiry} from '../src/inquiry.js';
import {freshExpedition,taskReady,taskMistake,DISCOVERIES,SORT_ANIMALS,ANIMALS} from '../src/expedition.js';
import {activityView} from '../src/mission-views.js';

test('movement completion needs a record for each animal and points to playback and one photo',()=>{
  const s=freshExpedition();s.discovered=DISCOVERIES.slice(0,3).map(d=>d.id);
  for(const d of DISCOVERIES.slice(0,3))s.inquiry.motion[d.animal]=0;
  assert.equal(taskReady(s,3,0),false);
  assert.match(taskMistake(s,3,0).text,/토끼: 영상을 재생하고 전시 사진 한 장/);
  assert.doesNotMatch(taskMistake(s,3,0).text,/순간을 찾아/);
  for(const d of DISCOVERIES.slice(0,3))s.inquiry.motion[d.animal]=1;
  assert.equal(taskReady(s,3,0),true);
  assert.deepEqual(normalizeInquiry({motion:{rabbit:0,frog:1}}).motion,{frog:1});
});

test('stage 4 never prints the meeting place next to its question',()=>{
  const s=freshExpedition();
  const html=activityView(s,{stage:4,step:1});
  assert.doesNotMatch(html,/연못과 물가에서 만났어/);
  assert.match(html,/journey-evidence-photo/);
});

test('a wrong answer names and marks the card to look at again',()=>{
  const s=freshExpedition();
  for(const id of SORT_ANIMALS)s.sorts[0][id]=ANIMALS[id].wings?'yes':'no';
  s.sorts[0].bat='no';
  const m=taskMistake(s,2,0);
  assert.deepEqual(m.wrong,['sort:bat']);
  assert.match(m.text,/박쥐/);
  assert.match(activityView(s,{stage:2,step:0,feedback:m}),/animal-card answered retry/);
  s.compares[0]={common:'common-feathers',difference:'difference-cover'};
  const c=taskMistake(s,1,1);
  assert.deepEqual(c.wrong,['compare:common']);
  assert.match(c.text,/깃털은 못 봤어/);
  s.cases[1]={opened:['place','move'],grounds:['place','move'],candidate:'rabbit',habitat:'pond',reason:'jump'};
  assert.deepEqual(taskMistake(s,4,3).wrong,['case:habitat']);
});
