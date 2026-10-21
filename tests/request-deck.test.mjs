import {test} from 'node:test';
import assert from 'node:assert/strict';
import {campaignFixture} from './fixtures/campaign-state.mjs';
import {campaignDraft,missionRows,chooseCommission,requestParts,requestCards,cardProgress,requestGap,claimRequest} from '../src/campaign.js';
import {commissionView,broadcastScript,galleryView} from '../src/campaign-views.js';

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

test('ecology scripts read as spoken field reports for all four selected animals',()=>{
 const s=campaignFixture();fill(s,3,0);fill(s,3,1);
 const scripts=requestCards(s,3,[0,1]).map(c=>broadcastScript(c.rows,campaignDraft(s,3,c.part)));
 for(const script of scripts){assert.equal(script[0].cue,'오프닝');assert.equal(script.at(-1).cue,'클로징');assert.match(script[0].text,/레인저 하늘/);}
 assert.match(scripts[0][1].text,/숲과 들에서 토끼를 만났어요.*긴 뒷다리를 보세요.*토끼는 땅을 박차고 뛰어요/);
 assert.match(scripts[1][1].text,/바닷물 속에서 바다 물고기를 만났어요.*지느러미와 꼬리를 보세요.*물속에서 헤엄쳐요/);
 assert.match(scripts[2][1].text,/연못과 물가에서 오리를 만났어요.*물갈퀴 달린 발을 보세요.*발로 물을 밀며 헤엄쳐요/);
 assert.match(scripts[3][1].text,/꽃이 핀 풀밭에서 나비를 만났어요.*날개를 보세요.*날개를 움직여 날아요/);
});

test('broadcast drafts retain blanks and wrong choices without revealing or correcting answers',()=>{
 const s=campaignFixture(),c=requestCards(s,3,[0])[0],d=campaignDraft(s,3,0);
 let text=broadcastScript(c.rows,d).map(b=>b.text).join(' ');
 assert.match(text,/〔사는 곳〕.*〔몸의 부분〕.*〔움직임〕/);assert.doesNotMatch(text,/숲과 들|긴 뒷다리|땅을 박차고/);
 chooseCommission(s,3,0,'rabbit-place','sea');chooseCommission(s,3,0,'rabbit-body','fin');chooseCommission(s,3,0,'rabbit-life','swim');
 text=broadcastScript(c.rows,d).map(b=>b.text).join(' ');
 assert.match(text,/바닷물 속에서.*지느러미를 보세요.*토끼는 물속에서 헤엄쳐요/);assert.doesNotMatch(text,/숲과 들|긴 뒷다리|땅을 박차고/);
});

test('the special broadcast uses both selected explanations and the museum preserves the submitted script',()=>{
 const s=campaignFixture();fill(s,3,0);fill(s,3,1);assert.equal(claimRequest(s,3).ok,true);fill(s,3,2);
 const c=requestCards(s,3,[2])[0],text=broadcastScript(c.rows,campaignDraft(s,3,2)).map(b=>b.text).join(' ');
 assert.match(text,/낙타의 넓적한 발바닥을 보세요.*모래 위를 걸을 때 쓰여요/);assert.match(text,/펭귄의 짧은 날개를 보세요.*바닷물 속을 헤엄칠 때 쓰여요/);
 chooseCommission(s,3,0,'rabbit-body','fin');
 const html=galleryView(s).split('museum-broadcast')[1];assert.match(html,/긴 뒷다리를 보세요/);assert.doesNotMatch(html,/지느러미를 보세요/);
});
