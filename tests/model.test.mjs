import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,restoreState,OBSERVATIONS,PROBLEMS,isUnlocked,classificationValid,chainValid,deductionValid,testDesign,completeStage} from '../src/model.js';

test('a new expedition unlocks only the first stage',()=>{const s=freshState();assert.equal(isUnlocked(s,1),true);for(let id=2;id<=5;id++)assert.equal(isUnlocked(s,id),false);});
test('observation needs evidence from both animals and valid comparison',()=>{const s=freshState();s.compare={common:'eyes',difference:'cover'};assert.equal(completeStage(s,1),false);s.observed=Object.values(OBSERVATIONS).flat().map(o=>o.id);assert.equal(completeStage(s,1),true);assert.equal(isUnlocked(s,2),true);assert.equal(completeStage(s,1),true);assert.deepEqual(s.completed,[1]);});
test('classification checks every animal, and verification requires an observable criterion',()=>{const s=freshState();s.completed=[1];s.classification={frog:'no',crab:'no',duck:'yes',rabbit:'no',fish:'no',butterfly:'no'};assert.equal(classificationValid(s),false);s.classification.butterfly='yes';assert.equal(classificationValid(s),true);assert.equal(completeStage(s,2),false);s.criterion='wings';assert.equal(completeStage(s,2),true);});
test('environment requires all discoveries and the three correct links',()=>{const s=freshState();s.completed=[1,2];s.chain={environment:'pond',body:'web',life:'fly'};assert.equal(chainValid(s),false);s.chain.life='swim';assert.equal(completeStage(s,3),false);s.found=['rabbit','frog','marine'];assert.equal(completeStage(s,3),true);});
test('a waterside clue alone does not distinguish a duck from other candidates',()=>{const s=freshState();s.suspect='duck';s.clues=['place','feet','cover'];s.grounds=['place','feet'];assert.equal(deductionValid(s),false);s.grounds=['feet','cover'];assert.equal(deductionValid(s),true);s.grounds=['mouth','cover'];assert.equal(deductionValid(s),false);s.suspect='fish';s.grounds=['feet','cover'];assert.equal(deductionValid(s),false);});
test('a non-distinguishing clue set requires reinvestigation',()=>{const ids=['place','feet','cover','mouth','move'];for(let a=0;a<3;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<5;c++){const s=freshState();s.suspect='duck';s.clues=[ids[a],ids[b],ids[c]];const distinguishing=s.clues.find(id=>['cover','mouth'].includes(id));if(distinguishing){s.grounds=[distinguishing,s.clues.find(id=>id!==distinguishing)];assert.equal(deductionValid(s),true);}else{assert.deepEqual(s.clues,['place','feet','move']);}}});
test('all three inventions can pass; a stale passed test cannot validate a new design',()=>{for(const [problem,p] of Object.entries(PROBLEMS)){const s=freshState();s.completed=[1,2,3,4];s.design={problem,feature:p.feature,structure:p.structure,name:'나의 발명'};assert.equal(testDesign(s.design).passed,true);assert.equal(completeStage(s,5),false);s.trials=[{...testDesign(s.design),...s.design}];assert.equal(completeStage(s,5),true);s.design.structure='wrong';assert.equal(testDesign(s.design).passed,false);assert.equal(completeStage(s,5),false);}});
test('corrupted or old saves fail safely; recovered progress is bounded',()=>{assert.deepEqual(restoreState('not json'),freshState());assert.deepEqual(restoreState('{"version":7}'),freshState());const s=restoreState(JSON.stringify({version:1,completed:[5,3,1,1,9],step:{1:1,2:99},clues:['feet','cover','mouth','place'],grounds:['mouth','place'],design:{problem:'missing',name:42}}));assert.deepEqual(s.completed,[1,3,5]);assert.deepEqual(s.step,{'1':1});assert.equal(s.clues.length,3);assert.deepEqual(s.grounds,['mouth']);assert.equal(s.design.problem,'protect');assert.equal(s.design.name,'');});
test('an active investigation and invention survive a save round trip',()=>{const s=freshState();s.completed=[1,2,3];s.clues=['feet','cover'];s.grounds=['feet','cover'];s.suspect='duck';s.step={4:1};s.design={problem:'swim',feature:'web',structure:'wide',name:'물살 신발'};assert.deepEqual(restoreState(JSON.stringify(s)),s);});
test('drawn design strokes survive reload with bounded coordinates',()=>{const s=freshState();s.sketches={protect:[[[20,30],[100,80],[310,250]]]};assert.deepEqual(restoreState(JSON.stringify(s)).sketches,s.sketches);s.sketches.protect.push([[-20,300],[30,40],['bad',20]]);assert.deepEqual(restoreState(JSON.stringify(s)).sketches.protect[1],[[0,260],[30,40]]);});


test('admin unlock opens all stages without granting completion and survives reload',()=>{const s=freshState();s.adminUnlocked=true;s.soundEnabled=false;for(let id=1;id<=5;id++)assert.equal(isUnlocked(s,id),true);assert.equal(isUnlocked(s,6),false);assert.deepEqual(s.completed,[]);const restored=restoreState(JSON.stringify(s));assert.equal(restored.adminUnlocked,true);assert.equal(restored.soundEnabled,false);restored.adminUnlocked=false;assert.equal(isUnlocked(restored,5),false);assert.deepEqual(restored.completed,[]);});
test('an admin-completed later stage stays completed after reload and relocking',()=>{const s=freshState();s.adminUnlocked=true;s.found=['rabbit','frog','marine'];s.chain={environment:'pond',body:'web',life:'swim'};assert.equal(completeStage(s,3),true);s.adminUnlocked=false;const restored=restoreState(JSON.stringify(s));assert.deepEqual(restored.completed,[3]);assert.equal(isUnlocked(restored,3),true);assert.equal(isUnlocked(restored,5),false);});

test('prototype names and unknown invention problems restore to a valid problem',()=>{
  for(const problem of ['toString','constructor','__proto__','missing']){
    const s=restoreState(JSON.stringify({version:1,design:{problem,name:'복구된 설계'}}));
    assert.equal(s.design.problem,'protect');assert.equal(s.design.name,'복구된 설계');
    assert.equal(testDesign(s.design).passed,false);
  }
});

test('invalid invention problems fail safely even before save normalization',()=>{
  for(const design of [null,undefined,{}, {problem:'missing'},{problem:'toString'},{problem:'constructor'},{problem:'__proto__'},{problem:42}]){
    assert.deepEqual(testDesign(design),{feature:false,structure:false,passed:false});
  }
});
