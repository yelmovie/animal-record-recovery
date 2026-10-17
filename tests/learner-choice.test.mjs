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

test('own criterion: opinions are refused with a reason, observable ones regroup the animals',()=>{
  const s=freshExpedition();s.criteria[1]='scary';
  assert.match(taskMistake(s,2,2).text,/사람마다 답이 달라/);
  for(const key of OWN_CRITERIA){
    assert.ok(CRITERIA[key]);
    assert.ok(SORT_ANIMALS.some(id=>ANIMALS[id][key]!==ANIMALS[id].wings),key+' must move someone from the wings grouping');
  }
  s.criteria[1]='web';for(const id of SORT_ANIMALS)s.sorts[1][id]=ANIMALS[id].web?'yes':'no';
  assert.equal(taskReady(s,2,2),true);
  assert.match(activityView(s,{stage:2,step:2}),/내가 만든 분류 기준/);
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
