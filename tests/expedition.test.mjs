import {addExperimentTrial} from '../src/inquiry.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VERSION,STAGES,OBSERVATIONS,OBSERVE_PAIRS,COMPARES,SORT_ANIMALS,ANIMALS,DISCOVERIES,LINKS,CASES,PROBLEMS,freshExpedition,restoreExpedition,taskReady,claimTask,isStageOpen,recordTrial,availableTools,collectedAnimals,reportDesigns} from '../src/expedition.js';
import {freshState} from '../src/model.js';
import {MAP_NODES,STAGE_NODE,routeBetween} from '../src/trail-map.js';
import {page,notebookContent,toolContent} from '../src/shell-views.js';
import {activityView} from '../src/mission-views.js';

function solve(s,stage,step){
  const r=Math.floor(step/2);
  if(stage===1){if(step%2===0)s.observed.push(...OBSERVE_PAIRS[r].flatMap(id=>OBSERVATIONS[id].map(o=>o.id)));else for(const q of COMPARES[r])s.compares[r][q.key]=`${q.key}-${q.answer}`;}
  if(stage===2){if(r)s.criteria[1]='web';else s.criteria[0]='wings';const key=r?'web':'wings';if(step%2===0)for(const id of SORT_ANIMALS)s.sorts[r][id]=ANIMALS[id][key]?'yes':'no';else if(r){s.inquiry.verify[1].checked='web';s.inquiry.reclass[1]={prediction:'yes',revealed:true};}else s.inquiry.verify[0]={ran:true,cause:'opinion',fix:'wings',checked:'wings'};}
  if(stage===3){if(step%2===0){s.discovered.push(...DISCOVERIES.slice(r*3,r*3+3).map(d=>d.id));for(const d of DISCOVERIES.slice(r*3,r*3+3))s.inquiry.motion[d.animal]=1;}else{const id=r?'crab':'frog';for(const [i,key]of ['environment','body','life'].entries())s.links[id][key]=LINKS[id].answer[i];}}
  if(stage===4){const c=CASES[r],g=[['place','cover'],['place','move'],['place','paws']][r];if(step%2===0)Object.assign(s.cases[r],{opened:[...g],grounds:[...g],candidate:c.animal});else{s.cases[r].habitat=c.habitat;s.cases[r].reason=c.reason;}}
  if(stage===5){const id=r?'protect':'swim',p=PROBLEMS[id];if(step%2===0)Object.assign(s.designs[r],{problem:id,feature:p.feature,structure:p.structure,spot:{swim:'toe',protect:'top',warm:'body'}[id],name:r?'단단모':'물갈퀴 추진기'});else{recordTrial(s,r);completeExperiment(s.designs[r]);s.designs[r].explanation='match';}s.designs[r].experiment.sourceSeen=true;}
}
function completeExperiment(d){d.experiment.sourceSeen=true;d.experiment.prediction='more';d.experiment.level=1;addExperimentTrial(d);d.experiment.level=3;addExperimentTrial(d);d.experiment.reflection='changed';d.experiment.note='폭을 넓혀서 물을 더 많이 밀었어.';}
function complete(s,stage){for(let step=0;step<STAGES[stage-1].tasks.length;step++){solve(s,stage,step);assert.equal(claimTask(s,stage,step).ok,true,`${stage}-${step}`);}}

test('classification has two core activities and other stages have four; a fresh expedition starts with one open place',()=>{
  const s=freshExpedition();assert.equal(STAGES.flatMap(t=>t.tasks).length,24);assert.equal(isStageOpen(s,1),true);for(const id of [0,2,3,4,5,6])assert.equal(isStageOpen(s,id),false);assert.equal(s.activities.length,0);assert.deepEqual(availableTools(s),[]);
});
test('eighteen activities award exactly eighteen stars and five usable tools, without repeat farming',()=>{
  const s=freshExpedition();for(let stage=1;stage<=5;stage++){complete(s,stage);assert.equal(s.activities.length,STAGES.slice(0,stage).flatMap(t=>t.tasks).length);assert.equal(availableTools(s).length,stage);assert.equal(claimTask(s,stage,STAGES[stage-1].tasks.length-1).fresh,false);assert.equal(s.activities.length,STAGES.slice(0,stage).flatMap(t=>t.tasks).length);}
  assert.deepEqual(s.completed,[1,2,3,4,5]);assert.equal(collectedAnimals(s).length,16);
});
test('incomplete / skipped tasks and administrator preview cannot grant completion',()=>{
  const s=freshExpedition();assert.equal(claimTask(s,1,0).ok,false);solve(s,1,3);assert.equal(claimTask(s,1,3).ok,false);s.adminUnlocked=true;assert.equal(isStageOpen(s,5),true);assert.equal(claimTask(s,5,3).ok,false);assert.deepEqual(s.completed,[]);assert.equal(taskReady(s,1,4),false);
});
test('second observation pair needs its own six observations and comparison answers',()=>{
  const s=freshExpedition();solve(s,1,0);assert.equal(taskReady(s,1,2),false);solve(s,1,2);assert.equal(taskReady(s,1,2),true);s.compares[1]={common:'fur',difference:'cover'};assert.equal(taskReady(s,1,3),false);solve(s,1,3);assert.equal(taskReady(s,1,3),true);
});
test('classification ends after sorting and repairing an observable criterion',()=>{
 const s=freshExpedition();s.adminUnlocked=true;solve(s,2,0);assert.equal(claimTask(s,2,0).ok,true);assert.equal(s.completed.includes(2),false);solve(s,2,1);assert.equal(claimTask(s,2,1).stageComplete,true);assert.equal(s.activities.filter(k=>k.startsWith('2-')).length,2);assert.equal(taskReady(s,2,2),false);assert.equal(claimTask(s,2,2).ok,false);
});

