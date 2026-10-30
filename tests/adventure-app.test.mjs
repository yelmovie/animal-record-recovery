import * as researchReport from '../src/research-report.js';
import * as recordStorage from '../src/record-storage.js';
import * as studioModel from '../src/studio.js';
import * as studioRuntime from '../src/studio-runtime.js';
import * as motionVideo from '../src/motion-video.js';
import * as flashlight from '../src/flashlight.js';
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
import * as conceptVideo from '../src/concept-video.js';
import * as concepts from '../src/concepts.js';

const source=readFileSync(new URL('../src/adventure-app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
function appHarness({fail=false,motion=false,three=false,storedRecord=null}={}){
  let stored=storedRecord,warning=null,writeFailure=fail,exported=null;const music=[];
  const listeners=new Map(),heading={textContent:''},status={textContent:''},announcer={textContent:''},link={href:''},quest={innerHTML:'',inert:true},travel={textContent:''};
  const app={_html:'',get innerHTML(){return this._html;},set innerHTML(v){this._html=v;warning=null;},querySelectorAll(){return [];},insertAdjacentHTML(_,text){warning={text,remove(){warning=null;}};}};
  const dialog={open:false,innerHTML:'',showModal(){this.open=true;},close(){this.open=false;},addEventListener(){}};
  const slider={id:'motion-phase',value:0},motionParts={'.motion-model':{outerHTML:''},'.motion-caption':{textContent:''},'[data-action="motion-play"]':{textContent:''},'#motion-phase':slider};
  const motionHost={dataset:{motion:'rabbit'},querySelector:s=>motionParts[s],querySelectorAll:()=>[]};
  const document={activeElement:null,addEventListener(n,fn){listeners.set(n,fn);},querySelectorAll(){return [];},querySelector(selector){if(selector==='.motion-observer')return motion?motionHost:null;return {'#app':app,'#dialog':dialog,'.save-label':status,'#main':{focus(){}},'#announcer':announcer,'#design-title':heading,'#report-download':link,'#trail-world':{},'#quest-panel':quest,'#travel-text':travel}[selector]||(selector==='#storage-warning'?warning:null);}};
  const context=vm.createContext({...recordStorage,...flashlight,...studioModel,...studioRuntime,...researchReport,...storyPlayer,...motionVideo,...campaign,...inquiry,...inquiryViews,...model,...presentation,...shell,...drag,...conceptVideo,...concepts,createNavigation,document,Blob,createTrailMap(){return {destroy(){},move(){}};},createVillage(){return {destroy(){},move(){}};},can3d(){return three;},disable3d(){},warm3d(){},mount3d(){return {attach(){},call(){},destroy(){}};},playSound(){},silence(){},playMusic(key){music.push(key);},setMusicVolume(){},setSoundVolume(){},window:{scrollTo(){}},URL:{createObjectURL(b){exported=b;return 'blob:test';},revokeObjectURL(){}},localStorage:{getItem(){return stored;},setItem(_,v){if(writeFailure)throw new Error('quota');stored=v;}}});
  const run=code=>vm.runInContext(code,context);run(source);
  return {run,app,dialog,music,status,announcer,slider,inputControl(target){listeners.get('input')({target});},changeControl(target){listeners.get('change')({target});},get warning(){return warning;},get saved(){return stored;},get exported(){return exported;},setFail(v){writeFailure=v;},input(value){listeners.get('input')({target:{id:'invention-name',value}});}};
}
test('current controller reports storage failure immediately and recovers without losing progress',()=>{
  const a=appHarness({fail:true});assert.equal(a.run('storageOK'),false);assert.match(a.warning.text,/role="alert"/);assert.match(a.status.textContent,/저장/);a.run("s.observed.push('frog-eye');render()");assert.ok(a.warning);a.setFail(false);a.run('save()');assert.equal(a.warning,null);assert.deepEqual(JSON.parse(a.saved).observed,['frog-eye']);
});

test('opening and navigating the real controller never overwrites a corrupt or future original',()=>{
 for(const raw of ['{손상된 원본',JSON.stringify({version:99,record:'원본'})]){
  const a=appHarness({storedRecord:raw});assert.equal(a.saved,raw);assert.ok(a.warning);
  a.run("settings();go('map');go('home');render();save()");assert.equal(a.saved,raw);assert.equal(a.dialog.open,false);assert.ok(a.warning);
 }
});

test('an explicit reset that cannot save retains the work and opens preservation help',()=>{
 const original=model.freshExpedition();original.observed=['frog-eye'];const a=appHarness({storedRecord:JSON.stringify(original)});a.setFail(true);
 a.run("act('reset-confirm',{dataset:{}})");assert.equal(a.run('s.observed.length'),1);
 a.run("act('reset',{dataset:{}})");assert.equal(a.run('s.observed.length'),1);assert.match(a.dialog.innerHTML,/기록 보존|백업/);assert.deepEqual(JSON.parse(a.saved).observed,['frog-eye']);
});

test('intro can be skipped without losing learning progress and replay does not reset it',()=>{
 const a=appHarness();a.run("s.observed=['frog-eye'];start()");assert.equal(a.run('screen'),'intro');assert.match(a.app.innerHTML,/story-video/);assert.match(a.app.innerHTML,/건너뛰기/);a.run("act('story-skip',{dataset:{}})");assert.equal(a.run('screen'),'map');assert.equal(a.run('s.introSeen'),true);assert.deepEqual(Array.from(a.run('s.observed')),['frog-eye']);a.run("act('story-intro',{dataset:{}});finishStory()");assert.equal(a.run('screen'),'map');assert.deepEqual(Array.from(a.run('s.observed')),['frog-eye']);
});
test('outro is locked before completion and opens the personal gallery when finished',()=>{
 const a=appHarness();a.run("act('story-outro',{dataset:{}})");assert.equal(a.run('screen'),'home');a.run("s=restoreExpedition("+JSON.stringify(JSON.stringify(campaignFixture()))+");s.campaign=freshCampaign([1,2,3,4,5]);act('story-outro',{dataset:{}})");assert.equal(a.run('screen'),'outro');a.run('finishStory()');assert.equal(a.run('screen'),'gallery');assert.equal(a.run('restoredPlaces(s).length'),5);
});

test('the village overview unlocks only after all five places are restored, including resident requests',()=>{
 const a=appHarness();a.run('s.adminUnlocked=true;go("map");act("map-overview",{dataset:{}})');
 assert.equal(a.run('mapOverview'),false);assert.doesNotMatch(a.app.innerHTML,/map-complete-banner|data-action="map-overview"/);
 a.run('s=restoreExpedition('+JSON.stringify(JSON.stringify(campaignFixture()))+');go("map");act("map-overview",{dataset:{}})');
 assert.equal(a.run('s.completed.length'),5);assert.equal(a.run('restoredPlaces(s).length'),0);assert.equal(a.run('mapOverview'),false);
 a.run('s.campaign=freshCampaign([1,2,3,4]);go("map")');assert.equal(a.run('mapOverview'),false);
 a.run('s.campaign=freshCampaign([1,2,3,4,5]);stage=5;go("reward")');
 assert.match(a.app.innerHTML,/data-action="story-outro"[^>]*>전시관 문 열기 영상 보기/,'the last restoration leads straight to the finale video');assert.match(a.app.innerHTML,/data-action="map"[^>]*>복구된 마을 먼저 보기/);
 a.run('act("map",{dataset:{}})');assert.equal(a.run('screen'),'map');assert.equal(a.run('mapOverview'),true);assert.match(a.app.innerHTML,/중앙 코어 점등/);
 assert.doesNotMatch(a.app.innerHTML,/class="map-direction"/);
 a.run('act("story-outro",{dataset:{}});finishStory()');assert.equal(a.run('screen'),'gallery');
});

test('walking after the finale preserves the saved map position and stages remain revisitable',()=>{
 const a=appHarness();a.run('s=restoreExpedition('+JSON.stringify(JSON.stringify(campaignFixture()))+');s.campaign=freshCampaign([1,2,3,4,5]);s.mapPosition="3";go("map")');
 const before=JSON.parse(a.saved);
 a.run('act("map-explore",{dataset:{}})');assert.equal(a.run('mapOverview'),false);assert.match(a.app.innerHTML,/class="map-direction"/);assert.match(a.app.innerHTML,/data-action="map-overview"/);
 a.run('act("map-overview",{dataset:{}})');assert.equal(a.run('mapOverview'),true);assert.deepEqual(JSON.parse(a.saved),before);
 a.run('selectMap(2)');assert.equal(a.run('mapOverview'),false);assert.equal(a.run('selectedStage'),2);assert.equal(a.run('autoEnter'),true);assert.equal(a.run('s.mapPosition'),'3');
});
test('current reset clears all new records and previous completed routes',()=>{
  const a=appHarness();a.run("s.adminUnlocked=true;s.activities=STAGES.flatMap(t=>[0,1,2,3].map(n=>`${t.id}-${n}`));s.completed=[1,2,3,4,5];stage=5;step=3;go('ending');act('reset',{dataset:{}})");assert.equal(a.run('screen'),'home');assert.equal(a.run('navigation.canGoBack'),false);assert.equal(a.run('s.activities.length'),0);assert.equal(a.run('s.completed.length'),0);assert.equal(a.run('s.adminUnlocked'),false);assert.equal(a.run('stage'),1);
});
test('current preview unlock grants access without granting stars or tools',()=>{
  const a=appHarness();a.run("act('admin',{dataset:{}})");assert.equal(a.run('s.adminUnlocked'),true);assert.equal(a.run('s.activities.length'),0);assert.equal(a.run('availableTools(s).length'),0);a.run("dialog.close();enter(4);act('advance',{dataset:{}})");assert.equal(a.run('step'),0);assert.equal(a.run('s.activities.length'),0);
});

test('teacher preview never writes answers, stars or completions to the student save and restores it on exit',()=>{
 const a=appHarness();a.run("s.observed=['frog-eye'];s.activities=['1-0'];save()");const before=JSON.parse(a.saved);
 a.run("act('admin',{dataset:{}});s.observed.push('crab-eye');s.activities.push('1-1');s.completed.push(1);s.stage=5;save()");
 assert.equal(a.run('s.adminUnlocked'),true);assert.deepEqual(JSON.parse(a.saved),before);
 assert.equal(model.restoreExpedition(a.saved).adminUnlocked,false);
 a.run("act('preview-end',{dataset:{}})");
 assert.equal(a.run('screen'),'map');assert.equal(a.run('s.adminUnlocked'),false);
 assert.deepEqual(Array.from(a.run('s.observed')),before.observed);assert.deepEqual(Array.from(a.run('s.activities')),before.activities);assert.deepEqual(Array.from(a.run('s.completed')),before.completed);
 assert.deepEqual(JSON.parse(a.saved),before);
});

test('locked map selection stops pending entry and points to the actual next unfinished place',()=>{
 const a=appHarness();a.run("go('map');selectMap(1);selectMap(5)");
 assert.equal(a.run('autoEnter'),false);assert.equal(a.dialog.open,true);
 assert.match(a.dialog.innerHTML,/아직 들어갈 수 없어요 · 발명의 공방/);
 assert.match(a.dialog.innerHTML,/관찰의 숲으로 가기/);assert.equal(a.run('screen'),'map');
 a.run("act('locked-next',{dataset:{id:'1'}})");assert.equal(a.dialog.open,false);assert.equal(a.run('selectedStage'),1);assert.equal(a.run('autoEnter'),true);
});
test('a walk cut short by a locked place drops its "on the way" line',()=>{
 const a=appHarness();a.run("go('map');selectMap(1)");assert.match(a.run("document.querySelector('#travel-text').textContent"),/관찰의 숲으로 가는 중/);
 a.run('selectMap(5)');assert.doesNotMatch(a.run("document.querySelector('#travel-text').textContent"),/가는 중/);assert.equal(a.run('arrived'),false);
});
test('the diary escapes learner writing, keeps both draft inventions and offers no TXT export',()=>{
  const a=appHarness();a.run("s.adminUnlocked=true;stage=5;step=0;s.designs[0].problem='swim';s.designs[1].problem='warm';s.designs[1].name='포근 외투';screen='mission';render()");a.input('<script>alert(1)</script>');a.run('render()');assert.ok(!a.app.innerHTML.includes('<script>alert'));a.run('download()');assert.ok(!a.dialog.innerHTML.includes('<script>alert'));assert.equal(a.exported,null);assert.match(a.dialog.innerHTML,/포근 외투/);assert.match(a.dialog.innerHTML,/만들고 있는/);assert.match(a.dialog.innerHTML,/&lt;script&gt;/);assert.doesNotMatch(a.dialog.innerHTML,/TXT|report-download|textarea/);
});

test('controller records prediction and comparison, preserves input and prevents one-trial completion',()=>{
 const a=appHarness();a.run("s.adminUnlocked=true;enter(5);act('source-seen',{dataset:{}});act('design-choice',{dataset:{key:'feature',value:'web'}});act('design-part',{dataset:{key:'toe',value:'wide'}});s.designs[0].name='내 수영 오리발';act('advance',{dataset:{}})");assert.equal(a.run('step'),1);a.run("act('experiment-run',{dataset:{}})");assert.equal(a.run('s.designs[0].experiment.trials.length'),0);a.run("act('prediction',{dataset:{value:'less'}});act('experiment-run',{dataset:{}})");assert.equal(a.run('s.designs[0].experiment.trials.length'),1);a.run("act('advance',{dataset:{}})");assert.equal(a.run('step'),1);a.run("act('experiment-level',{dataset:{value:'3'}});act('experiment-run',{dataset:{}});act('lab-summary',{dataset:{}});act('reflection',{dataset:{value:'surprised'}});s.designs[0].experiment.note='넓이를 바꾸니 미는 물이 달라졌어.';act('explain',{dataset:{value:'match'}});act('advance',{dataset:{}})");assert.equal(a.run('step'),2);assert.equal(a.run('s.records.designs[0].experiment.trials.length'),2);assert.equal(a.run('labSummary'),false);
});
test('investigation can collect more clues while still requiring grounds that distinguish the chosen animal',()=>{const a=appHarness();a.run("s.adminUnlocked=true;enter(4);act('clue-spend',{dataset:{value:'1'}});act('clue-spend',{dataset:{value:'3'}});act('clue-spend',{dataset:{value:'4'}});act('clue-spend',{dataset:{value:'0'}})");assert.deepEqual(a.run('s.cases[0].opened'),['cover','move','life','place']);a.run("act('case-animal',{dataset:{id:'duck'}});act('case-ground',{dataset:{value:'cover'}});act('case-ground',{dataset:{value:'move'}});advance()");assert.equal(a.run('step'),0);assert.match(a.run('feedback.text'),/닭/);a.run("act('case-animal',{dataset:{id:'frog'}});act('case-animal',{dataset:{id:'duck'}})");assert.equal(a.run('s.cases[0].opened.length'),4,'changing the answer keeps found clues');a.run("act('case-reset',{dataset:{}});act('clue-spend',{dataset:{value:'0'}});act('clue-spend',{dataset:{value:'1'}});act('case-animal',{dataset:{id:'duck'}});act('case-ground',{dataset:{value:'place'}});act('case-ground',{dataset:{value:'cover'}});advance()");assert.equal(a.run('step'),1);});

test('investigation navigation opens the evidence step and failed checks return to the relevant panel',()=>{
 const a=appHarness();a.run("s.adminUnlocked=true;enter(4);act('case-continue',{dataset:{}})");
 assert.equal(a.run('s.cases[0].opened.length'),0);assert.equal(a.run('step'),0);assert.equal(a.run('s.activities.length'),0);
 a.run("act('clue-spend',{dataset:{value:'0'}});act('clue-spend',{dataset:{value:'1'}});act('case-animal',{dataset:{id:'duck'}});act('case-continue',{dataset:{}})");
 assert.equal(a.run("panelPages.get(panelKey('.case-activity'))"),1);assert.equal(a.run('step'),0);
 a.run("act('case-animal',{dataset:{id:'frog'}});advance()");
 assert.equal(a.run("panelPages.get(panelKey('.case-activity'))"),0);assert.equal(a.run('step'),0);
 a.run("act('case-animal',{dataset:{id:'duck'}});advance()");
 assert.equal(a.run("panelPages.get(panelKey('.case-activity'))"),1);
 a.run("act('case-ground',{dataset:{value:'place'}});act('case-ground',{dataset:{value:'cover'}});advance()");assert.equal(a.run('step'),1);
});

test('a flashlight discovery is only saved on attaching, replay does not duplicate it, and guesses still need grounds',()=>{
 const a=appHarness();a.run("s.adminUnlocked=true;enter(4);act('flashlight-clue',{dataset:{value:'1'}})");
 assert.equal(a.run('s.cases[0].opened.length'),0);assert.match(a.dialog.innerHTML,/몸이 깃털로 덮여 있어/);
 a.run("act('flashlight-collect',{dataset:{value:'1'}});act('flashlight-collect',{dataset:{value:'1'}})");
 assert.deepEqual([...a.run('s.cases[0].opened')],['cover']);assert.equal(a.run('s.activities.length'),0);
 a.run("act('flashlight-collect',{dataset:{value:'2'}});act('flashlight-guess',{dataset:{}})");assert.match(a.dialog.innerHTML,/flashlight-candidates/);
 a.run("act('case-animal',{dataset:{id:'duck'}});advance()");assert.equal(a.run('step'),0);
 a.run("act('case-ground',{dataset:{value:'cover'}});act('case-ground',{dataset:{value:'foot'}});advance()");assert.equal(a.run('step'),1);
});

test('motion range keeps the newly entered value when stopping playback repaints the same slider',()=>{const a=appHarness({motion:true});a.run('motionPhase=0');a.slider.value=68;a.inputControl(a.slider);assert.equal(a.run('motionPhase'),68);assert.equal(a.slider.value,68);});

test('finishing a video seek keeps the decoded player and its playback permission to take a photo',()=>{
 const a=appHarness({motion:true});a.run('motionPlayer={viewed:true,ready:true,pause(){},seek(){}}');
 a.slider.value=10;a.inputControl(a.slider);a.changeControl(a.slider);
 assert.equal(a.run('motionPlayer.viewed'),true);assert.equal(a.run('motionPlayer.ready'),true);assert.equal(a.run('motionPhase'),10);
});
test('summary entry and footer reject an untested current setting and explain the next action',()=>{const a=appHarness();a.run("s.adminUnlocked=true;enter(5);s.designs[0].experiment.sourceSeen=true;s.designs[0].experiment.prediction='same';addExperimentTrial(s.designs[0]);s.designs[0].experiment.level=2;addExperimentTrial(s.designs[0]);step=1;s.designs[0].experiment.level=3;render();act('lab-summary',{dataset:{}})");assert.equal(a.run('labSummary'),false);assert.match(a.app.innerHTML,/지금 고른 모양도 시험/);assert.match(a.app.innerHTML,/data-action="lab-summary"[^>]*disabled/);a.run("addExperimentTrial(s.designs[0]);act('lab-summary',{dataset:{}})");assert.equal(a.run('labSummary'),1,'the summary opens on its comparison page');});
test('a win immediately updates stars and shows the new task instruction; replay never grants another star',()=>{
  const a=appHarness();a.run("s.observed=['frog-eye','frog-leg','frog-skin','crab-eye','crab-leg','crab-shell'];enter(1);advance()");
  assert.equal(a.run('step'),1);assert.equal(a.run('feedback'),null);assert.match(a.app.innerHTML,/맞는 카드 2장만/);assert.equal(JSON.parse(a.saved).activities.length,1);
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
  assert.doesNotMatch(a.app.innerHTML,/넓적한 발바닥으로/,'the body part waits for a prediction');assert.match(a.app.innerHTML,/건조한 곳에서 낙타가 움직이고 있어/);assert.match(a.app.innerHTML,/data-motion="camel"/);
  a.run("act('motion-predict',{dataset:{id:'camel',value:'other'}})");assert.match(a.app.innerHTML,/낙타가 넓적한 발바닥/);assert.doesNotMatch(a.app.innerHTML,/data-motion="rabbit"/);
  a.run("act('habitat',{dataset:{id:'cold'}})");assert.equal(a.run('activeHabitat'),'cold');a.run("opts3d('dome').onLook('cold')");assert.match(a.app.innerHTML,/data-motion="penguin"/);assert.match(a.app.innerHTML,/추가 관찰/);
  const flat=appHarness(),flatBefore=flat.run("s.adminUnlocked=true;enter(3);JSON.stringify(s)");flat.run("act('habitat',{dataset:{id:'cold'}})");assert.equal(flat.run('activeHabitat'),'cold','without 3D the extra zones are still tabs');assert.match(flat.app.innerHTML,/data-action="dome-look" data-id="cold"/);
  flat.run("act('dome-look',{dataset:{id:'cold'}})");assert.match(flat.app.innerHTML,/data-motion="penguin"/);assert.equal(flat.run('JSON.stringify(s)'),flatBefore,'looking in 2D records nothing either');
});

test('exploration delivers a dismissible letter and one reply atomically restores both records',()=>{
 const a=appHarness();a.run('s='+JSON.stringify(campaignFixture())+';stage=1;step=7;screen="mission";advance()');assert.equal(a.run('screen'),'mission');assert.equal(a.dialog.open,true);assert.match(a.dialog.innerHTML,/편지가 도착했어/);
 a.run("act('close-dialog',{dataset:{}})");assert.equal(a.dialog.open,false);assert.equal(a.run('screen'),'mission');
 a.run("act('commission-open',{dataset:{id:'1'}});act('commission-accept',{dataset:{id:'1'}})");assert.equal(a.run('screen'),'commission');assert.equal(a.dialog.open,false);
 for(const [key,value]of Object.entries({'frog-label':'bare','frog-proof':'skin','crab-label':'claw','crab-proof':'legs'}))a.run(`act('commission-choice',{dataset:${JSON.stringify({key,value,commissionIndex:'0'})}})`);
 a.run("act('commission-submit',{dataset:{}})");assert.equal(a.run('screen'),'commission');assert.equal(a.run('campaignDone(s,1,0)'),false);
 for(const [key,value]of Object.entries({duck:'feather',rabbit:'fur',same:'legs'}))a.run(`act('commission-choice',{dataset:${JSON.stringify({key,value,commissionIndex:'1'})}})`);
 a.run("act('commission-submit',{dataset:{}})");assert.equal(a.run('screen'),'commission','the reply leads straight into the last challenge');assert.equal(a.run('commissionIndex'),2);assert.deepEqual([...a.run('restoredPlaces(s)')],[1]);
 a.run("for(const r of missionRows(s,1,2,campaignDraft(s,1,2)))act('commission-choice',{dataset:{key:r.key,value:String(r.answer),commissionIndex:'2'}});act('commission-submit',{dataset:{}})");assert.equal(a.run('screen'),'reward');assert.equal(a.run('s.activities.length'),24);assert.match(a.app.innerHTML,/연구원 소라의 답장/);
 a.run("act('map',{dataset:{}})");assert.equal(a.run('selectedStage'),2);a.run("act('gallery',{dataset:{}})");assert.match(a.app.innerHTML,/주민의 부탁 1\/5/);assert.ok(!a.app.innerHTML.includes('발명과 탐험 인증서'));
});

test('commission tap placement, evidence, reload, navigation and reset preserve their own state',()=>{
 const a=appHarness();a.run('s='+JSON.stringify(campaignFixture())+";chooseCommission(s,2,0,'reason','wings');claimCommission(s,2,0);openCommission(2,1);chooseCommission(s,2,1,'criterion','legs')");
 a.run("act('pick',{dataset:{ref:'arrival-hen',id:'hen'}});act('place',{dataset:{dropAction:'commission-sort',zone:'yes'}})");assert.equal(a.run("campaignDraft(s,2,1).answers.hen"),'yes');assert.equal(a.run('picked'),null);
 a.run("act('commission-evidence',{dataset:{}})");assert.equal(a.run('evidenceOpen'),true);assert.equal(a.run('campaignDraft(s,2,1).usedTool'),true);
 a.run("s=restoreExpedition(JSON.stringify(s));go('gallery');back()");assert.equal(a.run('screen'),'commission');assert.equal(a.run('stage'),2);assert.equal(a.run('commissionIndex'),1);assert.equal(a.run('campaignDraft(s,2,1).answers.hen'),'yes');
 a.run("act('reset',{dataset:{}})");assert.equal(a.run('Object.keys(s.campaign.records).length'),0);assert.equal(a.run('Object.keys(s.campaign.drafts).length'),0);assert.equal(a.run('commissionIndex'),0);
});

test('combined request tap placements retain their part scope and cannot cross into another part',()=>{
 const a=appHarness();a.run('s='+JSON.stringify(campaignFixture())+";openCommission(2,0);act('commission-choice',{dataset:{commissionIndex:'1',key:'criterion',value:'legs'}})");
 a.run("act('pick',{dataset:{ref:'arrival-hen',id:'hen',commissionIndex:'1'}});act('place',{dataset:{commissionIndex:'1',dropAction:'commission-sort',zone:'yes'}})");
 assert.equal(a.run("campaignDraft(s,2,1).answers.hen"),'yes');assert.equal(a.run("campaignDraft(s,2,0).answers.hen"),undefined);
 a.run("toast=()=>{};act('pick',{dataset:{ref:'arrival-bat',id:'bat',commissionIndex:'1'}});act('place',{dataset:{commissionIndex:'0',dropAction:'commission-sort',zone:'yes'}})");
 assert.equal(a.run("campaignDraft(s,2,1).answers.bat"),undefined);assert.equal(a.run('picked'),null);
});
test('body part buttons record correct observations without any pin, reject wrong choices, and move to the next animal',()=>{
 const a=appHarness({three:true});a.run("enter(1);act('inspect',{dataset:{value:'1'}});act('observe',{dataset:{id:'frog-leg',value:'wrong-0'}})");
 assert.equal(a.run('s.observed.length'),0);assert.equal(a.run('pinned.size'),0);
 a.run("act('observe',{dataset:{id:'frog-leg',value:'right'}});act('observe',{dataset:{id:'frog-leg',value:'right'}})");
 assert.deepEqual([...a.run('s.observed')],['frog-leg']);assert.equal(a.run('pinned.size'),0);
 a.run("act('inspect',{dataset:{id:'crab',value:'2'}})");assert.equal(a.run('s.activeAnimal'),'crab');assert.equal(a.run('focusIndex'),2);
});
test('any decoded chosen moment is accepted without a prediction; failed retakes preserve the saved photo',()=>{
 const a=appHarness();
 for(const id of ['rabbit','frog','duck','butterfly','crab','marine']){
  a.run(`motionPhase=10;motionPlayer={ready:true,viewed:true,pause(){},destroy(){},capture(){return {dataURL:'data:image/webp;base64,AAAA',width:480,height:270,time:.5,duration:5,phase:10}}};act('motion-capture',{dataset:{id:'${id}'}})`);
  assert.equal(a.run(`s.inquiry.motion.${id}`),1);assert.equal(a.run(`s.inquiry.motionPredictions.${id}`),undefined);assert.equal(a.run(`s.inquiry.motionEvidence.${id}.frame`),motionVideo.videoFrameAt(id,10));assert.equal(a.run(`s.inquiry.motionPhotos.${id}.time`),.5);
  const previous=a.run(`JSON.stringify(s.inquiry.motionPhotos.${id})`);
  a.run(`motionPlayer={ready:false,pause(){},destroy(){},capture(){return null}};act('motion-capture',{dataset:{id:'${id}'}})`);
  assert.equal(a.run(`JSON.stringify(s.inquiry.motionPhotos.${id})`),previous,'a stalled retake preserves the photo');
 }
});

test('completed places enter straight into the mission; the review picker still reaches any earned activity without overwriting works',()=>{
 const a=appHarness();a.run('s=restoreExpedition('+JSON.stringify(JSON.stringify(campaignFixture()))+');enter(5)');
 assert.equal(a.run('screen'),'mission');assert.equal(a.dialog.open,false);
 a.run("act('review-activities',{dataset:{id:'5'}})");
 assert.match(a.dialog.innerHTML,/활동 선택/);assert.match(a.dialog.innerHTML,/내 발명 그리기/);
 const before=a.run('JSON.stringify(s.records)');a.run("act('review-open',{dataset:{id:'5',value:'2'}})");
 assert.equal(a.run('step'),2);assert.equal(a.run('screen'),'mission');assert.equal(a.dialog.open,false);assert.equal(a.run('JSON.stringify(s.records)'),before);
 const fresh=appHarness();fresh.run("enter(1);act('review-open',{dataset:{id:'1',value:'3'}})");assert.equal(fresh.run('step'),0);
});

test('guided invention leads to an empty creative studio, then preserves artwork through the exhibition letter',()=>{
 const a=appHarness();a.run('s=restoreExpedition('+JSON.stringify(JSON.stringify(campaignFixture()))+');stage=5;step=1;screen="mission";advance()');
 assert.equal(a.run('step'),2);assert.equal(a.run('s.studio.strokes.length'),0);assert.match(a.app.innerHTML,/data-studio="drawing"/);
 a.run('advance()');assert.equal(a.run('step'),2);
 a.run('s.studio={...normalizeStudio(null),title:"구름 신발",strokes:[{color:"#294b3e",width:10,points:[{x:10,y:20},{x:40,y:70}]}]};advance()');
 assert.equal(a.run('step'),3);assert.match(a.app.innerHTML,/data-studio="showcase"/);assert.doesNotMatch(a.app.innerHTML,/data-action="lab-summary"/);
 a.run('advance()');assert.equal(a.dialog.open,false);
 a.run('s.studio.audience="산책하는 친구";s.studio.purpose="발을 따뜻하게 감싸 줘";s.studio.inspiration="토끼의 털";advance()');
 assert.equal(a.dialog.open,true);assert.match(a.dialog.innerHTML,/전시/);assert.equal(a.run('s.studioRecord.title'),'구름 신발');
 a.run('act("commission-accept",{dataset:{id:"5"}});submitCommission()');assert.equal(a.run('screen'),'commission');assert.equal(a.run('commissionIndex'),2);
 const restored=model.restoreExpedition(a.saved);assert.equal(restored.studioRecord.title,'구름 신발');assert.ok(campaign.campaignDone(restored,5,0));assert.ok(campaign.campaignDone(restored,5,1));assert.equal(restored.activities.length,24);
});
test('reset keeps the teacher\'s sound settings',()=>{
  const a=appHarness();a.run("s.soundEnabled=false;s.musicOn=false;s.musicVolume=.2;s.activities=['1-0'];act('reset',{dataset:{}})");
  assert.equal(a.run('s.activities.length'),0);assert.equal(a.run('s.soundEnabled'),false);assert.equal(a.run('s.musicOn'),false);assert.equal(a.run('s.musicVolume'),.2);
});

test('request cards move with the deck buttons and a blank reply jumps to the card holding the first blank',()=>{
 const a=appHarness();a.run('s='+JSON.stringify(campaignFixture())+';openCommission(3,0)');
 assert.equal(a.run('requestCard'),0);assert.match(a.app.innerHTML,/data-row="rabbit-place"/);
 a.run("act('request-card',{dataset:{value:'2'}})");assert.equal(a.run('requestCard'),2);assert.match(a.app.innerHTML,/data-row="duck-place"/);
 a.run("act('request-card',{dataset:{value:'9'}})");assert.equal(a.run('requestCard'),2);
 a.run("for(const r of missionRows(s,3,0))chooseCommission(s,3,0,r.key,r.answer);for(const r of missionRows(s,3,1))if(r.key!=='butterfly-life')chooseCommission(s,3,1,r.key,r.answer);requestCard=0;act('commission-submit',{dataset:{}})");
 assert.equal(a.run('screen'),'commission');assert.equal(a.run('requestCard'),3);assert.match(a.app.innerHTML,/data-row="butterfly-life"/);assert.match(a.run('feedback.text'),/나비 · 움직임/);
 assert.match(a.app.innerHTML,/class="record-row[^\"]*\bretry\b[^\"]*" data-row="butterfly-life"/);
});


test('effect volume input persists independently and survives record reset',()=>{
 const a=appHarness(),control={id:'sound-volume',value:'35',nextElementSibling:{textContent:''}};
 a.inputControl(control);
 assert.equal(control.nextElementSibling.textContent,'35%');
 assert.equal(JSON.parse(a.saved).soundVolume,.35);
 assert.equal(JSON.parse(a.saved).musicVolume,.5);
 a.run("act('reset',{dataset:{}})");
 assert.equal(a.run('s.soundVolume'),.35);
});

test('concept clips open only when unlocked, stop the village music, and settings returns to the replay list',()=>{
 const a=appHarness();a.run("act('concept-open',{dataset:{id:'warm-fur',value:'settings'}})");assert.equal(a.dialog.open,false);
 a.run("s.designs[0].problem='warm';s.designs[0].experiment.sourceSeen=true;s.designs[0].experiment.level=2;s.designs[0].experiment.trials=[{problem:'warm',level:1,prediction:'less'},{problem:'warm',level:2,prediction:'less'}];conceptPlayer=null;act('concept-open',{dataset:{id:'warm-fur',value:'settings'}})");
 assert.equal(a.dialog.open,true);assert.match(a.dialog.innerHTML,/concept-player/);assert.match(a.dialog.innerHTML,/털이 몸의 열을 지키는 방법/);assert.match(a.dialog.innerHTML,/concept-back/);
 a.run("act('concept-back',{dataset:{}})");assert.match(a.dialog.innerHTML,/settings-card concept-replays" open/);
 // While a player is open the village theme is asked to stop.
 a.run("conceptPlayer={destroy(){}};syncMusic()");assert.equal(a.music.at(-1),null);a.run("conceptPlayer=null;syncMusic()");assert.equal(a.music.at(-1),'village');
});

test('a wrong observation names what to look at again and is kept as a helped answer across reload',()=>{
 const a=appHarness({three:true});a.run("s.adminUnlocked=true;stage=1;step=2;s.step[1]=2;s.activeAnimal='rabbit';enter(1)");
 a.run("act('observe',{dataset:{id:'rabbit-ear',value:'wrong-0'}})");
 assert.equal(a.run('feedback.text'),'‘귀가 짧고 둥글어’는 그림과 달라. 귀의 길이를 다시 봐!');assert.deepEqual([...a.run('feedback.wrong')],['observe:wrong-0']);
 assert.equal(a.run("s.observeTries['rabbit-ear']"),'helped');assert.equal(a.run('focusIndex'),0);
 a.run("act('observe',{dataset:{id:'rabbit-ear',value:'right'}});act('observe',{dataset:{id:'rabbit-ear',value:'right'}})");
 assert.equal(a.run("s.observeTries['rabbit-ear']"),'helped','tapping again never turns a helped answer into a first try');
 a.run("act('observe',{dataset:{id:'rabbit-fur',value:'right'}})");assert.equal(a.run("s.observeTries['rabbit-fur']"),'first');
 const saved=model.restoreExpedition(a.saved);assert.deepEqual(saved.observeTries,{'rabbit-ear':'helped','rabbit-fur':'first'});
 assert.deepEqual(saved.observed.filter(id=>id.startsWith('rabbit')),['rabbit-ear','rabbit-fur']);
});

test('a fresh learner reaches the certificate with the actions the buttons send; repeated taps never add stars or records',()=>{
 const a=appHarness(),act=(action,dataset={})=>a.run(`act(${JSON.stringify(action)},{dataset:${JSON.stringify(dataset)}})`),stars=()=>a.run('s.activities.length');
 const tapTwice=code=>{a.run(code);a.run(code);};
 const answerRequest=stage=>{for(let pass=0;pass<3;pass++)for(const i of [0,1]){const rows=JSON.parse(a.run(`JSON.stringify(missionRows(s,${stage},${i},campaignDraft(s,${stage},${i})).map(r=>[r.key,r.answer]))`));
   for(const [key,value] of rows)act('commission-choice',{key,value:String(value),commissionIndex:String(i)});}
  if(stage===2)act('commission-choice',{key:'criterion',value:'six',commissionIndex:'1'});};
 const finishRequest=stage=>{act('commission-accept',{id:String(stage)});assert.equal(a.run('screen'),'commission');answerRequest(stage);answerRequest(stage);tapTwice('submitCommission()');
  assert.equal(a.run('screen'),'commission',`request ${stage} leads into its last challenge`);assert.equal(a.run('commissionIndex'),2);
  a.run(`for(const r of missionRows(s,${stage},2,campaignDraft(s,${stage},2)))act('commission-choice',{dataset:{key:r.key,value:String(r.answer),commissionIndex:'2'}});`);
  tapTwice('submitCommission()');
  assert.equal(a.run('screen'),'reward',`request ${stage}`);assert.ok(a.run(`restoredPlaces(s).includes(${stage})`));};
 a.run('s.introSeen=true;enter(1)');
 for(const r of [0,1,2,3]){
  for(const id of model.OBSERVE_PAIRS[r])for(const [i,o] of model.OBSERVATIONS[id].entries()){act('animal-tab',{id});act('inspect',{value:String(i)});act('observe',{id:o.id,value:'right'});}
  tapTwice('advance()');
  for(const q of model.COMPARES[r]){const ref=`${q.key}-${q.answer}`;act('pick',{ref,value:ref});act('place',{dropAction:'compare',key:q.key});}
  a.run('advance()');
 }
 assert.equal(stars(),8);assert.equal(a.dialog.open,true,'the first letter arrives');finishRequest(1);
 a.run('enter(2)');for(const id of model.SORT_ANIMALS){act('pick',{ref:'sort-'+id,id});act('place',{dropAction:'sort',zone:model.ANIMALS[id].wings?'yes':'no'});}
 tapTwice('advance()');act('verify-run');act('verify-cause',{value:'opinion'});act('verify-fix',{value:'wings'});act('verify-recheck');a.run('advance()');
 assert.equal(stars(),10);finishRequest(2);
 a.run('enter(3)');
 for(const r of [0,1]){
  for(const d of model.DISCOVERIES.slice(r*3,r*3+3)){act('habitat',{id:d.habitat});act('discover',{id:d.id});
   assert.doesNotMatch(a.app.innerHTML,new RegExp(d.text.slice(0,12)),'the answer sentence waits for the prediction');
   act('motion-predict',{id:d.animal,value:'part'});assert.match(a.app.innerHTML,new RegExp(d.text.slice(0,12)));
   a.run(`motionPhase=10;motionPlayer={ready:true,viewed:true,pause(){},seek(){},destroy(){},capture(){return {dataURL:'data:image/webp;base64,AAAA',width:480,height:270,time:.5,duration:5,phase:10}}}`);act('motion-capture',{id:d.animal});}
  tapTwice('advance()');
  const id=r?'crab':'frog';for(const [i,key] of ['environment','body','life'].entries()){const v=model.LINKS[id].answer[i];act('pick',{ref:'link-'+v,value:v,kind:key});act('place',{dropAction:'link',key,id});}
  a.run('advance()');
 }
 assert.equal(stars(),14);finishRequest(3);
 a.run('enter(4)');
 for(const r of [0,1,2]){const c=model.CASES[r],g=[['place','cover'],['place','move'],['place','paws']][r];
  for(const id of g){const v=String(c.clues.findIndex(k=>k.id===id));act('clue-open',{value:v});act('clue-spend',{value:v});}
  act('case-animal',{id:c.animal});for(const v of g)act('case-ground',{value:v});tapTwice('advance()');
  act('case-habitat',{value:c.habitat});act('case-reason',{value:c.reason});a.run('advance()');
 }
 assert.equal(stars(),20);finishRequest(4);
 a.run('enter(5)');act('design-problem',{value:'swim'});act('design-choice',{key:'feature',value:'web'});act('source-seen');
 act('pick',{ref:'part-wide',value:'wide'});act('place',{dropAction:'design-part',key:'toe',anchorX:'262',anchorY:'196'});a.input('물살 쌩쌩 오리발');tapTwice('advance()');
 for(const level of ['1','3']){act('experiment-level',{value:level});act('prediction',{value:'more'});act('experiment-run');}
 act('lab-summary');act('reflection',{value:'changed'});a.inputControl({id:'experiment-note',value:'폭을 넓게 바꾸니 물을 더 많이 밀었어.'});act('explain',{value:'match'});a.run('advance()');
 assert.equal(stars(),22);
 a.run('s.studio={...s.studio,title:"날개 우산",strokes:[{color:"#294b3e",width:10,points:[{x:10,y:20},{x:400,y:300}]}]};advance()');
 a.run('s.studio.audience="비 오는 날 걷는 친구";s.studio.purpose="날개처럼 넓게 덮어 줘";s.studio.inspiration="오리 날개";advance()');
 assert.equal(stars(),24);assert.equal(a.dialog.open,true);finishRequest(5);
 const saved=model.restoreExpedition(a.saved);assert.equal(saved.activities.length,24);assert.equal(Object.keys(saved.campaign.records).length,15,'two requests and the last challenge for every place');
 assert.deepEqual(campaign.restoredPlaces(saved),[1,2,3,4,5]);assert.equal(saved.studioRecord.title,'날개 우산');
 act('ending');assert.equal(a.run('screen'),'ending');assert.match(a.app.innerHTML,/동물 탐험대 연구원 인증서/);assert.match(a.app.innerHTML,/24개 탐험 별/);
 act('download');assert.match(a.dialog.innerHTML,/“날개 우산”이야/);assert.match(a.dialog.innerHTML,/가까이 보니 서로 달랐어/);assert.doesNotMatch(a.dialog.innerHTML,/TXT|처음 고른 설명이 맞은 곳 12곳/);
});

test('after a wrong observation the choices stay closed until that part is looked at again; aha facts wait for a prediction',()=>{
 const a=appHarness({three:true});a.run("s.introSeen=true;enter(1);act('inspect',{dataset:{value:'2'}})");
 a.run("act('observe',{dataset:{id:'frog-skin',value:'wrong-0'}})");
 assert.equal(a.run('relook'),'frog-skin');assert.match(a.app.innerHTML,/다시 살펴보면 다시 고를 수 있어/);assert.match(a.app.innerHTML,/data-action="observe"[^>]*disabled/);
 const tries=a.run("JSON.stringify(s.observeTries)");a.run("act('observe',{dataset:{id:'frog-skin',value:'wrong-1'}})");assert.equal(a.run("JSON.stringify(s.observeTries)"),tries,'a second wrong tap while closed changes nothing');
 a.run("act('inspect',{dataset:{value:'1'}})");assert.equal(a.run('relook'),'frog-skin','looking at another part keeps it closed');
 a.run("act('inspect',{dataset:{value:'2'}})");assert.equal(a.run('relook'),null,'looking at the skin again opens the choices');
 a.run("act('observe',{dataset:{id:'frog-skin',value:'right'}})");
 assert.match(a.app.innerHTML,/예상해 봐!/);assert.doesNotMatch(a.app.innerHTML,/피부로도 숨을 쉬어\. 그래서/,'the fact waits for the guess');
 a.run("act('aha-pick',{dataset:{id:'frog-skin',value:'1'}})");
 assert.match(a.app.innerHTML,/예상과 달랐어!/);assert.match(a.app.innerHTML,/피부로도 숨을 쉬어\. 그래서/);
 assert.equal(model.restoreExpedition(a.saved).ahaPicks['frog-skin'],1);
 assert.deepEqual(model.restoreExpedition(JSON.stringify({...JSON.parse(a.saved),ahaPicks:{'frog-skin':5,'nope':0,'frog-eye':0}})).ahaPicks,{},'only known questions and their two options survive');
});

test('auto-run plays only the hands-on steps and stops before the learner answers',()=>{
 const a=appHarness();a.run("s.adminUnlocked=true;enter(4)");assert.match(a.app.innerHTML,/data-action="auto-run"/);
 a.run("act('auto-run',{dataset:{}})");assert.ok(a.run('autoRun'));assert.match(a.app.innerHTML,/aria-pressed="true"[^>]*>.*자동 진행 멈추기|자동 진행 멈추기/);
 for(let i=0;i<40&&a.run('!!autoRun');i++)a.run('autoTick()');
 assert.equal(a.run('autoRun'),null);assert.equal(a.run('s.cases[0].opened.length'),a.run('CASES[0].clues.length'),'every clue is collected');
 assert.ok(!a.run('s.cases[0].candidate'),'the animal guess stays with the learner');assert.equal(a.run('step'),0);assert.equal(a.dialog.open,false);
 assert.match(a.announcer.textContent,/추리해 봐/);
 const b=appHarness();b.run("s.adminUnlocked=true;enter(1);act('auto-run',{dataset:{}})");
 for(let i=0;i<8;i++)b.run('autoTick()');
 assert.equal(b.run('autoRun?.waiting'),true,'stage 1 waits on the shown part instead of skipping past it');assert.equal(b.run('focusIndex'),0);
 assert.equal(b.run('s.observed.length'),0,'descriptions are never chosen for the learner');assert.match(b.announcer.textContent,/맞는 설명을 골라 줘/);
 b.run("const first=OBSERVATIONS[OBSERVE_PAIRS[0][0]][0];act('observe',{dataset:{id:first.id,value:'right'}});if(first.ahaQ)act('aha-pick',{dataset:{id:first.id,value:'0'}})");
 for(let i=0;i<3;i++)b.run('autoTick()');
 assert.equal(b.run('focusIndex'),1,'after the learner answers, it moves on to the next part');assert.equal(b.run('s.observed.length'),1);
 b.run("for(const o of OBSERVE_PAIRS[0].flatMap(id=>OBSERVATIONS[id])){if(!s.observed.includes(o.id))s.observed.push(o.id);if(o.ahaQ)(s.ahaPicks??={})[o.id]=0;}autoTick()");
 assert.equal(b.run('autoRun'),null);assert.match(b.announcer.textContent,/모든 부분을 기록했어/);
 b.run('step=1;render()');assert.doesNotMatch(b.app.innerHTML,/data-action="auto-run"/,'question steps have no auto-run');
});
