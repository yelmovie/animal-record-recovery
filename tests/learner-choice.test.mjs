import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExpedition,restoreExpedition,taskReady,taskMistake,OBSERVATIONS,LINKS,SORT_ANIMALS,ANIMALS,OWN_CRITERIA,CRITERIA} from '../src/expedition.js';
import {activityView} from '../src/mission-views.js';

test('observation shows the description only after the learner picks it from three',()=>{
  const s=freshExpedition(),o=OBSERVATIONS.frog[0];
  const html=activityView(s,{stage:1,step:0,focusIndex:0});
  assert.equal((html.match(/data-action="observe"/g)||[]).length,3);
  assert.match(html,/data-value="right"/);
  for(const list of Object.values(OBSERVATIONS))for(const x of list)assert.equal(x.wrong.length,2,x.id);
  s.observed.push(o.id);
  assert.match(activityView(s,{stage:1,step:0,focusIndex:0}),/기록했어/);
});

test('comparison screen no longer prints the observed answers next to the questions',()=>{
  const html=activityView(freshExpedition(),{stage:1,step:1});
  assert.doesNotMatch(html,/자루 끝에 달린 눈이 있어/);
});

test('classification uses O/X and no longer repeats the second sorting round',()=>{
 const s=freshExpedition(),html=activityView(s,{stage:2,step:0});
 assert.match(html,/O 분류 칸/);assert.match(html,/X 분류 칸/);assert.doesNotMatch(html,/예 게이트|아니요 게이트/);
 assert.equal(taskReady(s,2,2),false);assert.equal(taskReady(s,2,3),false);
});

test('stage 3 round two links the crab found that round, and old rabbit links are dropped on load',()=>{
  const s=freshExpedition();
  assert.deepEqual(Object.keys(s.links),['frog','crab']);
  LINKS.crab.answer.forEach((v,i)=>s.links.crab[['environment','body','life'][i]]=v);
  assert.equal(taskReady(s,3,3),true);
  const old=JSON.stringify({...freshExpedition(),links:{frog:{},rabbit:{environment:'forest'}},criteria:['cute','four']});
  const back=restoreExpedition(old);
  assert.deepEqual(back.links.crab,{});
  assert.deepEqual(back.criteria,['cute','']);
});
