import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExpedition,CASES} from '../src/expedition.js';
import {activityView} from '../src/mission-views.js';
import {page,investigationNext} from '../src/shell-views.js';

test('both body-covering clues describe the evidence without revealing an animal photo',()=>{
 for(const round of [0,1]){
  const s=freshExpedition(),c=CASES[round],index=c.clues.findIndex(k=>k.kind==='몸의 모습');
  s.cases[round].opened=[c.clues[index].id];
  const html=activityView(s,{stage:4,step:round*2,clueIndex:index});
  const cluePanel=html.split('<div class="case-activity')[0];
  assert.ok(cluePanel.includes(c.clues[index].text));
  assert.doesNotMatch(cluePanel,/<img|detail-crop|data-image=|photo-zoom/);
  assert.match(html,/<img[^>]+class="[^"]*animal/,'the candidate choices still have their photos');
 }
});

test('other clue photos remain available and selected guesses lead explicitly to supporting evidence',()=>{
 const s=freshExpedition();Object.assign(s.cases[0],{opened:['place','foot'],candidate:'duck'});
 const html=activityView(s,{stage:4,step:0,clueIndex:2});
 assert.match(html.split('<div class="case-activity')[0],/detail-crop/);
 assert.match(html,/case-selection done/);
 assert.match(html,/오리 선택.*판단 근거 고르기/);
 assert.match(html,/두 개 이상/);
});

test('the investigation footer names the next step without prematurely submitting a guess',()=>{
 const s=freshExpedition(),v={screen:'mission',stage:4,step:0,clueIndex:0};
 const footer=()=>page(s,v).split('<footer class="mission-footer">')[1];
 assert.match(footer(),/data-action="case-continue"[^>]*>단서 두 개 조사하기/);
 s.cases[0].opened=['place','cover'];
 assert.match(footer(),/data-action="case-continue"[^>]*>동물 고르기/);
 s.cases[0].candidate='duck';
 assert.match(footer(),/data-action="case-continue"[^>]*>판단 근거 고르기/);
 assert.equal(investigationNext(s.cases[0],true).label,'근거 2개 더 골라 줘');
 s.cases[0].grounds=['place'];
 assert.equal(investigationNext(s.cases[0],true).label,'근거 1개 더 골라 줘');
 s.cases[0].grounds=['place','cover'];
 assert.match(footer(),/data-action="advance"[^>]*>추리 확인하기/);
});
