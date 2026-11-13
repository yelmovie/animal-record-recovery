import {test} from 'node:test';
import assert from 'node:assert/strict';
import {broadcastClips,broadcastAudioControl} from '../src/broadcast-audio.js';
import {COMMISSIONS,requestCards,campaignDraft,ensureCampaign} from '../src/campaign.js';
import {freshExpedition} from '../src/expedition.js';
import {commissionView} from '../src/campaign-views.js';

test('broadcast narration follows the current animal and requires all correct choices',()=>{
 const state=freshExpedition();ensureCampaign(state);
 for(const card of requestCards(state,3,[0,1])){
  const draft=campaignDraft(state,3,card.part);
  assert.deepEqual(broadcastClips(card.rows,draft),[]);
  for(const row of card.rows)draft.answers[row.key]=row.answer;
  assert.deepEqual(broadcastClips(card.rows,draft),['opening',card.animal,'closing']);
  const row=card.rows[0];draft.answers[row.key]=row.options.find(option=>option[0]!==row.answer)[0];
  assert.deepEqual(broadcastClips(card.rows,draft),[]);
  assert.match(broadcastAudioControl(card.rows,draft),/disabled/);
 }
});

test('complete scripts keep their animal order including the camel and penguin',()=>{
 const commissions=COMMISSIONS[2];
 for(const mission of [...commissions.missions,commissions.challenge]){
  const draft={answers:Object.fromEntries(mission.rows.map(row=>[row.key,row.answer]))};
  const animals=[...new Set(mission.rows.map(row=>row.animal||row.key))];
  assert.deepEqual(broadcastClips(mission.rows,draft),['opening',...animals,'closing']);
 }
});

test('broadcast listen control is visible outside folded manuscript details',()=>{
 const state=freshExpedition();ensureCampaign(state);state.completed=[1,2,3];
 const html=commissionView(state,{stage:3,commissionIndex:0,requestCard:0});
 assert.ok(html.indexOf('data-broadcast-clips')<html.indexOf('<details class="broadcast-script-preview">'));
 assert.match(html,/방송 들어보기/);
 assert.match(html,/data-broadcast-lines=/);
 assert.match(html,/레인저 하늘이에요/);
});

test('special broadcast offers both field videos without requiring optional dome photos',()=>{
 const state=freshExpedition();ensureCampaign(state);state.completed=[1,2,3];
 const main=commissionView(state,{stage:3,commissionIndex:0,requestCard:0});
 const extra=commissionView(state,{stage:3,commissionIndex:2,requestCard:0});
 assert.deepEqual(Object.keys(state.inquiry.motion),[]);
 assert.doesNotMatch(main,/data-action="broadcast-video"/);
 assert.match(extra,/data-action="broadcast-video"[^>]*data-id="camel"/);
 assert.match(extra,/data-action="broadcast-video"[^>]*data-id="penguin"/);
});
