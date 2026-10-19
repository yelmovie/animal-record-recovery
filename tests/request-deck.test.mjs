import {test} from 'node:test';
import assert from 'node:assert/strict';
import {campaignFixture} from './fixtures/campaign-state.mjs';
import {campaignDraft,missionRows,chooseCommission,requestParts,requestCards,cardProgress,requestGap,claimRequest} from '../src/campaign.js';
import {commissionView} from '../src/campaign-views.js';

const fill=(s,stage,index,skip=[])=>{for(const r of missionRows(s,stage,index))if(!skip.includes(r.key))chooseCommission(s,stage,index,r.key,r.answer);};

test('the ecology request becomes four animal cards of place → body → life, twelve answers in all',()=>{
 const s=campaignFixture(),cards=requestCards(s,3,requestParts(3,0));
 assert.deepEqual(cards.map(c=>c.animal),['rabbit','marine','duck','butterfly']);
 assert.ok(cards.every(c=>c.rows.length===3));
 assert.deepEqual(cards[0].rows.map(r=>r.key),['rabbit-place','rabbit-body','rabbit-life']);
 assert.deepEqual(cardProgress(s,3,cards),{answered:0,total:12});
 chooseCommission(s,3,0,'rabbit-place','sea');assert.deepEqual(cardProgress(s,3,cards),{answered:1,total:12});
});

test('every request and challenge is split into cards that keep all rows exactly once',()=>{
 const s=campaignFixture();
 for(let stage=1;stage<=5;stage++)for(const index of [0,2]){const parts=requestParts(stage,index),cards=requestCards(s,stage,parts);
  assert.ok(cards.length>=1);
  for(const i of parts)assert.deepEqual(cards.filter(c=>c.part===i).flatMap(c=>c.rows.map(r=>r.key)),missionRows(s,stage,i).map(r=>r.key));
 }
 assert.deepEqual(requestCards(s,4,[0]).map(c=>c.rows.map(r=>r.key)),[['a','a-place'],['b','b-life']]);
 assert.deepEqual(requestParts(5,0),[1,0]);
});

test('submitting with blanks points at the first empty answer in display order, even if an earlier one is wrong',()=>{
 const s=campaignFixture();fill(s,3,0);chooseCommission(s,3,0,'rabbit-place','sea');fill(s,3,1,['butterfly-body']);
 assert.equal(claimRequest(s,3).ok,false);
 const gap=requestGap(s,3,requestParts(3,0));
 assert.equal(gap.index,1);assert.equal(gap.key,'butterfly-body');assert.equal(gap.missing,true);assert.match(gap.text,/나비 · 날 때 쓰는 부분/);
 chooseCommission(s,3,1,'butterfly-body','fin');
 const wrong=requestGap(s,3,requestParts(3,0));assert.equal(wrong.key,'rabbit-place');assert.equal(wrong.missing,false);
});

test('the request screen shows one card, overall progress and a jump list, never the answers',()=>{
 const s=campaignFixture();chooseCommission(s,3,0,'rabbit-place','forest');
 const html=commissionView(s,{stage:3,commissionIndex:0,requestCard:0});
 assert.match(html,/1\/12/);assert.equal((html.match(/data-action="request-card"/g)||[]).length>=4,true);
 assert.match(html,/data-row="rabbit-place"/);assert.doesNotMatch(html,/data-row="duck-place"/);
 // The broadcast script shows the learner's choice and blanks for the rest.
 assert.match(html,/card-result/);assert.match(html,/숲과 들/);assert.doesNotMatch(html.split('card-result')[1],/긴 뒷다리|땅을 박차고/);
 const later=commissionView(s,{stage:3,commissionIndex:0,requestCard:3});assert.match(later,/data-row="butterfly-life"/);
});
