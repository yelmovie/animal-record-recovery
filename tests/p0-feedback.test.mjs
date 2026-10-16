import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeInquiry} from '../src/inquiry.js';
import {freshExpedition,taskReady,taskMistake,DISCOVERIES,SORT_ANIMALS,ANIMALS} from '../src/expedition.js';
import {activityView} from '../src/mission-views.js';

test('movement scene only counts at the moment the body part pushes',()=>{
  const s=freshExpedition();s.discovered=DISCOVERIES.slice(0,3).map(d=>d.id);
  for(const d of DISCOVERIES.slice(0,3))s.inquiry.motion[d.animal]=0;
  assert.equal(taskReady(s,3,0),false);
  assert.match(taskMistake(s,3,0).text,/뒷다리가 땅을 뒤로 미는 순간/);
  for(const d of DISCOVERIES.slice(0,3))s.inquiry.motion[d.animal]=1;
  assert.equal(taskReady(s,3,0),true);
  assert.deepEqual(normalizeInquiry({motion:{rabbit:0,frog:1}}).motion,{frog:1});
});

test('stage 4 never prints the meeting place next to its question',()=>{
  const s=freshExpedition();
  const html=activityView(s,{stage:4,step:1});
  assert.doesNotMatch(html,/연못과 물가에서 만났어/);
  assert.match(html,/case-place/);
});

test('a wrong answer names and marks the card to look at again',()=>{
  const s=freshExpedition();
  for(const id of SORT_ANIMALS)s.sorts[0][id]=ANIMALS[id].wings?'yes':'no';
  s.sorts[0].butterfly='no';
  const m=taskMistake(s,2,0);
  assert.deepEqual(m.wrong,['sort:butterfly']);
  assert.match(m.text,/나비/);
  assert.match(activityView(s,{stage:2,step:0,feedback:m}),/animal-card answered retry/);
  s.compares[0]={common:'feathers',difference:'cover'};
  const c=taskMistake(s,1,1);
  assert.deepEqual(c.wrong,['compare:common']);
  assert.match(c.text,/깃털은 못 봤어/);
  s.cases[1]={traits:['ears','fur'],candidate:'rabbit',habitat:'pond',reason:'jump'};s.inquiry.evidence[1]=['ears','fur'];
  assert.deepEqual(taskMistake(s,4,3).wrong,['case:habitat']);
});
