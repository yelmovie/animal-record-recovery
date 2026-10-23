import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExpedition,OBSERVATIONS} from '../src/expedition.js';
import {researchDiaryEntries,researchDiaryView} from '../src/research-report.js';
import {campaignFixture} from './fixtures/campaign-state.mjs';
import {missionRows,chooseCommission,claimRequest} from '../src/campaign.js';

test('an empty diary invents no experience and one observation only writes what was actually seen',()=>{
 const s=freshExpedition();let text=researchDiaryEntries(s).flatMap(e=>e.paragraphs).join(' ');
 assert.match(text,/이 노트에 내가 만난 동물 이야기를 남기고 싶어/);assert.doesNotMatch(text,/살펴보았어|시험했어/);
 s.observed=['frog-eye'];text=researchDiaryEntries(s).flatMap(e=>e.paragraphs).join(' ');
 assert.ok(text.includes(OBSERVATIONS.frog.find(o=>o.id==='frog-eye').text));
 assert.doesNotMatch(text,/긴 뒷다리|맨살|게를 가까이|활동 \d|탐험 별/);
});

test('the diary describes helping a resident only after submission, with prose rather than answer labels',()=>{
 const s=campaignFixture();for(const i of [0,1])for(const r of missionRows(s,1,i))chooseCommission(s,1,i,r.key,r.answer);
 assert.ok(!researchDiaryEntries(s).some(e=>e.title==='내 기록이 누군가에게 도움이 되었어'));
 assert.equal(claimRequest(s,1).ok,true);const entry=researchDiaryEntries(s).find(e=>e.title==='내 기록이 누군가에게 도움이 되었어');
 assert.match(entry.paragraphs.join(' '),/연구원 소라에게서 온 부탁도 도와주었어/);
 assert.doesNotMatch(entry.paragraphs.join(' '),/에 대해|이라고 기록|\d+\/\d+/);
 const html=researchDiaryView(s);assert.doesNotMatch(html,/textarea|TXT|download=/);assert.match(html,/diary-pages/);
});
