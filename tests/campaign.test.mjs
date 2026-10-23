import {test} from 'node:test';
import assert from 'node:assert/strict';
import {campaignFixture} from './fixtures/campaign-state.mjs';
import {freshExpedition,restoreExpedition,isStageOpen,availableTools,PROBLEMS} from '../src/expedition.js';
import {COMMISSIONS,RETEST,freshCampaign,claimRequest,requestCount,ensureCampaign,campaignDraft,missionRows,chooseCommission,claimCommission,campaignReady,campaignOpen,campaignDone,restoredPlaces,commissionCount,runCommissionTrial,campaignReport} from '../src/campaign.js';
import {commissionView,galleryView,commissionLetter,requestMission} from '../src/campaign-views.js';
function solve(s,stage,index){
 const d=campaignDraft(s,stage,index);if(stage===2&&index===1)chooseCommission(s,stage,index,'criterion','six');
 if(stage===5&&index<2){for(const level of [1,RETEST[s.records.designs[index].problem].target]){d.level=level;d.prediction='more';runCommissionTrial(s,stage,index);}chooseCommission(s,stage,index,'choice',String(RETEST[s.records.designs[index].problem].target));chooseCommission(s,stage,index,'reason','fit');}
 else for(const r of missionRows(s,stage,index))chooseCommission(s,stage,index,r.key,r.answer);
}
test('base completion keeps stars but does not restore the place or unlock the next one until both commissions pass',()=>{
 const s=freshExpedition();ensureCampaign(s);s.activities=['1-0','1-1','1-2','1-3'];s.completed=[1];assert.equal(isStageOpen(s,2),false);assert.deepEqual(availableTools(s),[]);assert.equal(campaignOpen(s,1,1),true);assert.equal(claimCommission(s,1,1).ok,false);solve(s,1,0);assert.equal(claimCommission(s,1,0).ok,true);assert.deepEqual(restoredPlaces(s),[]);solve(s,1,1);assert.equal(claimCommission(s,1,1).ok,true);assert.deepEqual(restoredPlaces(s),[1]);assert.equal(isStageOpen(s,2),true);assert.equal(availableTools(s).length,1);assert.equal(s.activities.length,4);
});
test('all ten commissions and five optional challenges can be completed; replay never adds stars or duplicate records',()=>{
 const s=campaignFixture();for(let stage=1;stage<=5;stage++)for(let index=0;index<=2;index++){solve(s,stage,index);assert.equal(claimCommission(s,stage,index).ok,true,`${stage}-${index}`);assert.equal(claimCommission(s,stage,index).fresh,false);}
 assert.equal(commissionCount(s),10);assert.equal(Object.keys(s.campaign.records).length,15);assert.equal(s.activities.length,18);assert.deepEqual(restoredPlaces(s),[1,2,3,4,5]);assert.match(campaignReport(s).join('\n'),/중간 면/);
});
test('current saves retain drafts, validated awards, tool use and archived evidence after replay edits',()=>{
 const s=campaignFixture();solve(s,1,0);campaignDraft(s,1,0).usedTool=true;claimCommission(s,1,0);chooseCommission(s,1,0,'frog-label','shell');chooseCommission(s,1,1,'duck','feather');
 const out=restoreExpedition(JSON.stringify(s));assert.equal(out.campaign.drafts['1-0'].answers['frog-label'],'shell');assert.equal(out.campaign.records['1-0'].answers['frog-label'],'bare');assert.equal(out.campaign.records['1-0'].usedTool,true);assert.equal(out.campaign.drafts['1-1'].answers.duck,'feather');assert.equal(campaignDone(out,1,0),true);assert.equal(campaignDone(out,1,1),false);
});
test('old awarded places and tools stay available, while new commissions start unearned',()=>{
 const s=campaignFixture();delete s.campaign;const old=restoreExpedition(JSON.stringify(s));ensureCampaign(old);assert.deepEqual(restoredPlaces(old),[1,2,3,4,5]);assert.equal(availableTools(old).length,5);assert.equal(commissionCount(old),0);assert.equal(campaignOpen(old,1,1),true);
});
test('malformed and forged commission saves cannot create a badge or bypass mission order',()=>{
 const s=campaignFixture();s.campaign.records={'1-0':{answers:{'frog-label':'shell'}},'1-1':{answers:{duck:'feather',rabbit:'fur',same:'legs'}},'5-0':{answers:{choice:'2',reason:'fit'},trials:[{problem:'swim',level:2,prediction:'more'}]}};s.campaign.grandfathered=[7,'1'];
 const out=restoreExpedition(JSON.stringify(s));assert.equal(commissionCount(out),0);assert.deepEqual(restoredPlaces(out),[]);
});
test('changing own classification criterion clears previous placements and truth follows the selected question',()=>{
 const s=campaignFixture();solve(s,2,0);claimCommission(s,2,0);solve(s,2,1);assert.equal(campaignReady(s,2,1),true);chooseCommission(s,2,1,'criterion','legs');assert.deepEqual(campaignDraft(s,2,1).answers,{criterion:'legs'});assert.equal(campaignReady(s,2,1),false);for(const r of missionRows(s,2,1))chooseCommission(s,2,1,r.key,r.answer);assert.equal(campaignReady(s,2,1),true);assert.equal(chooseCommission(s,2,1,'criterion','cute'),false);
});
test('retest requires prediction, distinct trials including selected shape, and a reason tied to the customer',()=>{
 const s=campaignFixture(),d=campaignDraft(s,5,0);assert.equal(runCommissionTrial(s,5,0),false);d.prediction='less';runCommissionTrial(s,5,0);runCommissionTrial(s,5,0);assert.equal(d.trials.length,1);d.level=3;runCommissionTrial(s,5,0);chooseCommission(s,5,0,'choice','2');chooseCommission(s,5,0,'reason','fit');assert.equal(campaignReady(s,5,0),false);d.level=2;runCommissionTrial(s,5,0);assert.equal(campaignReady(s,5,0),true);chooseCommission(s,5,0,'reason','big');assert.equal(campaignReady(s,5,0),false);
});
test('all three invention choices use their own conditions and survive a round trip',()=>{
 const s=campaignFixture(['protect','warm']);for(const index of [0,1]){solve(s,5,index);assert.equal(claimCommission(s,5,index).ok,true);}const out=restoreExpedition(JSON.stringify(s));assert.equal(out.campaign.records['5-1'].answers.choice,'3');assert.match(campaignReport(out).join('\n'),/추운 곳/);
});
test('commission and gallery renderers escape learner names and expose keyboard tap fallbacks',()=>{
 const s=campaignFixture();s.records.designs[0].name='<img src=x onerror=alert(1)>';solve(s,5,0);claimCommission(s,5,0);for(const html of [commissionView(s,{stage:5,commissionIndex:0,requestCard:1}),galleryView(s)]){assert.ok(!html.includes('<img src=x'));assert.match(html,/&lt;img/);}const html=commissionView(s,{stage:2,commissionIndex:1,requestCard:1});assert.match(html,/<button class="bin-place"/);assert.match(html,/data-drop-action="commission-sort"/);
});

