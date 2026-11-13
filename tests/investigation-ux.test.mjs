import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExpedition,CASES} from '../src/expedition.js';
import {activityView} from '../src/mission-views.js';
import {page,investigationNext} from '../src/shell-views.js';
import {clueFoundView,mountFlashlight} from '../src/flashlight.js';

test('each mystery hides the full animal and discovered features stay in the notebook without naming its answer',()=>{
 for(const round of [0,1,2]){
  const s=freshExpedition(),c=CASES[round],index=c.clues.findIndex(k=>k.kind==='몸의 모습');
  s.cases[round].opened=[c.clues[index].id];
  const html=activityView(s,{stage:4,step:round*2,clueIndex:index});
  assert.match(html,/flashlight-mystery/);assert.doesNotMatch(html,/flashlight-shadow|flashlight-lit|data-image=/);
  assert.ok(html.includes(c.clues[index].text));
  assert.doesNotMatch(html,/candidate-grid|조사 에너지/);
  const popup=clueFoundView(c,index);assert.ok(popup.includes(c.clues[index].text));
  assert.match(popup,/flashlight-found-photo closeup/);assert.match(popup,/발견 수첩에 붙이기/);
 }
});

test('the notebook displays collected clues and direct animal choices without reselecting evidence',()=>{
 const s=freshExpedition();Object.assign(s.cases[0],{opened:['place','foot'],candidate:'duck'});
 const html=activityView(s,{stage:4,step:0,clueIndex:2});
 assert.match(html,/data-action="case-animal"/);assert.match(html,/>오리<\/b>/);
 assert.match(html,/발견한 단서/);assert.ok(html.includes(CASES[0].clues[2].text));
 assert.doesNotMatch(html,/추리에 쓸|data-action="case-ground"|data-action="case-compare"|후보 비교/);
});

test('the investigation footer has no second submit or evidence comparison action',()=>{
 const s=freshExpedition(),v={screen:'mission',stage:4,step:0,clueIndex:0};
 for(const clues of [[],['place'],['place','cover']]){
  s.cases[0].opened=clues;
  assert.doesNotMatch(page(s,v).split('<footer class="mission-footer">')[1],/data-action="(?:case-continue|case-compare|advance)"/);
 }
 s.cases[0].candidate='duck';
 assert.equal(investigationNext(s.cases[0]).action,'advance');
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