test('six habitat discoveries and two different animal relationships are required',()=>{
  const s=freshExpedition();solve(s,3,0);assert.equal(taskReady(s,3,2),false);solve(s,3,2);solve(s,3,1);assert.equal(taskReady(s,3,3),false);solve(s,3,3);assert.equal(taskReady(s,3,3),true);assert.equal(s.discovered.length,6);
});
test('stage four needs the right animal plus two opened clues that rule out every other candidate',()=>{
  const s=freshExpedition(),a=s.cases[0];a.candidate='duck';assert.equal(taskReady(s,4,0),false);a.grounds=['place','cover'];assert.equal(taskReady(s,4,0),false,'grounds must be opened clues');a.opened=['cover','move','life'];a.grounds=['cover','move'];assert.equal(taskReady(s,4,0),false,'a hen fits feathers and walking too');a.opened=['place','cover','move'];a.grounds=['place','cover'];assert.equal(taskReady(s,4,0),true);a.candidate='hen';assert.equal(taskReady(s,4,0),false);a.candidate='duck';a.habitat='pond';assert.equal(taskReady(s,4,1),false);a.reason='paddle';assert.equal(taskReady(s,4,1),true);solve(s,4,2);solve(s,4,3);assert.equal(taskReady(s,4,2),true);assert.equal(taskReady(s,4,3),true);
});
test('two inventions must solve different problems and both need current trial and explanation',()=>{
  const s=freshExpedition();solve(s,5,0);recordTrial(s,0);assert.equal(taskReady(s,5,1),false);s.designs[0].explanation='match';completeExperiment(s.designs[0]);assert.equal(taskReady(s,5,1),true);s.designs[1]=structuredClone(s.designs[0]);assert.equal(taskReady(s,5,2),false);solve(s,5,2);assert.equal(taskReady(s,5,3),false);solve(s,5,3);assert.equal(taskReady(s,5,3),true);s.designs[1].structure='layer';assert.equal(taskReady(s,5,3),false);
});
test('migration keeps old evidence without granting new activity or new stage four credit',()=>{
  const old=freshState();old.completed=[1,2,3,4,5];old.observed=Object.values(OBSERVATIONS).slice(0,2).flat().map(o=>o.id);old.compare={common:'eyes',difference:'cover'};
  const s=restoreExpedition(JSON.stringify(old));assert.deepEqual(s.legacy.completed,[1,2,3,4,5]);assert.deepEqual(s.activities,['1-0','1-1']);assert.deepEqual(s.completed,[]);assert.equal(isStageOpen(s,5),true);assert.equal(s.activities.some(id=>id.startsWith('4-')),false);
});
test('current saves retain completed activities, tools, two designs, lines and bounded history',()=>{
  const s=freshExpedition();for(let stage=1;stage<=5;stage++)complete(s,stage);s.designs[0].strokes=[[[10,20],[30,40]]];s.mapPosition='5';s.toolUses=['1','3'];const out=restoreExpedition(JSON.stringify(s));assert.deepEqual(out,s);
});
test('corrupt saves, prototype names, forged trial flags and out of range lines normalize safely',()=>{
  assert.equal(restoreExpedition('{').version,VERSION);const s=freshExpedition();s.designs[0]={problem:'constructor',feature:'web',structure:'__proto__',name:'x'.repeat(40),strokes:[[[Infinity,1],[-3,400]]],trials:[{problem:'protect',feature:'web',structure:'wide',passed:true}]};const out=restoreExpedition(JSON.stringify(s));assert.equal(out.designs[0].problem,'');assert.equal(out.designs[0].structure,'');assert.equal(out.designs[0].name.length,24);assert.equal(out.designs[0].trials.length,0,'invalid problem cannot keep a foreign trial');assert.deepEqual(out.designs[0].strokes,[[[0,260]]]);
});
test('all route pairs traverse only neighboring graph waypoints and stay on the map',()=>{
  for(const from of ['entrance',...Object.values(STAGE_NODE)])for(const to of Object.values(STAGE_NODE)){const route=routeBetween(from,to);assert.equal(route[0],from);assert.equal(route.at(-1),to);for(const node of route)assert.ok(MAP_NODES[node].every(n=>n>=0&&n<=100));}
  const route=routeBetween('two','three');assert.ok(route.includes('bridge'));assert.ok(route.includes('camp'));assert.ok(route.includes('pondFork'));assert.deepEqual(routeBetween('__proto__','three'),[]);
});
test('new renderers escape learner text in design, result and collection markup',()=>{
  const s=freshExpedition();solve(s,5,0);s.designs[0].name='<img src=x onerror=alert(1)>';const view={stage:5,step:0,round:0,screen:'mission'};const html=activityView(s,view);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src=x'));
  const ending=page(s,{...view,screen:'ending'});assert.ok(!ending.includes('<img src=x'));assert.ok(notebookContent(s).includes('탐험 별'));s.completed=[1];assert.ok(toolContent(s,1).includes('개구리'));
});
test('revisiting a draft cannot replace passed invention and evidence records with untested edits',()=>{
  const s=freshExpedition();for(let stage=1;stage<=5;stage++)complete(s,stage);
  s.designs[0].name='수정 중';s.designs[0].structure='layer';s.cases[0].grounds=[];
  assert.equal(reportDesigns(s)[0].name,'물갈퀴 추진기');assert.equal(reportDesigns(s)[0].structure,'wide');assert.deepEqual(s.records.cases[0].grounds,['place','cover']);assert.equal(taskReady(s,4,1),false);
  const restored=restoreExpedition(JSON.stringify(s));assert.equal(reportDesigns(restored)[0].structure,'wide');assert.deepEqual(restored.records.cases[0].grounds,['place','cover']);
  const legacy=JSON.parse(JSON.stringify(s));legacy.records.cases[0]={traits:['feather','web'],candidate:'duck',habitat:'pond',reason:'paddle'};assert.deepEqual(restoreExpedition(JSON.stringify(legacy)).records.cases[0].grounds,['cover','foot'],'a pre-08 record survives as grounds');
});
test('criterion check room needs the check run, the opinion cause, and a re-checked observable question',()=>{
  const s=freshExpedition(),v=s.inquiry.verify[0];for(const id of SORT_ANIMALS)s.sorts[0][id]=ANIMALS[id].wings?'yes':'no';
  assert.equal(taskReady(s,2,1),false);v.ran=true;v.cause='few';assert.equal(taskReady(s,2,1),false);v.cause='opinion';v.fix='cute';v.checked='cute';assert.equal(taskReady(s,2,1),false,'an opinion question still disagrees');
  v.fix='legs';assert.equal(taskReady(s,2,1),false,'must re-check after fixing');v.checked='legs';assert.equal(taskReady(s,2,1),true);
});
test('screen 09: the right part only works at the right spot, and old saves keep their placed part',async()=>{
  const {testDesign,PRODUCTS,revisions}=await import('../src/expedition.js');
  for(const [problem,p] of Object.entries(PROBLEMS)){const d={problem,feature:p.feature,structure:p.structure,spot:PRODUCTS[problem].spot};assert.equal(testDesign(d).passed,true);
    for(const [spot] of PRODUCTS[problem].spots.filter(x=>x[0]!==PRODUCTS[problem].spot)){const r=testDesign({...d,spot});assert.equal(r.passed,false);assert.equal(r.spot,false);assert.equal(r.structure,true);}}
  const s=freshExpedition();s.designs[0]={...s.designs[0],problem:'swim',feature:'web',structure:'wide',trials:[{problem:'swim',feature:'web',structure:'wide',passed:true}]};delete s.designs[0].spot;
  const out=restoreExpedition(JSON.stringify(s));assert.equal(out.designs[0].spot,'toe');assert.equal(out.designs[0].trials[0].passed,true);
  out.designs[0].spot='ankle';recordTrial(out,0);assert.equal(revisions(out.designs[0]),1);
});