test('one reply validates both parts before awarding either, then survives reload without duplicate credit',()=>{
 for(let stage=1;stage<=5;stage++){
  const s=campaignFixture();solve(s,stage,0);
  assert.equal(claimRequest(s,stage).ok,false);assert.equal(campaignDone(s,stage,0),false);
  solve(s,stage,1);assert.deepEqual(claimRequest(s,stage),{ok:true,fresh:true,restored:true});
  const out=restoreExpedition(JSON.stringify(s));assert.equal(requestCount(out),1);assert.equal(campaignDone(out,stage,0),true);assert.equal(campaignDone(out,stage,1),true);
  assert.equal(claimRequest(out,stage).fresh,false);assert.equal(out.activities.length,18);
 }
});
test('a partially completed old request keeps archived evidence while the remaining work is submitted',()=>{
 const s=campaignFixture();solve(s,1,0);claimCommission(s,1,0);const archive=JSON.stringify(s.campaign.records['1-0']);
 chooseCommission(s,1,0,'frog-label','shell');solve(s,1,1);assert.equal(claimRequest(s,1).ok,true);
 assert.equal(JSON.stringify(s.campaign.records['1-0']),archive);assert.equal(requestCount(restoreExpedition(JSON.stringify(s))),1);
});
test('both request parts are reachable as cards with distinct action scopes and one reply',()=>{
 const s=campaignFixture(),first=commissionView(s,{stage:2,commissionIndex:0,requestCard:0}),html=commissionView(s,{stage:2,commissionIndex:0,requestCard:1});
 assert.match(first,/data-request-part="0"/);assert.match(html,/data-request-part="1"/);assert.match(first,/data-action="request-card" data-value="1"/);
 assert.match(html,/data-commission-index="1" data-action="pick"/);
 assert.equal((html.match(/data-action="commission-submit"/g)||[]).length,1);
 assert.doesNotMatch(html,/본 미션|응용 미션/);
});
test('invention requests continue the latest finished product first and label both archived projects explicitly',()=>{
 for(const second of ['protect','warm']){const s=campaignFixture(['swim',second]),html=[0,1].map(requestCard=>commissionView(s,{stage:5,commissionIndex:0,requestCard})).join(''),letter=commissionLetter(s,5);
  assert.ok(html.indexOf('data-request-part="1"')<html.indexOf('data-request-part="0"'));
  assert.match(requestMission(s,5,1).intro,/방금 완성한/);assert.match(requestMission(s,5,0).intro,/먼저 만들었던/);
  const latest=letter.indexOf('방금 완성한 '+PROBLEMS[second].product),earlier=letter.indexOf('먼저 만들었던 '+PROBLEMS.swim.product);
  assert.ok(latest>=0&&earlier>latest);
  assert.ok(html.includes(RETEST[second].request));assert.ok(html.includes(RETEST.swim.request));
 }
});
test('all commissions come from distinct village residents, while Mori is addressed as a companion',()=>{
 assert.equal(new Set(COMMISSIONS.map(c=>c.portrait)).size,5);assert.ok(COMMISSIONS.every(c=>!c.npc.includes('모리')));
 const html=commissionLetter(campaignFixture(),4);assert.match(html,/기록 안내원 나라/);assert.match(html,/하루, 모리, 그리고 탐험대에게/);assert.doesNotMatch(html,/기록 보조원 모리/);
});

