import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as inquiry from '../src/inquiry.js';
import * as inquiryViews from '../src/inquiry-views.js';
import * as model from '../src/expedition.js';
import * as presentation from '../src/presentation.js';
import * as shell from '../src/shell-views.js';
import {createNavigation} from '../src/navigation.js';

const source=readFileSync(new URL('../src/adventure-app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
function appHarness({fail=false,motion=false}={}){
  let stored=null,warning=null,writeFailure=fail,exported=null;
  const listeners=new Map(),heading={textContent:''},status={textContent:''},announcer={textContent:''},link={href:''};
  const app={_html:'',get innerHTML(){return this._html;},set innerHTML(v){this._html=v;warning=null;},querySelectorAll(){return [];},insertAdjacentHTML(_,text){warning={text,remove(){warning=null;}};}};
  const dialog={open:false,innerHTML:'',showModal(){this.open=true;},close(){this.open=false;},addEventListener(){}};
  const slider={id:'motion-phase',value:0},motionParts={'.motion-model':{outerHTML:''},'.motion-caption':{textContent:''},'[data-action="motion-play"]':{textContent:''},'#motion-phase':slider};
  const motionHost={dataset:{motion:'rabbit'},querySelector:s=>motionParts[s],querySelectorAll:()=>[]};
  const document={activeElement:null,addEventListener(n,fn){listeners.set(n,fn);},querySelectorAll(){return [];},querySelector(selector){if(selector==='.motion-observer')return motion?motionHost:null;return {'#app':app,'#dialog':dialog,'.save-label':status,'#main':{focus(){}},'#announcer':announcer,'#design-title':heading,'#report-download':link,'#trail-world':{}}[selector]||(selector==='#storage-warning'?warning:null);}};
  const context=vm.createContext({...inquiry,...inquiryViews,...model,...presentation,...shell,createNavigation,document,Blob,createTrailMap(){return {destroy(){},move(){}};},playSound(){},silence(){},window:{scrollTo(){}},URL:{createObjectURL(b){exported=b;return 'blob:test';},revokeObjectURL(){}},localStorage:{getItem(){return stored;},setItem(_,v){if(writeFailure)throw new Error('quota');stored=v;}}});
  const run=code=>vm.runInContext(code,context);run(source);
  return {run,app,dialog,status,announcer,slider,inputControl(target){listeners.get('input')({target});},get warning(){return warning;},get saved(){return stored;},get exported(){return exported;},setFail(v){writeFailure=v;},input(value){listeners.get('input')({target:{id:'invention-name',value}});}};
}
test('current controller reports storage failure immediately and recovers without losing progress',()=>{
  const a=appHarness({fail:true});assert.equal(a.run('storageOK'),false);assert.match(a.warning.text,/role="alert"/);assert.match(a.status.textContent,/저장/);a.run("s.observed.push('frog-eye');render()");assert.ok(a.warning);a.setFail(false);a.run('save()');assert.equal(a.warning,null);assert.deepEqual(JSON.parse(a.saved).observed,['frog-eye']);
});
test('current reset clears all new records and previous completed routes',()=>{
  const a=appHarness();a.run("s.adminUnlocked=true;s.activities=STAGES.flatMap(t=>[0,1,2,3].map(n=>`${t.id}-${n}`));s.completed=[1,2,3,4,5];stage=5;step=3;go('ending');act('reset',{dataset:{}})");assert.equal(a.run('screen'),'home');assert.equal(a.run('navigation.canGoBack'),false);assert.equal(a.run('s.activities.length'),0);assert.equal(a.run('s.completed.length'),0);assert.equal(a.run('s.adminUnlocked'),false);assert.equal(a.run('stage'),1);
});
test('current preview unlock grants access without granting stars or tools',()=>{
  const a=appHarness();a.run("act('admin',{dataset:{}})");assert.equal(a.run('s.adminUnlocked'),true);assert.equal(a.run('s.activities.length'),0);assert.equal(a.run('availableTools(s).length'),0);a.run("dialog.close();enter(4);act('advance',{dataset:{}})");assert.equal(a.run('step'),0);assert.equal(a.run('s.activities.length'),0);
});
test('current input and export escape markup and include both independent inventions',async()=>{
  const a=appHarness();a.run("s.adminUnlocked=true;stage=5;step=0;s.designs[0].problem='swim';s.designs[1].problem='warm';s.designs[1].name='포근 외투';screen='mission';render()");a.input('<script>alert(1)</script>');a.run('render()');assert.ok(!a.app.innerHTML.includes('<script>alert'));a.run('download()');assert.ok(!a.dialog.innerHTML.includes('<script>alert'));const text=await a.exported.text();assert.match(text,/발명 1:/);assert.match(text,/발명 2: 포근 외투/);assert.match(a.dialog.innerHTML,/&lt;script&gt;/);
});

test('controller records prediction and comparison, preserves input and prevents one-trial completion',()=>{
 const a=appHarness();a.run("s.adminUnlocked=true;enter(5);act('source-seen',{dataset:{}});act('design-choice',{dataset:{key:'feature',value:'web'}});act('design-choice',{dataset:{key:'structure',value:'wide'}});act('advance',{dataset:{}})");assert.equal(a.run('step'),1);a.run("act('experiment-run',{dataset:{}})");assert.equal(a.run('s.designs[0].experiment.trials.length'),0);a.run("act('prediction',{dataset:{value:'less'}});act('experiment-run',{dataset:{}})");assert.equal(a.run('s.designs[0].experiment.trials.length'),1);a.run("act('advance',{dataset:{}})");assert.equal(a.run('step'),1);a.run("act('experiment-level',{dataset:{value:'3'}});act('experiment-run',{dataset:{}});act('lab-summary',{dataset:{}});act('reflection',{dataset:{value:'surprised'}});s.designs[0].experiment.note='넓이를 바꾸니 미는 물이 달라졌어.';act('explain',{dataset:{value:'match'}});act('advance',{dataset:{}})");assert.equal(a.run('step'),2);assert.equal(a.run('s.records.designs[0].experiment.trials.length'),2);assert.equal(a.run('labSummary'),false);
});
test('evidence actions narrow candidates but still require both recorded clues',()=>{const a=appHarness();a.run("s.adminUnlocked=true;enter(4);act('clue-save',{dataset:{value:'web'}});act('case-animal',{dataset:{id:'duck'}});advance()");assert.equal(a.run('step'),0);a.run("act('clue-save',{dataset:{value:'feather'}});advance()");assert.equal(a.run('step'),1);a.run("previous();act('case-reset',{dataset:{}})");assert.equal(a.run('s.inquiry.evidence[0].length'),0);});

test('motion range keeps the newly entered value when stopping playback repaints the same slider',()=>{const a=appHarness({motion:true});a.run('motionPhase=0');a.slider.value=68;a.inputControl(a.slider);assert.equal(a.run('motionPhase'),68);assert.equal(a.slider.value,68);});
test('summary entry and footer reject an untested current setting and explain the next action',()=>{const a=appHarness();a.run("s.adminUnlocked=true;enter(5);s.designs[0].experiment.sourceSeen=true;s.designs[0].experiment.prediction='same';addExperimentTrial(s.designs[0]);s.designs[0].experiment.level=2;addExperimentTrial(s.designs[0]);step=1;s.designs[0].experiment.level=3;render();act('lab-summary',{dataset:{}})");assert.equal(a.run('labSummary'),false);assert.match(a.app.innerHTML,/지금 고른 모양도 시험/);assert.match(a.app.innerHTML,/data-action="lab-summary"[^>]*disabled/);a.run("addExperimentTrial(s.designs[0]);act('lab-summary',{dataset:{}})");assert.equal(a.run('labSummary'),true);});
