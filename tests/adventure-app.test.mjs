import * as researchReport from '../src/research-report.js';
import * as studioModel from '../src/studio.js';
import * as studioRuntime from '../src/studio-runtime.js';
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
import * as conceptVideo from '../src/concept-video.js';
import * as concepts from '../src/concepts.js';

const source=readFileSync(new URL('../src/adventure-app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
function appHarness({fail=false,motion=false,three=false}={}){
  let stored=null,warning=null,writeFailure=fail,exported=null;const music=[];
  const listeners=new Map(),heading={textContent:''},status={textContent:''},announcer={textContent:''},link={href:''},quest={innerHTML:'',inert:true},travel={textContent:''};
  const app={_html:'',get innerHTML(){return this._html;},set innerHTML(v){this._html=v;warning=null;},querySelectorAll(){return [];},insertAdjacentHTML(_,text){warning={text,remove(){warning=null;}};}};
  const dialog={open:false,innerHTML:'',showModal(){this.open=true;},close(){this.open=false;},addEventListener(){}};
  const slider={id:'motion-phase',value:0},motionParts={'.motion-model':{outerHTML:''},'.motion-caption':{textContent:''},'[data-action="motion-play"]':{textContent:''},'#motion-phase':slider};
  const motionHost={dataset:{motion:'rabbit'},querySelector:s=>motionParts[s],querySelectorAll:()=>[]};
  const document={activeElement:null,addEventListener(n,fn){listeners.set(n,fn);},querySelectorAll(){return [];},querySelector(selector){if(selector==='.motion-observer')return motion?motionHost:null;return {'#app':app,'#dialog':dialog,'.save-label':status,'#main':{focus(){}},'#announcer':announcer,'#design-title':heading,'#report-download':link,'#trail-world':{},'#quest-panel':quest,'#travel-text':travel}[selector]||(selector==='#storage-warning'?warning:null);}};
  const context=vm.createContext({...studioModel,...studioRuntime,...researchReport,...storyPlayer,...motionVideo,...campaign,...inquiry,...inquiryViews,...model,...presentation,...shell,...drag,...conceptVideo,...concepts,createNavigation,document,Blob,createTrailMap(){return {destroy(){},move(){}};},createVillage(){return {destroy(){},move(){}};},can3d(){return three;},disable3d(){},mount3d(){return {attach(){},call(){},destroy(){}};},playSound(){},silence(){},playMusic(key){music.push(key);},setMusicVolume(){},setSoundVolume(){},window:{scrollTo(){}},URL:{createObjectURL(b){exported=b;return 'blob:test';},revokeObjectURL(){}},localStorage:{getItem(){return stored;},setItem(_,v){if(writeFailure)throw new Error('quota');stored=v;}}});
  const run=code=>vm.runInContext(code,context);run(source);
  return {run,app,dialog,music,status,announcer,slider,inputControl(target){listeners.get('input')({target});},get warning(){return warning;},get saved(){return stored;},get exported(){return exported;},setFail(v){writeFailure=v;},input(value){listeners.get('input')({target:{id:'invention-name',value}});}};
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
  assert.match(a.app.innerHTML,/낙타가 넓적한 발바닥/);assert.match(a.app.innerHTML,/data-motion="camel"/);assert.doesNotMatch(a.app.innerHTML,/data-motion="rabbit"/);
  a.run("act('habitat',{dataset:{id:'cold'}})");assert.equal(a.run('activeHabitat'),'cold');a.run("opts3d('dome').onLook('cold')");assert.match(a.app.innerHTML,/data-motion="penguin"/);assert.match(a.app.innerHTML,/추가 관찰/);
  const flat=appHarness();flat.run("s.adminUnlocked=true;enter(3);act('habitat',{dataset:{id:'cold'}})");assert.equal(flat.run('activeHabitat'),'forest','without 3D the extra zones are not selectable');
});

test('exploration delivers a dismissible letter and one reply atomically restores both records',()=>{
 const a=appHarness();a.run('s='+JSON.stringify(campaignFixture())+';stage=1;step=3;screen="mission";advance()');assert.equal(a.run('screen'),'mission');assert.equal(a.dialog.open,true);assert.match(a.dialog.innerHTML,/편지가 도착했어/);
 a.run("act('close-dialog',{dataset:{}})");assert.equal(a.dialog.open,false);assert.equal(a.run('screen'),'mission');
 a.run("act('commission-open',{dataset:{id:'1'}});act('commission-accept',{dataset:{id:'1'}})");assert.equal(a.run('screen'),'commission');assert.equal(a.dialog.open,false);
 for(const [key,value]of Object.entries({'frog-label':'bare','frog-proof':'skin','crab-label':'claw','crab-proof':'legs'}))a.run(`act('commission-choice',{dataset:${JSON.stringify({key,value,commissionIndex:'0'})}})`);
 a.run("act('commission-submit',{dataset:{}})");assert.equal(a.run('screen'),'commission');assert.equal(a.run('campaignDone(s,1,0)'),false);
 for(const [key,value]of Object.entries({duck:'feather',rabbit:'fur',same:'legs'}))a.run(`act('commission-choice',{dataset:${JSON.stringify({key,value,commissionIndex:'1'})}})`);
 a.run("act('commission-submit',{dataset:{}})");assert.equal(a.run('screen'),'reward');assert.deepEqual([...a.run('restoredPlaces(s)')],[1]);assert.equal(a.run('s.activities.length'),18);assert.match(a.app.innerHTML,/연구원 소라의 답장/);
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
 a.run('act("commission-accept",{dataset:{id:"5"}});submitCommission()');assert.equal(a.run('screen'),'reward');
 const restored=model.restoreExpedition(a.saved);assert.equal(restored.studioRecord.title,'구름 신발');assert.ok(campaign.campaignDone(restored,5,0));assert.ok(campaign.campaignDone(restored,5,1));assert.equal(restored.activities.length,18);
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
 assert.match(a.app.innerHTML,/record-row\s+retry" data-row="butterfly-life"|retry" data-row="butterfly-life"/);
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