// Old four-task classification saves keep earned progress and never reopen removed tasks.
test('older classification progress and completed commissions survive the shorter route',()=>{
 const s=freshExpedition();s.activities=['2-0','2-1','2-2','2-3'];s.step[2]=3;s.completed=[2];
 s.campaign={version:1,grandfathered:[],drafts:{},records:{'2-0':{answers:{hen:'yes',bat:'yes',bee:'yes',snail:'no'}}}};
 const restored=restoreExpedition(JSON.stringify(s));assert.deepEqual(restored.activities,['2-0','2-1']);assert.ok(restored.completed.includes(2));assert.equal(restored.campaign.records['2-0'].answers.reason,'wings');assert.ok((restored.step[2]||0)<2);
});
test('music switch and volume survive a reload; older saves follow the old single sound switch',()=>{
  const s=freshExpedition();s.musicVolume=.3;s.musicOn=false;
  const out=restoreExpedition(JSON.stringify(s));assert.equal(out.musicVolume,.3);assert.equal(out.musicOn,false);assert.equal(out.soundEnabled,true);
  assert.equal(restoreExpedition(JSON.stringify({...s,musicVolume:4})).musicVolume,.5);
  const {musicOn,...old}=s;assert.equal(restoreExpedition(JSON.stringify({...old,soundEnabled:false})).musicOn,false);
});
