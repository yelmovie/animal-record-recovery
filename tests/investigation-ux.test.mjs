import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExpedition,CASES} from '../src/expedition.js';
import {activityView} from '../src/mission-views.js';
import {page,investigationNext} from '../src/shell-views.js';
import {clueFoundView,mountFlashlight} from '../src/flashlight.js';

test('each mystery uses a large masked animal and discovered features stay in the notebook without naming its answer',()=>{
 for(const round of [0,1]){
  const s=freshExpedition(),c=CASES[round],index=c.clues.findIndex(k=>k.kind==='몸의 모습');
  s.cases[round].opened=[c.clues[index].id];
  const html=activityView(s,{stage:4,step:round*2,clueIndex:index});
  assert.match(html,/flashlight-shadow/);assert.match(html,/flashlight-lit/);
  assert.ok(html.includes(c.clues[index].text));
  assert.doesNotMatch(html,/candidate-grid|조사 에너지/);
  const popup=clueFoundView(c,index);assert.ok(popup.includes(c.clues[index].text));
  assert.match(popup,/flashlight-found-photo closeup/);assert.match(popup,/발견 수첩에 붙이기/);
 }
});

test('a selected guess leads to discovered evidence while unopened features cannot be submitted as grounds',()=>{
 const s=freshExpedition();Object.assign(s.cases[0],{opened:['place','foot'],candidate:'duck'});
 const html=activityView(s,{stage:4,step:0,clueIndex:2});
 assert.match(html,/내가 추리한 동물/);assert.match(html,/>오리<\/b>/);
 assert.match(html,/추리에 쓸 단서를 눌러 줘/);
 assert.match(html,/data-action="case-ground" data-value="foot"/);
 assert.doesNotMatch(html,/data-action="case-ground" data-value="cover"/);
});

test('the investigation footer names the next step without prematurely submitting a guess',()=>{
 const s=freshExpedition(),v={screen:'mission',stage:4,step:0,clueIndex:0};
 const footer=()=>page(s,v).split('<footer class="mission-footer">')[1];
 assert.match(footer(),/data-action="case-continue"[^>]*>손전등으로 단서 찾기/);
 s.cases[0].opened=['place','cover'];
 assert.match(footer(),/data-action="case-continue"[^>]*>누구인지 추리하기/);
 s.cases[0].candidate='duck';
 assert.match(footer(),/data-action="case-continue"[^>]*>근거 2개 더 고르기/);
 assert.equal(investigationNext(s.cases[0],true).label,'근거 2개 더 고르기');
 s.cases[0].grounds=['place'];
 assert.equal(investigationNext(s.cases[0],true).label,'근거 1개 더 고르기');
 s.cases[0].grounds=['place','cover'];
 assert.match(footer(),/data-action="advance"[^>]*>추리 확인하기/);
});

test('flashlight pointer and keyboard focus move the same beam and cleanup removes all listeners',()=>{
 const listeners=new Map(),styles={},lit=new Set();let selected=-1;
 const button={dataset:{x:'60',y:'30',value:'2'},classList:{toggle(k,on){if(on)lit.add(k);else lit.delete(k);}}};
 const host={querySelectorAll(){return [button];},style:{setProperty(k,v){styles[k]=v;}},addEventListener(k,fn){listeners.set(k,fn);},removeEventListener(k){listeners.delete(k);},getBoundingClientRect(){return {left:10,top:20,width:200,height:100};},setPointerCapture(){},releasePointerCapture(){}};
 const cleanup=mountFlashlight(host,{onSelect(i){selected=i;}}),target={closest(){return null;}};
 listeners.get('pointermove')({clientX:130,clientY:50});assert.equal(styles['--beam-x'],'60%');assert.equal(styles['--beam-y'],'30%');assert.ok(lit.has('in-light'));
 listeners.get('pointerdown')({clientX:130,clientY:50,pointerId:1,target,preventDefault(){}});listeners.get('pointerup')({clientX:130,clientY:50,pointerId:1,target});assert.equal(selected,2);
 listeners.get('focusin')({target:{closest(){return button;}}});assert.equal(styles['--beam-x'],'60%');cleanup();assert.equal(listeners.size,0);
});
