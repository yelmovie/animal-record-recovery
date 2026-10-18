import {test} from 'node:test';
import assert from 'node:assert/strict';
import {campaignFixture} from './fixtures/campaign-state.mjs';
import {freshExpedition,selectDesignProblem,recordTrial,claimTask,restoreExpedition,reportDesigns,PROBLEMS,PRODUCTS,designTrials,taskReady,VERSION} from '../src/expedition.js';
import {addExperimentTrial} from '../src/inquiry.js';
import {researchLines} from '../src/research-report.js';
import {withParticle} from '../src/korean.js';

function finish(s,round,problem,note){
 selectDesignProblem(s,round,problem);const d=s.designs[round],p=PROBLEMS[problem];
 Object.assign(d,{feature:p.feature,structure:p.structure,spot:PRODUCTS[problem].spot,explanation:'match'});
 Object.assign(d.experiment,{sourceSeen:true,prediction:'same'});
 for(const level of [1,3]){d.experiment.level=level;recordTrial(s,round);addExperimentTrial(d);}
 Object.assign(d.experiment,{reflection:'changed',note});
 assert.equal(claimTask(s,5,round*2).ok,true);assert.equal(claimTask(s,5,round*2+1).ok,true);
}

test('coat → helmet starts a separate draft, preserves the completed coat and never certifies a new unfinished draft',()=>{
 const s=campaignFixture(['swim','warm']),original=structuredClone(s.records.designs[1]),stars=s.activities.length;
 s.designs[1].strokes=[[[2,3],[4,5]]];const note=s.designs[1].experiment.note;
 assert.equal(selectDesignProblem(s,1,'protect'),true);
 assert.equal(s.designs[1].problem,'protect');assert.equal(s.designs[1].trials.length,0);assert.equal(s.designs[1].experiment.note,'');assert.deepEqual(s.designs[1].strokes,[]);
 assert.equal(taskReady(s,5,3),false);assert.equal(claimTask(s,5,3).ok,false);
 assert.deepEqual(s.records.designs[1],original);assert.ok(reportDesigns(s).every(d=>d.problem!=='protect'));assert.equal(s.activities.length,stars);
 selectDesignProblem(s,1,'warm');assert.equal(s.designs[1].experiment.note,note);assert.deepEqual(s.designs[1].strokes,[[[2,3],[4,5]]]);
 finish(s,1,'protect','덮개가 감싸는 곳을 바꿨어.');
 assert.equal(designTrials(reportDesigns(s).find(d=>d.problem==='protect')).length,2);assert.deepEqual(s.records.designs[1],original);assert.equal(reportDesigns(s).length,3);assert.equal(s.activities.length,stars);
 const saved=restoreExpedition(JSON.stringify(s));assert.deepEqual(saved,s);assert.equal(claimTask(saved,5,3).fresh,false);assert.equal(saved.activities.length,stars);
});

test('version 3 mixed histories are split by problem without inventing a lost coat reflection',()=>{
 const s=campaignFixture(['swim','protect']);s.version=3;delete s.designDrafts;delete s.designArchive;
 s.designs[1].experiment.note='안전모에 관한 내 생각';s.designs[1].trials.unshift({problem:'warm',feature:'fur',structure:'layer',spot:'body',passed:true});
 s.records.designs[1]=structuredClone(s.designs[1]);
 const out=restoreExpedition(JSON.stringify(s));assert.equal(out.version,VERSION);assert.equal(out.designs[1].trials.length,1);
 assert.equal(out.designDrafts[1].warm.trials.length,1);assert.equal(out.designDrafts[1].warm.experiment.note,'');
 assert.equal(out.records.designs[1].experiment.note,'안전모에 관한 내 생각');assert.equal(out.records.designs[1].trials.length,1);assert.deepEqual(out.activities,s.activities);
});

test('draft choices, misplaced parts, failure, prediction, lines and notes survive switching and reload independently',()=>{
 const s=campaignFixture(['swim','warm']);selectDesignProblem(s,1,'protect');const d=s.designs[1];
 Object.assign(d,{feature:'shell',structure:'dome',spot:'strap',strokes:[[[10,20]]],name:'내 덮개'});recordTrial(s,1);d.experiment.prediction='less';d.experiment.note='끈 대신 위를 덮어야겠어.';
 selectDesignProblem(s,1,'warm');const out=restoreExpedition(JSON.stringify(s));selectDesignProblem(out,1,'protect');
 assert.equal(out.designs[1].trials[0].passed,false);assert.equal(out.designs[1].spot,'strap');assert.equal(out.designs[1].experiment.prediction,'less');assert.equal(out.designs[1].experiment.note,'끈 대신 위를 덮어야겠어.');assert.deepEqual(out.designs[1].strokes,[[[10,20]]]);
 assert.equal(out.records.designs[1].problem,'warm');
});

test('TXT joins animal, part and fact; completed and draft works have isolated histories and optional peer evidence',()=>{
 const s=campaignFixture(['swim','warm']);finish(s,1,'protect','안전모만의 성찰');selectDesignProblem(s,1,'warm');s.designs[1].experiment.note='외투 초안의 새 생각';
 const text=researchLines(s).join('\n');assert.match(text,/개구리 · 눈:/);assert.match(text,/게 ·/);assert.match(text,/완성품.*안전모|완성품.*보호/);assert.match(text,/안전모만의 성찰/);assert.match(text,/초안 — 완성품 인증에 포함되지 않음/);assert.match(text,/협력 활동의 증거로 판정하지 않음/);
 const helmet=text.slice(text.indexOf('[완성품] 안전모'),text.indexOf('[작업 중인 초안'));
 assert.match(helmet,/시험 2회/);assert.ok(!helmet.includes('외투 초안의 새 생각'));
});

test('Korean particles fit the final syllable in animal, feature and cover labels',()=>{
 for(const [word,result]of [['개구리','개구리를'],['촘촘한 털','촘촘한 털을'],['위쪽','위쪽을'],['위와 옆','위와 옆을'],['위·옆·뒤','위·옆·뒤를']])assert.equal(withParticle(word),result);
 assert.equal(withParticle('개구리','은/는'),'개구리는');assert.equal(withParticle('게','은/는'),'게는');
});

test('export preserves the chosen reflection and the result of each individual setting',()=>{
 const s=campaignFixture(['swim','warm']);
 for(const [key,label]of [['changed','예상과 같았어'],['surprised','예상과 달랐어'],['same','다시 살펴보고 싶어']]){
  s.designs[0].experiment.reflection=key;
  assert.ok(researchLines(s).includes('예상과 비교: '+label));
 }
 const text=researchLines(s).join('\n');
 assert.match(text,/비교 시험 1: 좁게[^\n]+모형 결과: 물을 적게 미는 모습/);
 assert.match(text,/비교 시험 2: 넓게[^\n]+모형 결과: 물을 많이 미는 모습/);
 assert.match(text,/비교 시험 1: 한 겹[^\n]+모형 결과: 열이 많이 빠져나가는 모습/);
 assert.match(text,/비교 시험 2: 세 겹[^\n]+모형 결과: 열이 적게 빠져나가는 모습/);
});
