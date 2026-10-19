import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStudio,normalizeStudio,studioDrawingReady,studioReady,studioHint} from '../src/studio.js';
import {freshExpedition,restoreExpedition,taskReady,claimTask,taskMistake} from '../src/expedition.js';
import {campaignFixture} from './fixtures/campaign-state.mjs';

const artwork=()=>({version:1,title:'날개 달린 우산',audience:'비 오는 날 걸어가는 친구',purpose:'날개가 우산을 들어 주면 두 손으로 가방을 잡을 수 있어.',inspiration:'나비의 넓은 날개에서 생각했어.',strokes:[{color:'#e69b24',width:8,points:[{x:120,y:100},{x:300,y:250}]}]});

test('studio accepts freely authored ideas without a fixed product or correct picture',()=>{
  const draft=createStudio();
  assert.equal(studioDrawingReady(draft),false);
  draft.strokes=artwork().strokes;
  assert.match(studioHint(draft,2),/이름/);
  draft.title='상상하는 어떤 발명';
  assert.equal(studioDrawingReady(draft),true);
  assert.equal(studioReady(draft),false);
  assert.match(studioHint(draft,3),/누구/);
  assert.equal(studioReady(artwork()),true);
  assert.equal(studioDrawingReady({...artwork(),strokes:[{color:'#ffffff',width:20,points:[{x:1,y:1}]}]}),false,'eraser marks alone are not a drawing');
});

test('studio restores bounded text and finite drawing points without sharing mutable data',()=>{
  const source={...artwork(),title:'가'.repeat(90),purpose:'나'.repeat(400),strokes:[{color:'url(unsafe)',width:Infinity,points:[null,{x:NaN,y:0},{x:-30,y:900}]},...Array.from({length:180},()=>({color:'#ABCDEF',width:60,points:Array.from({length:300},()=>({x:10,y:20}))}))]};
  const clean=normalizeStudio(source);
  assert.equal(clean.title.length,48);
  assert.equal(clean.purpose.length,300);
  assert.equal(clean.strokes.length,160);
  assert.equal(clean.strokes[0].color,'#294d40');
  assert.deepEqual(clean.strokes[0].points,[{x:0,y:650}]);
  assert.equal(clean.strokes[1].color,'#abcdef');
  assert.equal(clean.strokes[1].width,60);
  assert.equal(clean.strokes[1].points.length,250);
  source.strokes[1].points[0].x=900;
  assert.equal(clean.strokes[1].points[0].x,10);
  for(const invalid of [null,[],false,'bad'])assert.deepEqual(normalizeStudio(invalid),createStudio());
});

test('creative tasks require earlier work, save a separate artwork, and retain it while the draft changes',()=>{
  const s=freshExpedition();s.adminUnlocked=true;s.studio=artwork();
  assert.equal(taskReady(s,5,2),true);
  assert.equal(claimTask(s,5,2).ok,false,'a drawing cannot skip the two introductory activities');
  s.activities=['5-0','5-1'];
  assert.equal(claimTask(s,5,2).ok,true);
  s.studio.purpose='';
  assert.equal(claimTask(s,5,3).ok,false);
  assert.match(taskMistake(s,5,3).text,/어떻게/);
  s.studio.purpose=artwork().purpose;
  assert.equal(claimTask(s,5,3).stageComplete,true);
  assert.equal(s.records.designs[1],null,'an open artwork is not a second preset product');
  assert.deepEqual(s.studioRecord,normalizeStudio(artwork()));
  s.studio.title='수정 중';s.studio.strokes[0].points[0].x=555;
  assert.equal(s.studioRecord.title,'날개 달린 우산');
  assert.equal(s.studioRecord.strokes[0].points[0].x,120);
  const restored=restoreExpedition(JSON.stringify(s));
  assert.deepEqual(restored.studio,normalizeStudio(s.studio));
  assert.deepEqual(restored.studioRecord,normalizeStudio(artwork()));
  assert.equal(claimTask(restored,5,3).fresh,false,'editing does not duplicate stars');
});

test('a draft cannot appear as a completed artwork, and legacy invention records still restore',()=>{
  const s=freshExpedition();s.studio=artwork();s.studioRecord=artwork();
  assert.equal(restoreExpedition(JSON.stringify(s)).studioRecord,null);
  s.activities=['5-0','5-1','5-2','5-3'];s.studioRecord.purpose='';
  assert.equal(restoreExpedition(JSON.stringify(s)).studioRecord,null);
  const legacy=campaignFixture();delete legacy.studio;delete legacy.studioRecord;
  const restored=restoreExpedition(JSON.stringify(legacy));
  assert.equal(restored.activities.length,18);
  assert.equal(restored.studio,null);
  assert.equal(restored.studioRecord,null);
  assert.deepEqual(restored.records.designs,legacy.records.designs);
  assert.equal(taskReady(restored,5,3),true);
});
