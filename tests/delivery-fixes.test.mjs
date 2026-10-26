import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CRITERIA,researcherAnswers} from '../src/expedition.js';
import {motionGuide} from '../src/inquiry-views.js';

test('the opinion criterion asks about moving fast, so flying and swimming animals are not judged as runners', () => {
 assert.equal(CRITERIA.fast,'빠르게 움직이나요?');
 assert.notEqual(new Set(researcherAnswers('fast','dolphin')).size,1,'researchers still disagree, so the lesson about vague criteria stays');
});

test('photo guidance follows the capture state instead of falling back to the first hint', () => {
 assert.match(motionGuide({}),/재생 버튼을 먼저/);
 assert.match(motionGuide({viewed:true,ready:true,playing:true}),/전시 사진 찍기/);
 assert.match(motionGuide({viewed:true,ready:true}),/사진을 찍어 봐/);
 const taken=motionGuide({done:true,next:'토끼'});
 assert.match(taken,/사진을 골랐어! 다음 동물 토끼를 찾아봐\. 다른 장면을 원하면 다시 재생해\./);
 assert.doesNotMatch(taken,/먼저/);
 assert.match(motionGuide({done:true,allDone:true}),/세 마리 사진을 모두 골랐어/);
 assert.match(motionGuide({done:true,viewed:true,ready:true,next:'토끼'}),/다시 찍기.*토끼/);
});

test('letters, diary and museum lead with the task or result and fold the long story', async () => {
 const {completeFixture}=await import('./fixtures/complete-state.mjs');
 const {commissionLetter,galleryView}=await import('../src/campaign-views.js');
 const {researchDiaryView}=await import('../src/research-report.js');
 const s=completeFixture();
 const letter=commissionLetter(s,2);
 assert.ok(letter.indexOf('지금 할 일')<letter.indexOf('<details'),'the task sentence comes before the folded letter');
 assert.match(letter,/<details class="letter-body letter-more"><summary>편지 전체 읽기/);
 const diary=researchDiaryView(s);
 assert.match(diary,/탐험 별 24\/24 · 되찾은 장소 5\/5/);assert.match(diary,/다음 할 일/);assert.doesNotMatch(diary,/<details class="diary-entry" open/);
 assert.match(galleryView(s),/museum-cast-summary[\s\S]*<b>토끼<\/b> 숲과 들 → 긴 뒷다리/);
});
