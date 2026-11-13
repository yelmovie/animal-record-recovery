import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExpedition,restoreExpedition,OBSERVATIONS,OBSERVE_PAIRS,OBSERVE_REQUIRED,COMPARES,taskReady,claimTask,isStageOpen} from '../src/expedition.js';
import {ensureCampaign,restoredPlaces} from '../src/campaign.js';
import {activityView} from '../src/mission-views.js';

test('eight animals finish the forest with eight observations and eight comparison answers',()=>{
  const s=freshExpedition();ensureCampaign(s);let answers=0;
  for(const [round,pair] of OBSERVE_PAIRS.entries()){
    assert.equal(taskReady(s,1,round*2),false);
    for(const animal of pair){
      assert.ok(OBSERVATIONS[animal].some(o=>o.id===OBSERVE_REQUIRED[animal]));
      s.observed.push(OBSERVE_REQUIRED[animal]);answers++;
    }
    assert.equal(claimTask(s,1,round*2).ok,true);
    for(const q of COMPARES[round]){s.compares[round][q.key]=`${q.key}-${q.answer}`;answers++;}
    assert.equal(claimTask(s,1,round*2+1).ok,true);
  }
  assert.equal(answers,16);assert.equal(s.observed.length,8);
  assert.deepEqual(restoredPlaces(s),[1]);assert.equal(isStageOpen(s,2),true);
  assert.deepEqual(s.campaign.records,{},'optional commissions are not fabricated');
  const back=restoreExpedition(JSON.stringify(s));
  assert.deepEqual(back.observed,s.observed);assert.deepEqual(restoredPlaces(back),[1]);
});

test('optional parts show explanations without creating answer records',()=>{
  const s=freshExpedition();
  for(const use3d of [true,false]){
    const html=activityView(s,{stage:1,step:0,focusIndex:0,use3d});
    assert.doesNotMatch(html,/data-action="observe"/);
    assert.match(html,/머리 위쪽에 튀어나온 눈/);
    assert.match(html,/핵심 특징/);
  }
  assert.deepEqual(s.observed,[]);assert.equal(taskReady(s,1,0),false);
});

test('comparison shows three direct choices for one unanswered question',()=>{
  const s=freshExpedition();
  let html=activityView(s,{stage:1,step:1});
  assert.equal((html.match(/data-action="compare-answer"/g)||[]).length,3);
  assert.doesNotMatch(html,/data-drag|data-drop-action/);
  assert.match(html,/같은 점은/);
  s.compares[0].common='common-eyes';
  html=activityView(s,{stage:1,step:1});assert.match(html,/다른 점은/);
  assert.equal((html.match(/data-action="compare-answer"/g)||[]).length,3);
});

test('older complete and partial observation records survive the shortened route',()=>{
  const s=freshExpedition();s.observed=['frog-eye','frog-skin','crab-shell'];
  s.observeTries={'frog-eye':'helped','frog-skin':'first'};s.ahaPicks={'frog-skin':1};
  s.activities=['1-0'];s.step[1]=1;
  const back=restoreExpedition(JSON.stringify(s));
  assert.deepEqual(back.observed,s.observed);assert.deepEqual(back.observeTries,s.observeTries);
  assert.deepEqual(back.ahaPicks,s.ahaPicks);assert.equal(taskReady(back,1,0),true);
  assert.equal(taskReady(back,1,2),false);assert.deepEqual(back.activities,['1-0']);
});
