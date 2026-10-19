import {test} from 'node:test';
import assert from 'node:assert/strict';
import {campaignFixture} from './fixtures/campaign-state.mjs';
import {restoreExpedition,collectedAnimals} from '../src/expedition.js';
import {campaignDraft,missionRows,chooseCommission,claimCommission,RETEST,runCommissionTrial} from '../src/campaign.js';
import {questPanel,toolContent,page} from '../src/shell-views.js';
import {createStudio} from '../src/studio.js';

function solve(s,stage,index){
 const d=campaignDraft(s,stage,index);if(stage===2&&index===1)chooseCommission(s,stage,index,'criterion','six');
 if(stage===5&&index<2){for(const level of [1,RETEST[s.records.designs[index].problem].target]){d.level=level;d.prediction='more';runCommissionTrial(s,stage,index);}chooseCommission(s,stage,index,'choice',String(RETEST[s.records.designs[index].problem].target));chooseCommission(s,stage,index,'reason','fit');}
 else for(const r of missionRows(s,stage,index))chooseCommission(s,stage,index,r.key,r.answer);
}
const finishAll=s=>{for(let stage=1;stage<=5;stage++)for(const i of [0,1,2]){solve(s,stage,i);assert.equal(claimCommission(s,stage,i).ok,true);}return s;};
const text=html=>html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');

test('map summary of the sorting garden reads the criterion and result awarded in commission 2-1',()=>{
 const s=campaignFixture();for(const i of [0,1]){solve(s,1,i);claimCommission(s,1,i);solve(s,2,i);claimCommission(s,2,i);}
 const shown=text(questPanel(s,{selectedStage:2}));
 assert.match(shown,/다리가 여섯 개인가요\?/);assert.match(shown,/벌/);assert.doesNotMatch(shown,/예:\s*<\/p>|예:\s*$/);
 // Survives a reload of the save.
 assert.match(text(questPanel(restoreExpedition(JSON.stringify(s)),{selectedStage:2})),/다리가 여섯 개인가요\? .*벌/);
});

test('sorting summary falls back to the exploration sort for saves without commission 2-1',()=>{
 const s=campaignFixture();s.campaign.grandfathered=[1,2];s.criteria[1]='web';s.sorts[1]={frog:'yes',duck:'yes',crab:'no',hen:'no',bat:'no',snail:'no'};const shown=text(questPanel(s,{selectedStage:2}));
 assert.match(shown,/물갈퀴가 있나요\?/);assert.match(shown,/오리/);
});

test('inventor badge lists both the practice invention and the free artwork, without the old two-problem line',()=>{
 const s=finishAll(campaignFixture());s.studioRecord={...createStudio(),title:'날개 우산',audience:'비 오는 날 친구',purpose:'펼쳐서 써.',inspiration:'박쥐 날개',strokes:[{color:'#294b3e',width:8,tool:'pen',points:[{x:10,y:10},{x:200,y:200}]}]};
 const shown=text(toolContent(s,5));
 assert.match(shown,/날개 우산/);assert.match(shown,/오리발|수영 신발/);assert.doesNotMatch(shown,/서로 다른 두 문제/);
 assert.match(toolContent(s,5),/studio-artwork/);
});

test('met animals count what completed records confirmed, not wrong options or unfinished drafts',()=>{
 const s=campaignFixture();assert.equal(collectedAnimals(s).includes('bee'),false);
 // A draft pick, including a wrong candidate, is not a meeting.
 chooseCommission(s,1,0,'frog-label','shell');assert.equal(collectedAnimals(s).includes('fish'),false);
 finishAll(s);const met=collectedAnimals(s);
 assert.ok(met.includes('bee'),'bee confirmed in requests 2 and 4');assert.ok(met.includes('snail'));assert.equal(met.includes('fish'),false);
 assert.deepEqual(collectedAnimals(restoreExpedition(JSON.stringify(s))),met);
});

test('ending counts resident letters, not internal mission keys',()=>{
 const s=finishAll(campaignFixture());const shown=text(page(s,{screen:'ending'}));
 assert.match(shown,/주민 부탁 5통/);assert.doesNotMatch(shown,/전시물 10개/);
});

test('workshop names the single missing step in order: feature, feature record, part placement',async()=>{
 const {freshExpedition,taskMistake,claimTask,STAGES}=await import('../src/expedition.js');
 const s=freshExpedition();s.adminUnlocked=true;const d=s.designs[0];Object.assign(d,{problem:'swim',name:'오리발'});
 const gap=()=>taskMistake(s,5,0)?.wrong?.[0];
 assert.equal(gap(),'design:feature');d.feature='web';assert.equal(gap(),'design:source');assert.match(taskMistake(s,5,0).text,/특징 기록/);
 d.experiment.sourceSeen=true;assert.equal(gap(),'design:part');d.structure='wide';d.spot='toe';assert.equal(taskMistake(s,5,0),null);
 assert.equal(claimTask(s,5,0).ok,true);assert.ok(STAGES[4].tasks.length===4);
});
