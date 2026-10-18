import * as researchReport from '../src/research-report.js';
import * as motionVideo from '../src/motion-video.js';
import * as storyPlayer from '../src/story-player.js';
import * as campaign from '../src/campaign.js';
import {campaignFixture} from './fixtures/campaign-state.mjs';
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
import * as drag from '../src/drag.js';

const source=readFileSync(new URL('../src/adventure-app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
function appHarness({fail=false,motion=false,three=false}={}){
  let stored=null,warning=null,writeFailure=fail,exported=null;
  const listeners=new Map(),heading={textContent:''},status={textContent:''},announcer={textContent:''},link={href:''};
  const app={_html:'',get innerHTML(){return this._html;},set innerHTML(v){this._html=v;warning=null;},querySelectorAll(){return [];},insertAdjacentHTML(_,text){warning={text,remove(){warning=null;}};}};
  const dialog={open:false,innerHTML:'',showModal(){this.open=true;},close(){this.open=false;},addEventListener(){}};
  const slider={id:'motion-phase',value:0},motionParts={'.motion-model':{outerHTML:''},'.motion-caption':{textContent:''},'[data-action="motion-play"]':{textContent:''},'#motion-phase':slider};
  const motionHost={dataset:{motion:'rabbit'},querySelector:s=>motionParts[s],querySelectorAll:()=>[]};
  const document={activeElement:null,addEventListener(n,fn){listeners.set(n,fn);},querySelectorAll(){return [];},querySelector(selector){if(selector==='.motion-observer')return motion?motionHost:null;return {'#app':app,'#dialog':dialog,'.save-label':status,'#main':{focus(){}},'#announcer':announcer,'#design-title':heading,'#report-download':link,'#trail-world':{}}[selector]||(selector==='#storage-warning'?warning:null);}};
  const context=vm.createContext({...researchReport,...storyPlayer,...motionVideo,...campaign,...inquiry,...inquiryViews,...model,...presentation,...shell,...drag,createNavigation,document,Blob,createTrailMap(){return {destroy(){},move(){}};},createVillage(){return {destroy(){},move(){}};},can3d(){return three;},disable3d(){},mount3d(){return {attach(){},call(){},destroy(){}};},playSound(){},silence(){},window:{scrollTo(){}},URL:{createObjectURL(b){exported=b;return 'blob:test';},revokeObjectURL(){}},localStorage:{getItem(){return stored;},setItem(_,v){if(writeFailure)throw new Error('quota');stored=v;}}});
  const run=code=>vm.runInContext(code,context);run(source);
  return {run,app,dialog,status,announcer,slider,inputControl(target){listeners.get('input')({target});},get warning(){return warning;},get saved(){return stored;},get exported(){return exported;},setFail(v){writeFailure=v;},input(value){listeners.get('input')({target:{id:'invention-name',value}});}};
}
test('current controller reports storage failure immediately and recovers without losing progress',()=>{
  const a=appHarness({fail:true});assert.equal(a.run('storageOK'),false);assert.match(a.warning.text,/role="alert"/);assert.match(a.status.textContent,/저장/);a.run("s.observed.push('frog-eye');render()");assert.ok(a.warning);a.setFail(false);a.run('save()');assert.equal(a.warning,null);assert.deepEqual(JSON.parse(a.saved).observed,['frog-eye']);
});

test('intro can be skipped without losing learning progress and replay does not reset it',()=>{
 const a=appHarness();a.run("s.observed=['frog-eye'];start()");assert.equal(a.run('screen'),'intro');assert.match(a.app.innerHTML,/story-video/);assert.match(a.app.innerHTML,/건너뛰기/);a.run("act('story-skip',{dataset:{}})");assert.equal(a.run('screen'),'map');assert.equal(a.run('s.introSeen'),true);assert.deepEqual(Array.from(a.run('s.observed')),['frog-eye']);a.run("act('story-intro',{dataset:{}});finishStory()");assert.equal(a.run('screen'),'map');assert.deepEqual(Array.from(a.run('s.observed')),['frog-eye']);
});
test('outro is locked before completion and opens the personal gallery when finished',()=>{
 const a=appHarness();a.run("act('story-outro',{dataset:{}})");assert.equal(a.run('screen'),'home');a.run("s=restoreExpedition("+JSON.stringify(JSON.stringify(campaignFixture()))+");s.campaign=freshCampaign([1,2,3,4,5]);act('story-outro',{dataset:{}})");assert.equal(a.run('screen'),'outro');a.run('finishStory()');assert.equal(a.run('screen'),'gallery');assert.equal(a.run('restoredPlaces(s).length'),5);
});
test('current reset clears all new records and previous completed routes',()=>{
  const a=appHarness();a.run("s.adminUnlocked=true;s.activities=STAGES.flatMap(t=>[0,1,2,3].map(n=>`${t.id}-${n}`));s.completed=[1,2,3,4,5];stage=5;step=3;go('ending');act('reset',{dataset:{}})");assert.equal(a.run('screen'),'home');assert.equal(a.run('navigation.canGoBack'),false);assert.equal(a.run('s.activities.length'),0);assert.equal(a.run('s.completed.length'),0);assert.equal(a.run('s.adminUnlocked'),false);assert.equal(a.run('stage'),1);
});
test('current preview unlock grants access without granting stars or tools',()=>{
  const a=appHarness();a.run("act('admin',{dataset:{}})");assert.equal(a.run('s.adminUnlocked'),true);assert.equal(a.run('s.activities.length'),0);assert.equal(a.run('availableTools(s).length'),0);a.run("dialog.close();enter(4);act('advance',{dataset:{}})");assert.equal(a.run('step'),0);assert.equal(a.run('s.activities.length'),0);
});
test('current input and export escape markup and include both independent inventions',async()=>{
  const a=appHarness();a.run("s.adminUnlocked=true;stage=5;step=0;s.designs[0].problem='swim';s.designs[1].problem='warm';s.designs[1].name='포근 외투';screen='mission';render()");a.input('<script>alert(1)</script>');a.run('render()');assert.ok(!a.app.innerHTML.includes('<script>alert'));a.run('download()');assert.ok(!a.dialog.innerHTML.includes('<script>alert'));const text=await a.exported.text();assert.match(text,/\[초안\] <script>/);assert.match(text,/\[초안\] 포근 외투/);assert.match(text,/완성품 인증에 포함되지 않음/);assert.match(a.dialog.innerHTML,/&lt;script&gt;/);
});

test('controller records prediction and comparison, preserves input and prevents one-trial completion',()=>{
 const a=appHarness();a.run("s.adminUnlocked=true;enter(5);act('source-seen',{dataset:{}});act('design-choice',{dataset:{key:'feature',value:'web'}});act('design-part',{dataset:{key:'toe',value:'wide'}});act('advance',{dataset:{}})");assert.equal(a.run('step'),1);a.run("act('experiment-run',{dataset:{}})");assert.equal(a.run('s.designs[0].experiment.trials.length'),0);a.run("act('prediction',{dataset:{value:'less'}});act('experiment-run',{dataset:{}})");assert.equal(a.run('s.designs[0].experiment.trials.length'),1);a.run("act('advance',{dataset:{}})");assert.equal(a.run('step'),1);a.run("act('experiment-level',{dataset:{value:'3'}});act('experiment-run',{dataset:{}});act('lab-summary',{dataset:{}});act('reflection',{dataset:{value:'surprised'}});s.designs[0].experiment.note='넓이를 바꾸니 미는 물이 달라졌어.';act('explain',{dataset:{value:'match'}});act('advance',{dataset:{}})");assert.equal(a.run('step'),2);assert.equal(a.run('s.records.designs[0].experiment.trials.length'),2);assert.equal(a.run('labSummary'),false);
});
test('investigation spends at most three clues, keeps spent energy, and needs proving grounds',()=>{const a=appHarness();a.run("s.adminUnlocked=true;enter(4);act('clue-spend',{dataset:{value:'1'}});act('clue-spend',{dataset:{value:'3'}});act('clue-spend',{dataset:{value:'4'}});act('clue-spend',{dataset:{value:'0'}})");assert.deepEqual(a.run('s.cases[0].opened'),['cover','move','life']);a.run("act('case-animal',{dataset:{id:'duck'}});act('case-ground',{dataset:{value:'cover'}});act('case-ground',{dataset:{value:'move'}});advance()");assert.equal(a.run('step'),0);assert.match(a.run('feedback.text'),/닭/);a.run("act('case-animal',{dataset:{id:'frog'}});act('case-animal',{dataset:{id:'duck'}})");assert.equal(a.run('s.cases[0].opened.length'),3,'changing the answer keeps spent energy');a.run("act('case-reset',{dataset:{}});act('clue-spend',{dataset:{value:'0'}});act('clue-spend',{dataset:{value:'1'}});act('case-animal',{dataset:{id:'duck'}});act('case-ground',{dataset:{value:'place'}});act('case-ground',{dataset:{value:'cover'}});advance()");assert.equal(a.run('step'),1);});

test('motion range keeps the newly entered value when stopping playback repaints the same slider',()=>{const a=appHarness({motion:true});a.run('motionPhase=0');a.slider.value=68;a.inputControl(a.slider);assert.equal(a.run('motionPhase'),68);assert.equal(a.slider.value,68);});
test('summary entry and footer reject an untested current setting and explain the next action',()=>{const a=appHarness();a.run("s.adminUnlocked=true;enter(5);s.designs[0].experiment.sourceSeen=true;s.designs[0].experiment.prediction='same';addExperimentTrial(s.designs[0]);s.designs[0].experiment.level=2;addExperimentTrial(s.designs[0]);step=1;s.designs[0].experiment.level=3;render();act('lab-summary',{dataset:{}})");assert.equal(a.run('labSummary'),false);assert.match(a.app.innerHTML,/지금 고른 모양도 시험/);assert.match(a.app.innerHTML,/data-action="lab-summary"[^>]*disabled/);a.run("addExperimentTrial(s.designs[0]);act('lab-summary',{dataset:{}})");assert.equal(a.run('labSummary'),true);});
test('a win immediately updates stars and shows the new task instruction; replay never grants another star',()=>{
  const a=appHarness();a.run("s.observed=['frog-eye','frog-leg','frog-skin','crab-eye','crab-leg','crab-shell'];enter(1);advance()");
  assert.equal(a.run('step'),1);assert.equal(a.run('feedback'),null);assert.match(a.app.innerHTML,/탐험 별 1개/);assert.match(a.app.innerHTML,/맞는 카드 2장만/);assert.equal(JSON.parse(a.saved).activities.length,1);
  a.run('previous();advance()');assert.equal(a.run('step'),1);assert.equal(a.run('feedback'),null);
});
test('drag cards and tap pick → place both fill gates, slots and the chain; wrong-kind cards bounce back',()=>{const a=appHarness();
  a.run("s.adminUnlocked=true;enter(2);act('pick',{dataset:{ref:'sort-bat',id:'bat'}});act('place',{dataset:{dropAction:'sort',zone:'yes'}})");assert.equal(a.run('s.sorts[0].bat'),'yes');assert.equal(a.run('picked'),null);
  a.run("act(dropData({id:'bat'},{dropAction:'sort',zone:'pool'}).action,{dataset:dropData({id:'bat'},{dropAction:'sort',zone:'pool'}).dataset})");assert.equal(a.run('s.sorts[0].bat'),undefined,'dragging back to the tray removes it');
  a.run("enter(1);step=1;act('compare',{dataset:{key:'common',value:'common-eyes'}});act('compare',{dataset:{key:'difference',value:'common-eyes'}})");assert.equal(a.run('s.compares[0].common'),undefined,'a card sits in one slot only');assert.equal(a.run('s.compares[0].difference'),'common-eyes');
  a.run("enter(3);act('link',{dataset:{id:'frog',key:'environment',value:'web',kind:'body'}})");assert.equal(a.run('s.links.frog.environment'),undefined);assert.match(a.run('feedback.text'),/사는 곳/);
});
test('a pin on the 3D specimen focuses that part without recording it; a wrong part only hints',()=>{
  const a=appHarness();a.run("enter(1)");const o=a.run("opts3d('scanner')");
  assert.equal(o.animal,'frog');assert.deepEqual(o.parts,['눈','뒷다리','몸 표면']);assert.deepEqual(o.pinned,[]);
  o.onPick(1);assert.equal(a.run('focusIndex'),1);assert.equal(a.run("pinned.has('frog-leg')"),true);assert.deepEqual(a.run('s.observed'),[]);
  assert.deepEqual(a.run("opts3d('scanner').pinned"),[1]);
  a.run("act('observe',{dataset:{id:'frog-leg',value:'right'}})");assert.deepEqual(a.run('s.observed'),['frog-leg']);assert.deepEqual(a.run("opts3d('scanner').found"),[1]);
  a.run("act('animal-tab',{dataset:{id:'crab'}})");assert.equal(a.run("opts3d('scanner').animal"),'crab');
});
test('finding an animal in the 3D dome records the discovery and opens its motion notes',()=>{
  const a=appHarness();a.run("s.adminUnlocked=true;enter(3)");const o=a.run("opts3d('dome')");
  assert.deepEqual([...o.zones],['forest','pond','coast','dry','cold']);assert.deepEqual([...o.extras.map(x=>x.animal)],['camel','penguin']);assert.deepEqual([...o.targets.map(t=>t.animal)],['rabbit','frog','marine']);assert.equal(o.active,'forest');
  o.onFind('pond-frog');assert.deepEqual([...a.run('s.discovered')],['pond-frog']);assert.equal(a.run('activeHabitat'),'pond');
  assert.equal(a.run("opts3d('dome').targets[1].found"),true);
  a.run("act('motion-predict',{dataset:{id:'frog',value:'other'}});act('motion-frame',{dataset:{value:'34'}});act('motion-capture',{dataset:{id:'frog'}})");assert.equal(a.run('s.inquiry.motion.frog'),1);
});
test('extra dome animals open their own optional videos without changing the required activity',()=>{
  const a=appHarness({three:true});a.run("s.adminUnlocked=true;enter(3)");const before=a.run('JSON.stringify(s)');
  a.run("opts3d('dome').onLook('dry')");assert.equal(a.run('activeHabitat'),'dry');assert.equal(a.run("looked.has('dry')"),true);
  assert.equal(a.run('JSON.stringify(s)'),before,'looking records nothing');assert.equal(a.run('claimTask(s,3,0).ok'),false);
  assert.match(a.app.innerHTML,/낙타가 넓적한 발바닥/);assert.match(a.app.innerHTML,/data-motion="camel"/);assert.doesNotMatch(a.app.innerHTML,/data-motion="rabbit"/);
  a.run("act('habitat',{dataset:{id:'cold'}})");assert.equal(a.run('activeHabitat'),'cold');a.run("opts3d('dome').onLook('cold')");assert.match(a.app.innerHTML,/data-motion="penguin"/);assert.match(a.app.innerHTML,/선택 관찰/);
  const flat=appHarness();flat.run("s.adminUnlocked=true;enter(3);act('habitat',{dataset:{id:'cold'}})");assert.equal(flat.run('activeHabitat'),'forest','without 3D the extra zones are not selectable');
});

test('last exploration routes into commissions; sending both restores the place, preserves eighteen stars and updates map targets',()=>{
 const a=appHarness();a.run('s='+JSON.stringify(campaignFixture())+';stage=1;step=3;screen="mission";advance()');assert.equal(a.run('screen'),'commission');assert.equal(a.run('commissionIndex'),0);assert.equal(a.run('restoredPlaces(s).length'),0);
 for(const [key,value]of Object.entries({'frog-label':'bare','frog-proof':'skin','crab-label':'claw','crab-proof':'legs'}))a.run(`act('commission-choice',{dataset:${JSON.stringify({key,value})}})`);
 a.run("act('commission-submit',{dataset:{}})");assert.equal(a.run('screen'),'commission');assert.equal(a.run('campaignDone(s,1,0)'),true);a.run("act('commission-next',{dataset:{}})");assert.equal(a.run('commissionIndex'),1);
 for(const [key,value]of Object.entries({duck:'feather',rabbit:'fur',same:'legs'}))a.run(`act('commission-choice',{dataset:${JSON.stringify({key,value})}})`);
 a.run("act('commission-submit',{dataset:{}})");assert.equal(a.run('screen'),'reward');assert.deepEqual([...a.run('restoredPlaces(s)')],[1]);assert.equal(a.run('s.activities.length'),18);assert.match(a.app.innerHTML,/연구원 소라의 답장/);
 a.run("act('map',{dataset:{}})");assert.equal(a.run('selectedStage'),2);a.run("act('gallery',{dataset:{}})");assert.match(a.app.innerHTML,/의뢰 2\/10/);assert.ok(!a.app.innerHTML.includes('발명과 탐험 인증서'));
});

test('commission tap placement, evidence, reload, navigation and reset preserve their own state',()=>{
 const a=appHarness();a.run('s='+JSON.stringify(campaignFixture())+";chooseCommission(s,2,0,'reason','wings');claimCommission(s,2,0);openCommission(2,1);chooseCommission(s,2,1,'criterion','legs')");
 a.run("act('pick',{dataset:{ref:'arrival-hen',id:'hen'}});act('place',{dataset:{dropAction:'commission-sort',zone:'yes'}})");assert.equal(a.run("campaignDraft(s,2,1).answers.hen"),'yes');assert.equal(a.run('picked'),null);
 a.run("act('commission-evidence',{dataset:{}})");assert.equal(a.run('evidenceOpen'),true);assert.equal(a.run('campaignDraft(s,2,1).usedTool'),true);
 a.run("s=restoreExpedition(JSON.stringify(s));go('gallery');back()");assert.equal(a.run('screen'),'commission');assert.equal(a.run('stage'),2);assert.equal(a.run('commissionIndex'),1);assert.equal(a.run('campaignDraft(s,2,1).answers.hen'),'yes');
 a.run("act('reset',{dataset:{}})");assert.equal(a.run('Object.keys(s.campaign.records).length'),0);assert.equal(a.run('Object.keys(s.campaign.drafts).length'),0);assert.equal(a.run('commissionIndex'),0);
});

test('animal-specific video goals reject a repeated second-scene strategy; wrong predictions have no penalty',()=>{
 const a=appHarness();
 for(const id of ['rabbit','frog','duck','butterfly','crab','marine']){
  a.run(`s.inquiry.motion={};act('motion-predict',{dataset:{id:'${id}',value:'other'}});motionPlayer={ready:true,pause(){},destroy(){}};motionPhase=motionFramePhase('${id}',1);act('motion-capture',{dataset:{id:'${id}'}})`);
  assert.equal(a.run(`s.inquiry.motion.${id}===1`),inquiry.MOTIONS[id].target===1,`${id}: repeated scene two`);
  a.run(`motionPlayer={ready:true,pause(){},destroy(){}};motionPhase=motionFramePhase('${id}',MOTIONS.${id}.target);act('motion-capture',{dataset:{id:'${id}'}})`);
  assert.equal(a.run(`s.inquiry.motion.${id}`),1);assert.equal(a.run(`s.inquiry.motionPredictions.${id}`),'other');assert.equal(a.run(`s.inquiry.motionEvidence.${id}.frame`),inquiry.MOTIONS[id].target);
  a.run(`motionPlayer={ready:true,pause(){},destroy(){}};motionPhase=motionFramePhase('${id}',(MOTIONS.${id}.target+1)%3);act('motion-capture',{dataset:{id:'${id}'}})`);
  assert.equal(a.run(`s.inquiry.motion.${id}`),1,'a wrong retry preserves previously awarded evidence');
 }
});

test('completed places open a review picker and any earned activity is reachable without overwriting works',()=>{
 const a=appHarness();a.run('s=restoreExpedition('+JSON.stringify(JSON.stringify(campaignFixture()))+');enter(5)');
 assert.match(a.dialog.innerHTML,/활동 선택/);assert.match(a.dialog.innerHTML,/새 발명 만들기/);
 const before=a.run('JSON.stringify(s.records)');a.run("act('review-open',{dataset:{id:'5',value:'2'}})");
 assert.equal(a.run('step'),2);assert.equal(a.run('screen'),'mission');assert.equal(a.dialog.open,false);assert.equal(a.run('JSON.stringify(s.records)'),before);
 const fresh=appHarness();fresh.run("enter(1);act('review-open',{dataset:{id:'1',value:'3'}})");assert.equal(fresh.run('step'),0);
});
