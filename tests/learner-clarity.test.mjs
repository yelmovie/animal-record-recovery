import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExpedition,restoreExpedition,DISCOVERIES,DOME_ZONES,discoveryCaption,domeCaption,motionOpen,observeTry,observeSummary,taskMistake,collectedAnimals} from '../src/expedition.js';
import {motionView} from '../src/inquiry-views.js';
import {MOTIONS} from '../src/inquiry.js';
import {researchLines} from '../src/research-report.js';
import {page,settingsContent} from '../src/shell-views.js';
import {campaignFixture} from './fixtures/campaign-state.mjs';

const text=html=>html.replace(/<[^>]+>/g,' ');

test('before a prediction, chapter 3 shows only the animal, the place and the question',()=>{
 const s=freshExpedition(),rabbit=DISCOVERIES.find(d=>d.animal==='rabbit');s.discovered.push(rabbit.id);
 assert.equal(motionOpen(s,'rabbit'),false);
 assert.doesNotMatch(discoveryCaption(s,rabbit),/뒷다리/);assert.match(discoveryCaption(s,rabbit),/숲과 들에서 토끼가 움직이고 있어/);
 assert.doesNotMatch(domeCaption(s,DOME_ZONES.dry),/발바닥/);
 const before=motionView('rabbit',{motionPrediction:undefined});
 for(const frame of MOTIONS.rabbit.frames)assert.ok(!before.includes(frame),`caption or label leaks “${frame}”`);
 assert.doesNotMatch(before,/긴 뒷다리의 움직임 관찰 영상/);
 assert.doesNotMatch(before,/뒷다리를 굽혀 준비하는 순간/);
 // The two prediction choices are the question itself, so they stay.
 assert.match(before,/긴 뒷다리/);assert.match(before,/귀/);
 // A wrong prediction still opens the observation and the comparison afterwards.
 s.inquiry.motionPredictions.rabbit='other';
 assert.equal(motionOpen(s,'rabbit'),true);assert.match(discoveryCaption(s,rabbit),/뒷다리로 뛰어다녔어/);
 const after=motionView('rabbit',{motionPrediction:'other'});assert.match(after,/뒷다리를 굽혀 준비하는 순간/);
 // Reload keeps the same reveal state.
 assert.equal(motionOpen(restoreExpedition(JSON.stringify(s)),'rabbit'),true);
 // A record from an older save (motion without a saved prediction) counts as already observed.
 const old=freshExpedition();old.inquiry.motion.frog=1;assert.equal(motionOpen(restoreExpedition(JSON.stringify(old)),'frog'),true);
});

test('unfinished chapter 3 hints, the notebook, the tool and the report do not name the moving part early',()=>{
 const s=freshExpedition();s.adminUnlocked=true;for(const d of DISCOVERIES.slice(0,3))s.discovered.push(d.id);
 const hint=taskMistake(s,3,0).text;assert.doesNotMatch(hint,/순간/);assert.match(hint,/먼저 무엇이 움직임을 도울지 예상해 봐/);
 assert.ok(!collectedAnimals(s).includes('marine'),'a found animal joins the notebook after the prediction');
 const report=researchLines(s).join('\n');assert.doesNotMatch(report,/지느러미로 바닷물/);
 s.inquiry.motionPredictions.marine='part';assert.ok(collectedAnimals(s).includes('marine'));
 assert.match(taskMistake(s,3,0).text,/바다 물고기: 꼬리가 물을 옆으로 미는 순간을 찾아 기록해 봐/);
});

test('observation tries survive reload; older observations stay unknown instead of guessed',()=>{
 const s=freshExpedition();s.observed=['frog-eye','frog-leg','crab-eye'];s.observeTries={'frog-eye':'first','frog-leg':'helped','bogus':'first','crab-leg':'maybe'};
 const back=restoreExpedition(JSON.stringify(s));
 assert.deepEqual(back.observeTries,{'frog-eye':'first','frog-leg':'helped'});
 assert.equal(observeTry(back,'crab-eye'),'unknown');assert.deepEqual(observeSummary(back),{first:1,helped:1,unknown:1});
 const legacy=JSON.parse(JSON.stringify(s));delete legacy.observeTries;
 assert.deepEqual(observeSummary(restoreExpedition(JSON.stringify(legacy))),{first:0,helped:0,unknown:3});
 const report=researchLines(back).join('\n');
 assert.match(report,/머리 위쪽에 튀어나온 눈이 있어\. \(처음 고른 설명이 맞았어\)/);
 assert.match(report,/다시 살펴보고 고쳐 골랐어/);assert.match(report,/이전 기록이라 알 수 없는 곳 1곳/);
 assert.match(report,/자루 끝에 달린 눈이 있어\.$/m,'an unknown try adds no guessed label to its line');
});

test('teacher guide gives the three talk-based checks and does not call the free invention a score',()=>{
 const html=text(settingsContent(campaignFixture()));
 for(const check of ['동물 특징과 기능 연결','쓰임 설명','친구 의견 반영'])assert.match(html,new RegExp(check));
 assert.match(html,/학습 성취 점수로 보지 말고/);assert.match(html,/친구 의견 칸을 비워도 진행돼요/);
 assert.match(html,/이 기기의 관찰 기록/);
});

test('travel buttons pick 으로/로 by the last sound of the place name',()=>{
 const s=campaignFixture();s.campaign.grandfathered=[1,2];
 const v={screen:'map',stage:3,step:0,selectedStage:3,arrived:true,mapZoom:1,canGoBack:false};
 const html=page(s,v);assert.match(html,/생태의 물가로 가기/);assert.doesNotMatch(html,/물가으로/);
});

test('a link check names one slot in one sentence but still marks every slot to fix',()=>{
 const s=freshExpedition(),m=taskMistake(s,3,1);
 assert.equal(m.text,'‘사는 곳’ 칸에 카드를 놓아 줘.');assert.deepEqual(m.wrong,['link:environment','link:body','link:life']);
 s.links.frog={environment:'sea'};assert.equal(taskMistake(s,3,1).text,'‘사는 곳’을 다시 봐. 어느 장소에서 발견했는지 떠올려 봐.');
});