test('museum labels preserve submitted observations when a replay draft is changed',()=>{
 const s=campaignFixture();solve(s,1,0);solve(s,1,1);assert.equal(claimRequest(s,1).ok,true);
 chooseCommission(s,1,0,'frog-label','fur');
 const room=galleryView(s).split('data-room="1"')[1].split('data-room="2"')[0];
 assert.match(room,/털과 깃털 없이 맨살이 드러나 있어/);
 assert.doesNotMatch(room,/부드러운 털로 덮여 있어/);
});

test('museum classification showcases keep the archived O and X placements',()=>{
 const s=campaignFixture();solve(s,2,0);solve(s,2,1);assert.equal(claimRequest(s,2).ok,true);
 chooseCommission(s,2,1,'criterion','legs');
 const room=galleryView(s).split('data-room="2"')[1].split('data-room="3"')[0];
 const yes=room.split('aria-label="기준에 맞는 동물"')[1].split('museum-sort-group')[0];
 assert.match(room,/다리가 여섯 개인가요/);assert.match(yes,/>벌<\/figcaption>/);
 assert.doesNotMatch(yes,/>닭<\/figcaption>|>박쥐<\/figcaption>/);
});

test('museum photo wall keeps one real saved frame after restore without inventing photos for legacy records',()=>{
 const s=campaignFixture();s.inquiry.motionPhotos={rabbit:{dataURL:'data:image/webp;base64,AAAA',width:480,height:270,time:.5,duration:5}};
 const room=galleryView(restoreExpedition(JSON.stringify(s))).split('data-room="3"')[1].split('data-room="4"')[0];
 assert.match(room,/내가 직접 고른 순간들/);assert.match(room,/내가 고른 0.5초/);
 assert.equal((room.match(/data-action="motion-photo"/g)||[]).length,1);
 assert.doesNotMatch(galleryView(campaignFixture()),/museum-photo-grid/);
});
