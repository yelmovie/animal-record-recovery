import assert from 'node:assert/strict';
import {test} from 'node:test';
import {campaignFixture} from './fixtures/campaign-state.mjs';
import {restoreExpedition} from '../src/expedition.js';
import {campaignDraft,campaignReady,chooseCommission,claimRequest,pairedOptions,requestCards} from '../src/campaign.js';
import {commissionView} from '../src/campaign-views.js';

test('new broadcasts reuse a witnessed location, grade one connected answer and preserve the record after replay',()=>{
 const s=campaignFixture(),cards=requestCards(s,3,[0,1]);
 assert.equal(cards.length,4);
 for(const [i,c] of cards.entries()){
  const [place,body,life]=c.rows;
  const html=commissionView(s,{stage:3,commissionIndex:c.part,requestCard:i});
  assert.equal((html.match(/data-action="broadcast-pair"/g)||[]).length,3);
  assert.doesNotMatch(html,/data-row="[^"]+-place"/);
  assert.equal(chooseCommission(s,3,c.part,place.key,place.answer),false,'observed place is not a new response');
  const options=pairedOptions(body,life);
  assert.equal(options.filter(([b,l])=>b[0]===body.answer&&l[0]===life.answer).length,1);
  for(const r of [body,life])chooseCommission(s,3,c.part,r.key,r.answer);
 }
 assert.equal(campaignDraft(s,3,0).answers['rabbit-place'],undefined);
 assert.equal(claimRequest(s,3).ok,true);
 assert.equal(s.campaign.records['3-0'].answers['rabbit-place'],'forest');
 s.discovered=[];s.inquiry.motion={};
 const reloaded=restoreExpedition(JSON.stringify(s));
 assert.equal(reloaded.campaign.records['3-0'].answers['rabbit-place'],'forest');
});

test('only verified prior connections skip the old lost-record quiz; new cases still need evidence',()=>{
 const s=campaignFixture();
 let cards=requestCards(s,4,[0,1]);
 assert.deepEqual(cards.map(c=>c.part),[1,1]);
 assert.equal(campaignReady(s,4,0),true);
 assert.equal(claimRequest(s,4).ok,false,'unanswered new cases cannot award the request');
 s.links.frog.environment='sea';
 cards=requestCards(s,4,[0,1]);
 assert.deepEqual(cards.map(c=>c.part),[0,0,1,1]);
 assert.equal(campaignReady(s,4,0),false);
});
