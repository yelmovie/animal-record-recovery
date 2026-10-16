import {addExperimentTrial} from '../src/inquiry.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {STAGES,OBSERVATIONS,OBSERVE_PAIRS,COMPARES,SORT_ANIMALS,ANIMALS,DISCOVERIES,LINKS,CASES,PROBLEMS,freshExpedition,restoreExpedition,taskReady,claimTask,isStageOpen,recordTrial,availableTools,collectedAnimals,reportDesigns} from '../src/expedition.js';
import {freshState} from '../src/model.js';
import {MAP_NODES,STAGE_NODE,routeBetween} from '../src/trail-map.js';
import {page,notebookContent,toolContent} from '../src/shell-views.js';
import {activityView} from '../src/mission-views.js';

function solve(s,stage,step){
  const r=Math.floor(step/2);
  if(stage===1){if(step%2===0)s.observed.push(...OBSERVE_PAIRS[r].flatMap(id=>OBSERVATIONS[id].map(o=>o.id)));else for(const q of COMPARES[r])s.compares[r][q.key]=q.answer;}
  if(stage===2){if(r)s.criteria[1]='web';else s.criteria[0]='wings';const key=r?'web':'wings';if(step%2===0)for(const id of SORT_ANIMALS)s.sorts[r][id]=ANIMALS[id][key]?'yes':'no';else s.inquiry.reclass[r]={prediction:'yes',revealed:true};}
  if(stage===3){if(step%2===0){s.discovered.push(...DISCOVERIES.slice(r*3,r*3+3).map(d=>d.id));for(const d of DISCOVERIES.slice(r*3,r*3+3))s.inquiry.motion[d.animal]=1;}else{const id=r?'crab':'frog';for(const [i,key]of ['environment','body','life'].entries())s.links[id][key]=LINKS[id].answer[i];}}
  if(stage===4){const c=CASES[r];if(step%2===0){s.inquiry.evidence[r]=[...c.correct];s.cases[r].traits=[...c.correct];s.cases[r].candidate=c.animal;}else{s.cases[r].habitat=c.habitat;s.cases[r].reason=c.reason;}}
  if(stage===5){const id=r?'protect':'swim',p=PROBLEMS[id];if(step%2===0)Object.assign(s.designs[r],{problem:id,feature:p.feature,structure:p.structure,name:r?'단단모':'물갈퀴 추진기'});else{recordTrial(s,r);completeExperiment(s.designs[r]);s.designs[r].explanation='match';}s.designs[r].experiment.sourceSeen=true;}
}
function completeExperiment(d){d.experiment.sourceSeen=true;d.experiment.prediction='more';d.experiment.level=1;addExperimentTrial(d);d.experiment.level=3;addExperimentTrial(d);d.experiment.reflection='changed';d.experiment.note='폭을 넓혀서 물을 더 많이 밀었어.';}
function complete(s,stage){for(let step=0;step<4;step++){solve(s,stage,step);assert.equal(claimTask(s,stage,step).ok,true,`${stage}-${step}`);}}

test('each stage has four distinct activities; a fresh expedition starts with one open place',()=>{
  const s=freshExpedition();assert.equal(STAGES.flatMap(t=>t.tasks).length,20);assert.equal(isStageOpen(s,1),true);for(const id of [0,2,3,4,5,6])assert.equal(isStageOpen(s,id),false);assert.equal(s.activities.length,0);assert.deepEqual(availableTools(s),[]);
});
test('twenty activities award exactly twenty stars and five usable tools, without repeat farming',()=>{
  const s=freshExpedition();for(let stage=1;stage<=5;stage++){complete(s,stage);assert.equal(s.activities.length,stage*4);assert.equal(availableTools(s).length,stage);assert.equal(claimTask(s,stage,3).fresh,false);assert.equal(s.activities.length,stage*4);}
  assert.deepEqual(s.completed,[1,2,3,4,5]);assert.equal(collectedAnimals(s).length,7);
});
test('incomplete / skipped tasks and administrator preview cannot grant completion',()=>{
  const s=freshExpedition();assert.equal(claimTask(s,1,0).ok,false);solve(s,1,3);assert.equal(claimTask(s,1,3).ok,false);s.adminUnlocked=true;assert.equal(isStageOpen(s,5),true);assert.equal(claimTask(s,5,3).ok,false);assert.deepEqual(s.completed,[]);assert.equal(taskReady(s,1,4),false);
});
test('second observation pair needs its own six observations and comparison answers',()=>{
  const s=freshExpedition();solve(s,1,0);assert.equal(taskReady(s,1,2),false);solve(s,1,2);assert.equal(taskReady(s,1,2),true);s.compares[1]={common:'fur',difference:'cover'};assert.equal(taskReady(s,1,3),false);solve(s,1,3);assert.equal(taskReady(s,1,3),true);
});
test('the learner-made criterion must be observable and the animals sorted by it',()=>{
  const s=freshExpedition();solve(s,2,0);s.sorts[1]={...s.sorts[0]};s.criteria[1]='fast';assert.equal(taskReady(s,2,2),false);s.criteria[1]='web';assert.equal(taskReady(s,2,2),false);solve(s,2,2);assert.equal(taskReady(s,2,2),true);assert.equal(taskReady(s,2,3),false);solve(s,2,3);assert.equal(taskReady(s,2,3),true);
});
test('six habitat discoveries and two different animal relationships are required',()=>{
  const s=freshExpedition();solve(s,3,0);assert.equal(taskReady(s,3,2),false);solve(s,3,2);solve(s,3,1);assert.equal(taskReady(s,3,3),false);solve(s,3,3);assert.equal(taskReady(s,3,3),true);assert.equal(s.discovered.length,6);
});
test('stage four requires visible traits plus a name and then habitat plus movement',()=>{
  const s=freshExpedition(),a=s.cases[0];a.candidate='duck';assert.equal(taskReady(s,4,0),false);a.traits=['feather','fur'];assert.equal(taskReady(s,4,0),false);a.traits=['feather','web'];s.inquiry.evidence[0]=['feather','web'];assert.equal(taskReady(s,4,0),true);a.habitat='pond';assert.equal(taskReady(s,4,1),false);a.reason='paddle';assert.equal(taskReady(s,4,1),true);solve(s,4,2);solve(s,4,3);assert.equal(taskReady(s,4,2),true);assert.equal(taskReady(s,4,3),true);
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
  assert.equal(restoreExpedition('{').version,3);const s=freshExpedition();s.designs[0]={problem:'constructor',feature:'web',structure:'__proto__',name:'x'.repeat(40),strokes:[[[Infinity,1],[-3,400]]],trials:[{problem:'protect',feature:'web',structure:'wide',passed:true}]};const out=restoreExpedition(JSON.stringify(s));assert.equal(out.designs[0].problem,'');assert.equal(out.designs[0].structure,'');assert.equal(out.designs[0].name.length,24);assert.equal(out.designs[0].trials[0].passed,false);assert.deepEqual(out.designs[0].strokes,[[[0,260]]]);
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
  s.designs[0].name='수정 중';s.designs[0].structure='layer';s.cases[0].traits=[];
  assert.equal(reportDesigns(s)[0].name,'물갈퀴 추진기');assert.equal(reportDesigns(s)[0].structure,'wide');assert.deepEqual(s.records.cases[0].traits,['feather','web']);assert.equal(taskReady(s,4,1),false);
  const restored=restoreExpedition(JSON.stringify(s));assert.equal(reportDesigns(restored)[0].structure,'wide');assert.deepEqual(restored.records.cases[0].traits,['feather','web']);
});
