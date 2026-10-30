import {researchDiaryView} from './research-report.js';
import {createRecordStorage,storageMessage} from './record-storage.js';
import {mountFlashlight,clueFoundView,flashlightGuessView} from './flashlight.js';
import {normalizeStudio} from './studio.js';
import {mountStudio,downloadStudioArtwork} from './studio-runtime.js';
import {createMotionPlayer,videoFrameAt,toggleMotionFullscreen} from './motion-video.js';
import {createStoryPlayer} from './story-player.js';
import {conceptView,createConceptPlayer} from './concept-video.js';
import {replayItem,replayUnlocked} from './concepts.js';
import {normalizeExperiment,normalizeMotionPhoto,addExperimentTrial,comparisonReady,EXPERIMENTS,frameAt,MOTIONS,MOTION_KEY_FRAME} from './inquiry.js';
import {motionView,motionGuide,motionDiagram,motionCaption,experimentDiagram,anatomy} from './inquiry-views.js';
import {STAGES,ANIMALS,DOME_ZONES,SORT_ANIMALS,CRITERIA,OWN_CRITERIA,OBSERVABLE,OBSERVATIONS,OBSERVE_PAIRS,COMPARES,SCAN_3D,HABITATS,DISCOVERIES,CASES,CLUE_ENERGY,FEATURES,STRUCTURES,PROBLEMS,PRODUCTS,STORAGE_KEY,freshExpedition,restoreExpedition,isStageOpen,countStage,claimTask,taskHint,taskMistake,recordTrial,reportDesigns,selectDesignProblem,motionOpen,domeCaption} from './expedition.js';
import {art,mori,icon,btn,esc,withParticle,toolArt} from './presentation.js';
import {header,page,questPanel,mapTip,settingsContent,notebookContent,toolContent,commissionLetter,investigationNext} from './shell-views.js';
import {createVillage} from './village.js';
import {createNavigation} from './navigation.js';
import {playSound,silence,playMusic,setMusicVolume,setSoundVolume} from './audio.js';
import {enableDrag,dropData} from './drag.js';
import {can3d,mount3d,disable3d,warm3d} from './view3d.js';
import {COMMISSIONS,ensureCampaign,campaignDraft,campaignDone,campaignOpen,chooseCommission,claimCommission,claimRequest,campaignHint,runCommissionTrial,restoredPlaces,campaignReport,requestParts,requestCards,requestGap,firstOpenCard} from './campaign.js';

const app=document.querySelector('#app'),dialog=document.querySelector('#dialog'),navigation=createNavigation();
const recordStore=createRecordStorage({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
const loadedRecord=recordStore.read();
let s=loadedRecord.state||freshExpedition(),storageOK=['ok','empty'].includes(loadedRecord.status);
ensureCampaign(s);
// Teacher previews use a separate in-memory copy of the student's records.
let studentSnapshot=null,mapWalkVersion=0;
// relook: an observation id whose choices stay closed after a wrong pick until that part is looked at again.
let relook=null,commissionIndex=0,requestCard=null,caseHint=false,evidenceOpen=false,motionPlayer=null,storyPlayer=null,conceptPlayer=null;
const failedMotionVideos=new Set();
let screen='home',stage=s.stage,step=s.step[stage]||0,selectedStage=stage,feedback=null,map=null,arrived=true,activeHabitat='forest',zoom=false,labSummary=false,focusIndex=0,clueIndex=0,motionPhase=0,motionPlaying=false,motionSlow=false,motionRAF=null,motionTime=0,lensPointer=null,sketching=false,stroke=null,report=null,restoredFlash=null,picked=null,viewer=null,tilt=false,questOpen=false,autoEnter=false;
let mapOverview=restoredPlaces(s).length===STAGES.length;
// Parts pinned on the 3D specimen this visit (not saved: a found part stays pinned through s.observed).
const pinned=new Set(),looked=new Set();
const round=()=>Math.floor(step/2);
const view=()=>({relook,screen,stage,step,commissionIndex,requestCard,caseHint,evidenceOpen,selectedStage,arrived,activeHabitat,zoom,labSummary,focusIndex,clueIndex,motionPhase,motionPlaying,motionSlow,failedMotionVideos:[...failedMotionVideos],sketching,report,feedback,restoredFlash,picked,questOpen,mapOverview,use3d:can3d(),pinned:[...pinned],looked:[...looked],tilt,tiltable:typeof DeviceOrientationEvent!=='undefined',canGoBack:navigation.canGoBack});
function save(){
  s.stage=stage;s.step[stage]=step;
  if(studentSnapshot){const status=document.querySelector('.save-label');if(status)status.textContent='교사용 미리보기 · 학생 기록 보존 중';return;}
  storageOK=recordStore.write(s);
  const status=document.querySelector('.save-label');if(status)status.textContent=storageOK?'이 기기 브라우저에 저장됨':'저장 공간 확인';
  const warning=document.querySelector('#storage-warning');
  if(!storageOK){warning?.remove();app.insertAdjacentHTML('afterbegin','<div id="storage-warning" role="alert"><span>'+esc(storageMessage(recordStore.status))+'</span></div>');}
  if(storageOK)warning?.remove();
}
// Keep long sets of records on named, persistent pages instead of stacking them.
const panelPages=new Map();
const panelKey=(selector,group=0)=>[screen,stage,step,commissionIndex,selector,group].join(':');
function setupPanels(){
  const tabs=(selector,childSelector,labels)=>{
    app.querySelectorAll(selector).forEach((host,group)=>{
      const panels=[...host.querySelectorAll(childSelector)];if(panels.length<2)return;
      const key=panelKey(selector,group);
      // The gallery opens on the room of the place the learner just finished, not always room 1.
      let current=Math.min(panelPages.get(key)??(selector==='.museum-exhibits'?Math.max(0,stage-1):0),panels.length-1);
      const nav=document.createElement('nav');nav.className='panel-tabs';nav.setAttribute('aria-label','내용 선택');
      panels.forEach((panel,i)=>{const button=document.createElement('button');button.type='button';button.className='btn quiet';const num=document.createElement('span');num.className='tab-num';num.textContent=String(i+1);button.append(num,labels?.[i]||panel.querySelector('h2,h3,b,legend')?.textContent||`${i+1}번 기록`);button.addEventListener('click',()=>{current=i;panelPages.set(key,i);update();if(selector==='.museum-exhibits')host.scrollTop=0;});nav.append(button);});
      // Steps read as a sequence: finished panels get a check, and once the open one is finished the next tab says "다음".
      const finished=p=>p.classList.contains('done')||(()=>{const groups=[...p.querySelectorAll('.choices,.problem-options,.design-choices')],name=p.querySelector('#invention-name');return groups.length>0&&groups.every(g=>g.querySelector('.selected'))&&(!name||!!name.value.trim());})();
      function update(){const done=panels.map(finished),next=done[current]?done.findIndex((d,i)=>i>current&&!d):-1;panels.forEach((p,i)=>{p.hidden=i!==current;nav.children[i].setAttribute('aria-pressed',String(i===current));nav.children[i].classList.toggle('tab-done',done[i]);nav.children[i].classList.toggle('tab-next',i===next);});
        if(selector==='.case-activity'&&stage===4&&step%2===0){
          const a=s.cases[round()],next=investigationNext(a,current===1),button=app.querySelector?.('.mission-footer > .primary'),hint=app.querySelector?.('.investigation-next');
          if(button){button.innerHTML=esc(next.label)+' '+icon('arrow');button.dataset.action=next.action;button.classList.toggle('action-cue',!!a.candidate&&!next.why);if(next.why){button.setAttribute('aria-disabled','true');button.dataset.why=next.why;}else{button.removeAttribute('aria-disabled');delete button.dataset.why;}}
          if(hint)hint.innerHTML=icon('arrow')+' '+esc(next.hint);
        }
      }
      if(selector==='.design-options')host.addEventListener('input',update);
      host.prepend(nav);host.classList.add('paged-panel');update();
    });
  };
  tabs('.museum-exhibits',':scope > .museum-exhibit');
  tabs('.final-inventions',':scope > article');
  tabs('.case-activity',':scope > section',step%2?['사는 곳','움직이는 방법']:['동물 선택','근거 연결']);
  tabs('.verify-steps',':scope > .verify-step',['검증','이유 찾기','기준 고치기']);
  tabs('.design-options',':scope > section',['문제·이름 정하기','특징 관찰','부품 붙이기']);
  // A compact viewport switches the two complete lab panels without losing any inputs.
  if(typeof matchMedia==='function'&&matchMedia('(max-height: 600px), (max-width: 700px)').matches){
    tabs('.experiment-lab',':scope > section',['모양 시험','결과 비교']);
    tabs('.lab-summary',':scope > section',['결과 비교','내 생각']);
  }
}
let renderedRoute='',unmountStudio=null,unmountFlashlight=null;
// One village theme everywhere; it keeps quiet while a story or concept video is open (the outro carries its own finale music).
function syncMusic(){setSoundVolume(s.soundVolume??.8);setMusicVolume(s.musicVolume);playMusic(s.musicOn===false||screen==='intro'||screen==='outro'||conceptPlayer?null:'village');}
function render(){
  unmountFlashlight?.();unmountFlashlight=null;
  unmountStudio?.();unmountStudio=null;
  if(screen==='mission'&&stage===5&&step>=2&&!s.studio)s.studio=normalizeStudio(null);
  // A request opens on its first unfinished card and then stays where the learner moves it.
  if(screen==='commission'&&requestCard===null)requestCard=firstOpenCard(s,stage,requestParts(stage,commissionIndex));
  const route=[screen,stage,step,activeHabitat,s.activeAnimal,screen==='commission'?requestCard:''].join(':');
  const scroll=route===renderedRoute?[...app.querySelectorAll('.request-part,.motion-observer,.lens-notes')].map(el=>el.scrollTop):[];
  const expanded=route===renderedRoute?[...app.querySelectorAll('.commission-evidence')].map(el=>el.open):[];
  const notePages=route===renderedRoute?[...app.querySelectorAll('.note-book')].map(el=>[...el.querySelectorAll('.note-page')].findIndex(p=>p.classList.contains('on'))):[];
  renderedRoute=route;
  syncMusic();
  storyPlayer?.destroy();storyPlayer=null;
  stopMotionFrame();
  motionPlayer?.destroy();motionPlayer=null;
  navigation.visit({screen,stage:['mission','reward','commission'].includes(screen)?stage:null,step:screen==='mission'?step:null,commissionIndex:screen==='commission'?commissionIndex:null});
  const active=document.activeElement,data=active?.dataset?.action?{...active.dataset}:null;
  map?.destroy();map=null;
  if(screen==='map')arrived=!isStageOpen(s,selectedStage)||s.mapPosition===String(selectedStage);
  const flashed=restoredFlash;app.innerHTML=header(s,view())+page(s,view());restoredFlash=null;
  setupPanels();
  unmountFlashlight=mountFlashlight(app.querySelector?.('[data-flashlight]'),{onSelect(index){act('flashlight-clue',{dataset:{value:String(index)}});}});
  if(app.querySelector?.('[data-studio]'))unmountStudio=mountStudio(app,{getStudio:()=>s.studio,onChange:next=>{s.studio=next;save();}});
  app.querySelectorAll('.request-part,.motion-observer,.lens-notes').forEach((el,i)=>{if(scroll[i]!==undefined)el.scrollTop=scroll[i];});
  app.querySelectorAll('.commission-evidence').forEach((el,i)=>{if(expanded[i]!==undefined)el.open=expanded[i];});
  app.querySelectorAll('.note-book').forEach((el,i)=>{if(notePages[i]>0)turnNotePage(el,notePages[i],false);});
  const storyHost=app.querySelector?.('[data-story]');
  if(storyHost)storyPlayer=createStoryPlayer(storyHost,{onEnd:finishStory,volume:s.musicOn!==false?s.musicVolume??.5:0});
  // Every close-up photo opens large on tap (all animals, every screen that shows one).
  app.querySelectorAll?.('.detail-crop').forEach(el=>{el.dataset.action='photo-zoom';el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label','사진 크게 보기');});
  sync3d();
  mountMotionPlayer();
  if(!motionPlayer&&motionPlaying&&screen==='mission'&&stage===3&&step%2===0)startMotionFrame();
  if(screen==='map')map=createVillage(document.querySelector('#trail-world'),{position:s.mapPosition,completed:restoredPlaces(s),flash:flashed,overview:mapOverview,isBlocked:()=>dialog.open||questOpen,onWalk(){mapWalkVersion++;autoEnter=false;arrived=false;const tip=document.querySelector('#travel-text');if(tip)tip.textContent=mapTip(s);},onInteract(id){if(id==='gallery')go('gallery');else selectMap(Number(id));},onError(){const tip=document.querySelector('#travel-text');if(tip){tip.classList.add('is-error');tip.innerHTML='지도를 불러오지 못했어. 기록은 그대로야. '+btn('다시 불러오기','retry-images','quiet');}},onTalk:talk,onStep:()=>playSound(s.soundEnabled,'step'),onArrive(id){
    if(screen!=='map'||selectedStage!==id)return;arrived=true;s.mapPosition=String(id);
    document.querySelector('#quest-panel').innerHTML=questPanel(s,view());document.querySelector('#travel-text').textContent=`모리: ${STAGES[id-1].name}에 도착했어. 함께 탐험하자!`;
    // A building the learner picked opens as soon as Haru reaches its door; the walk after a restore only arrives.
    if(autoEnter&&isStageOpen(s,id)){autoEnter=false;save();enter(id);return;}save();
  }});
  // Right after a restore, stay by the building until it has lit up, then head to the next place.
  if(screen==='map'&&!mapOverview&&!arrived&&flashed){const m=map,intent=mapWalkVersion,destination=selectedStage;if(typeof setTimeout==='function')setTimeout(()=>{if(map===m&&mapWalkVersion===intent&&selectedStage===destination)m.move(destination);},2400);}
  if(data)[...app.querySelectorAll('[data-action]')].find(el=>Object.entries(data).every(([k,v])=>el.dataset[k]===v))?.focus({preventScroll:true});
  placeFeedback();
  save();
}
// A wrong or blocked answer shows its reason beside the marked choice at once (progress chips and the checklist only keep their outline); Mori's bubble keeps the same words as extra help.
// With nothing to mark (an unfinished step), Mori's bubble opens by itself instead of waiting for a tap.
// A bubble that opened by itself sits between Mori and the next button; keep it short of that button (also after a rotation).
function fitBubble(){
  const p=app.querySelector?.('#main .auto>p'),next=app.querySelector?.('#main :is(.mission-footer,.commission-footer)>.primary');if(!p||!next)return;
  p.style.maxWidth='';const room=next.getBoundingClientRect().left-p.parentElement.getBoundingClientRect().right-24;if(room>160)p.style.maxWidth=room+'px';
}
function placeFeedback(){
  const main=app.querySelector?.('#main');if(!main||!feedback||feedback.good||(screen!=='mission'&&screen!=='commission'))return;
  const target=main.querySelector('.retry:not(.deck-chip):not(.design-checklist>li)');
  if(!target){main.querySelector('.guide-buddy,.commission-feedback')?.classList.add('open','auto');fitBubble();return;}
  const hidden=target.closest('[hidden]');if(hidden){const host=hidden.parentElement;host.querySelector(':scope>.panel-tabs')?.children[[...host.children].filter(c=>!c.matches('.panel-tabs')).indexOf(hidden)]?.click();}
  const note=document.createElement('p');note.className='retry-note';note.textContent=feedback.text;
  if(target.matches('textarea,input,select'))target.after(note);else if(target.matches('button'))target.parentElement.after(note);else target.append(note);
  note.scrollIntoView?.({block:'nearest'});
}
// The 3D viewer outlives re-renders: its canvas moves into the new host, so the camera stays where the learner left it.
function sync3d(){
  const host=app.querySelector?.('[data-3d]'),kind=host?.dataset['3d'];
  if(!host){viewer?.destroy();viewer=null;return;}
  if(viewer?.kind===kind)viewer.attach(host,opts3d(kind));else{viewer?.destroy();viewer=mount3d(kind,host,opts3d(kind));}
}
function fail3d(){disable3d();viewer?.destroy();viewer=null;render();document.querySelector('#announcer').textContent='3D 화면을 열 수 없어서 그림 화면으로 바꿨어.';}
const tapAnchor=pt=>({getBoundingClientRect:()=>({left:pt.x,top:pt.y,width:0,height:0})});
function opts3d(kind){
  if(kind==='scanner'){const pair=OBSERVE_PAIRS[round()],id=pair.includes(s.activeAnimal)?s.activeAnimal:pair[0],list=OBSERVATIONS[id],idx=f=>list.flatMap((o,i)=>f(o)?[i]:[]);
    return {animal:id,parts:list.map(o=>o.label),found:idx(o=>s.observed.includes(o.id)),pinned:idx(o=>pinned.has(o.id)),focus:focusIndex,onFail:fail3d,
      onPick(i){focusIndex=i;pinned.add(list[i].id);if(list[i].id===relook)relook=null;feedback=null;playSound(s.soundEnabled);render();document.querySelector('#announcer').textContent=`${list[i].label}에 관찰핀을 꽂았어.`;},
      onMiss(hint,pt){playSound(s.soundEnabled,'retry');toast(hint,tapAnchor(pt));}};}
  if(kind==='dome'){const list=DISCOVERIES.slice(round()*3,round()*3+3);
    return {zones:[...Object.keys(HABITATS),...Object.keys(DOME_ZONES)],names:Object.fromEntries([...Object.entries(HABITATS),...Object.entries(DOME_ZONES)].map(([id,h])=>[id,h.name])),active:DOME_ZONES[activeHabitat]?activeHabitat:(list.find(d=>d.habitat===activeHabitat)||list[0]).habitat,onFail:fail3d,
      extras:Object.entries(DOME_ZONES).map(([zone,z])=>({id:zone,animal:z.animal,habitat:zone,name:z.animalName,found:looked.has(zone)})),
      onLook(zone){if(!DOME_ZONES[zone])return;stopMotion();looked.add(zone);activeHabitat=zone;feedback=null;playSound(s.soundEnabled);render();document.querySelector('#announcer').textContent=domeCaption(s,DOME_ZONES[zone]);},
      targets:list.map(d=>({id:d.id,animal:d.animal,habitat:d.habitat,name:ANIMALS[d.animal].name,found:s.discovered.includes(d.id)})),
      onFind(id){const d=DISCOVERIES.find(x=>x.id===id);if(!d)return;stopMotion();activeHabitat=d.habitat;playSound(s.soundEnabled,s.discovered.includes(id)?undefined:'correct');act('discover',{dataset:{id}});document.querySelector('#announcer').textContent=`${withParticle(ANIMALS[d.animal].name)} 찾았어! 움직임을 살펴봐.`;}};}
  return {onFail:fail3d};
}
// Optional tilt (screen 06): iOS asks permission inside the tap; no permission or no sensor leaves drag only.
function toggleTilt(el){
  if(tilt){tilt=false;viewer?.call('tilt',false);render();return;}
  const off=text=>{tilt=false;viewer?.call('tilt',false);render();toast(text,el);};
  const ask=window.DeviceOrientationEvent?.requestPermission;
  Promise.resolve(ask?ask.call(DeviceOrientationEvent):'granted').then(r=>{
    if(r!=='granted')return off('기울이기를 허락하지 않았어. 손가락으로 밀어서 둘러보면 돼.');
    tilt=true;viewer?.call('tilt',true,()=>off('이 기기는 기울이기를 쓸 수 없어. 손가락으로 밀어서 둘러보면 돼.'));render();
  }).catch(()=>off('기울이기를 쓸 수 없어. 손가락으로 밀어서 둘러보면 돼.'));
}
// FLIP: cards glide from their old group to the new one, so a changed criterion visibly regroups the same animals.
function groupRects(){return new Map([...document.querySelectorAll('.group-animal[data-id]')].map(el=>[el.dataset.id,el.getBoundingClientRect()]));}
function flipGroups(before){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('.group-animal[data-id]').forEach(el=>{const a=before.get(el.dataset.id),b=el.getBoundingClientRect();if(!a)return;const dx=a.left-b.left,dy=a.top-b.top;if(Math.abs(dx)+Math.abs(dy)<2)return;const moved=el.classList.contains('moved');
    el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:`translate(${dx/2}px,${dy/2-(moved?46:0)}px) scale(${moved?1.15:1})`,offset:.5},{transform:'none'}],{duration:moved?950:600,delay:moved?200:0,easing:'cubic-bezier(.3,.7,.2,1)',fill:'backwards'});});
}
function go(where){if(dialog.open)dialog.close();requestCard=null;caseHint=false;labSummary=false;autoEnter=false;picked=null;stopMotion();screen=where;if(where==='map'){mapOverview=restoredPlaces(s).length===STAGES.length;questOpen=false;}feedback=null;report=null;stroke=null;render();document.querySelector('#announcer').textContent='';document.querySelector('#main')?.classList?.add('screen-enter');document.querySelector('#main')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
// One sound per placement: a rejected card already plays 'retry' through say(), so 'drop' is only for accepted ones.
let retried=false;
function dropCard(action,dataset){picked=null;retried=false;act(action,{dataset});if(!retried)playSound(s.soundEnabled,'drop');}
function say(text,good=false,wrong=[]){if(!good){retried=true;playSound(s.soundEnabled,'retry');}feedback={text,good,wrong};render();document.querySelector('#announcer').textContent=text;}
function modal(title,content){conceptPlayer?.destroy();conceptPlayer=null;stopMotion();map?.pause?.();dialog.innerHTML=`<header class="dialog-heading"><h2 id="dialog-title">${title}</h2>${btn(icon('close'),'close-dialog','icon-btn quiet','aria-label="닫기"')}</header>${content}`;if(!dialog.open)dialog.showModal();dialog.querySelector?.('[autofocus]')?.focus();}
function start(){
  if(s.introSeen){go('map');return;}
  openStory('intro');
}
function storyFullscreen(){
  if(document.fullscreenElement===app){document.exitFullscreen?.()?.catch(()=>{});return;}
  app.requestFullscreen?.()?.catch(()=>{/* The viewport-sized player remains usable when browser fullscreen is unavailable. */});
}
function openStory(kind){dialog.close();silence();go(kind);if(!document.fullscreenElement)storyFullscreen();}
function finishStory(){
  if(!['intro','outro'].includes(screen))return;
  const target=screen==='intro'?'map':'gallery';
  if(screen==='intro')s.introSeen=true;
  if(document.fullscreenElement===app)document.exitFullscreen?.()?.catch(()=>{});
  go(target);
}
// Village NPCs (and Mori) speak in a bubble above them and in the tip line.
function talk(npc,text,el){const next=STAGES.find(t=>!restoredPlaces(s).includes(t.id)&&isStageOpen(s,t.id));const line=text||(next?`다음은 ${withParticle(next.name,'이야/야')}. 복구하면 ${withParticle(next.reward,'을/를')} 받아! 건물이나 길을 누르면 같이 걸어갈게.`:'다섯 기록을 모두 되찾았어. 캠프로 돌아가자!');const tip=document.querySelector('#travel-text');if(tip)tip.textContent=`${npc.name}: ${line}`;playSound(s.soundEnabled,'talk');toast(line,el,npc.name);}
// 3D screens start downloading while Haru walks to the door, so the scanner and dome open sooner.
function warmStage(id){const r=Math.floor((s.step[id]||0)/2);
  if(id===1)warm3d('scanner',(OBSERVE_PAIRS[r]||[]).filter(a=>SCAN_3D.includes(a)));
  if(id===3)warm3d('dome',[...DISCOVERIES.slice(r*3,r*3+3).map(d=>d.animal),...Object.values(DOME_ZONES).map(z=>z.animal)]);}
function selectMap(id){
  if(screen==='map'&&mapOverview&&Number.isInteger(id)&&STAGES[id-1]){mapOverview=false;render();}
  if(!Number.isInteger(id)||!STAGES[id-1]||screen!=='map')return;mapWalkVersion++;map?.stop?.();autoEnter=false;selectedStage=id;arrived=false;
  document.querySelectorAll('.map-marker[data-action="map-select"]').forEach(el=>{el.classList.toggle('current',Number(el.dataset.id)===id);el.setAttribute('aria-pressed',String(Number(el.dataset.id)===id));});
  document.querySelector('#quest-panel').innerHTML=questPanel(s,view());
  if(isStageOpen(s,id)){setQuestOpen(false);autoEnter=true;warmStage(id);document.querySelector('#travel-text').textContent=`모리: ${withParticle(STAGES[id-1].name,'으로/로')} 가는 중이야. 문 앞에 닿으면 들어가자!`;map.move(id);}
  else{document.querySelector('#travel-text').textContent=mapTip(s);explainLocked(id);}
}
function explainLocked(id){
  const next=STAGES.find(t=>!restoredPlaces(s).includes(t.id)&&isStageOpen(s,t.id))||STAGES[id-2];
  modal('아직 들어갈 수 없어요 · '+STAGES[id-1].name,`<div class="map-lock-guide">${mori(2)}<div><h3>먼저 ${withParticle(next.name)} 복구해 줘!</h3><p>탐구 활동과 주민의 부탁을 마치면 다음 장소가 열려.</p></div></div><div class="dialog-actions">${btn('지도 둘러보기','close-dialog','quiet')}${btn(withParticle(next.name,'으로/로')+' 가기','locked-next','primary',`data-id="${next.id}"`)}</div>`);
}
function setQuestOpen(open){questOpen=open;const page=document.querySelector('.map-page'),panel=document.querySelector('#quest-panel');page?.classList?.toggle('quest-open',open);if(panel)panel.inert=!open;document.querySelectorAll('[data-action="quest-toggle"]').forEach(el=>el.setAttribute('aria-expanded',String(open)));if(open){autoEnter=false;map?.pause?.();panel?.querySelector?.('button')?.focus({preventScroll:true});}else map?.resume?.();document.querySelector('.map-scene')?.scrollTo?.({left:0,top:0});}
function enter(id,replay=false){
  if(!isStageOpen(s,id)){if(screen==='map'&&STAGES[id-1])explainLocked(id);return;}playSound(s.soundEnabled,'door');stage=id;step=s.step[id]??Math.min(STAGES[id-1].tasks.length-1,countStage(s,id));
  if(replay)step=0;
  if(step>0&&!s.activities.includes(`${id}-${step-1}`))step=Math.min(STAGES[id-1].tasks.length-1,countStage(s,id));
  selectedStage=id;activeHabitat='forest';zoom=false;focusIndex=0;clueIndex=0;sketching=false;if(stage===5&&step<2){const d=s.designs[0];if(!d.problem)d.problem='swim';}go('mission');
}
function reviewActivities(id){
  if(!isStageOpen(s,id))return;const t=STAGES[id-1];
  modal(t.name+' · 활동 선택',`<p>해 보고 싶은 활동을 골라. 보관한 기록과 받은 별은 그대로야.</p><div class="review-activities">${t.tasks.map((title,index)=>{
    const earned=s.activities.includes(`${id}-${index}`),open=index===0||s.activities.includes(`${id}-${index-1}`);
    return btn(`${earned?'✓ ':''}${index+1}. ${title}`,'review-open','secondary',`data-id="${id}" data-value="${index}" ${open?'':'disabled'}`);
  }).join('')}</div>${s.completed.includes(id)?`<div class="dialog-actions">${btn('주민 의뢰 보기','commission-open','primary',`data-id="${id}" data-value="0"`)}</div>`:''}`);
}
function reviewOpen(id,index){
  if(!isStageOpen(s,id)||!STAGES[id-1]?.tasks[index]||(index>0&&!s.activities.includes(`${id}-${index-1}`)))return;
  dialog.close();stage=id;step=index;selectedStage=id;focusIndex=0;clueIndex=0;zoom=false;sketching=false;activeHabitat='forest';go('mission');
}
function advance(){
  stopMotion();
  const result=claimTask(s,stage,step);if(!result.ok){const m=isStageOpen(s,stage)?taskMistake(s,stage,step):null;if(stage===4&&step%2===0&&m?.wrong?.some(k=>k.startsWith('case:')))panelPages.set(panelKey('.case-activity'),m.wrong.includes('case:candidate')?0:1);return say(m?.text||taskHint(stage,step),false,m?.wrong);}
  playSound(s.soundEnabled,true);
  if(step===STAGES[stage-1].tasks.length-1){save();render();requestCommission(stage);return;}
  const pairDone=stage===1&&step%2===1&&result.fresh?Math.floor(step/2):-1;
  labSummary=false;step++;s.step[stage]=step;focusIndex=0;clueIndex=0;feedback=null;
  report=null;zoom=false;sketching=false;activeHabitat='forest';render();window.scrollTo({top:0,behavior:'instant'});document.querySelector('#main')?.focus({preventScroll:true});document.querySelector('#announcer').textContent=result.fresh?'별 하나 받았어! 다음 탐구로 이어가자!':'다음 탐구로 이어가자!';if(result.fresh)flyStar();
  if(pairDone>=0)globalThis.setTimeout?.(()=>{if(screen==='mission'&&stage===1&&!dialog.open)pairReward(pairDone);},1300);
}
// 1장: after each pair comparison, the discovery in one line, where the learner is, and a safe place to stop.
function pairReward(r){const [a,b]=OBSERVE_PAIRS[r],[same,diff]=COMPARES[r].map(q=>q.options.find(o=>o[0]===q.answer)[1]),seen=OBSERVE_PAIRS.flat().flatMap(id=>OBSERVATIONS[id]).filter(o=>s.observed.includes(o.id)).length;
  modal('발견 카드 · '+withParticle(ANIMALS[a].name,'과/와')+' '+ANIMALS[b].name,`<div class="pair-reward"><p class="pair-found">${icon('star')}<span><b>같은 점</b> ${same}<br><b>다른 점</b> ${diff}</span></p><p class="pair-progress">1장 진도 · 비교 ${r+1}/4 · 특징 관찰 ${seen}/24</p><p>여기서 쉬어 가도 돼. 지금까지 기록은 저장됐어.</p></div><div class="dialog-actions">${btn('지도에서 쉬기','map','quiet')}${btn('다음 동물 관찰하기 '+icon('arrow'),'close-dialog','primary','autofocus')}</div>`);}
// A new star pops in the middle of the screen, then flies into the activity title, which shows "+1 ★" for a moment.
function flyStar(){
  if(typeof document.createElement!=='function')return;
  const chip=document.querySelector('.mission-guide h1'),target=chip?.getBoundingClientRect(),still=matchMedia('(prefers-reduced-motion: reduce)').matches,el=document.createElement('div');el.className='star-fly';el.setAttribute('aria-hidden','true');el.innerHTML=icon('star')+'<b>+1</b>';document.body.append(el);
  const land=()=>{el.remove();playSound(s.soundEnabled,'star');if(!chip?.isConnected)return;const tag=document.createElement('span');tag.className='star-pop-tag';tag.setAttribute('aria-hidden','true');tag.textContent=' +1 ★';chip.classList.add('star-pop');chip.append(tag);setTimeout(()=>{tag.remove();chip.classList.remove('star-pop');},1000);if(!still)chip.animate?.([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:380,easing:'ease-out'});};
  if(!el.animate||!target?.width||still){setTimeout(land,900);return;}
  const dx=target.left+target.width/2-innerWidth/2,dy=target.top+target.height/2-innerHeight/2;
  el.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:0},{transform:'translate(-50%,-50%) scale(1.2)',opacity:1,offset:.25},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.55},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.2)`,opacity:.8}],{duration:1100,easing:'cubic-bezier(.5,0,.3,1)'}).onfinish=land;
}
function previous(){labSummary=false;stopMotion();if(step===0){go('map');return;}step--;report=null;zoom=false;sketching=false;feedback=null;render();window.scrollTo({top:0,behavior:'instant'});}
function back(){labSummary=false;stopMotion();
  let route=navigation.back();while(route&&((route.screen==='mission'&&!isStageOpen(s,route.stage))||(route.screen==='reward'&&!restoredPlaces(s).includes(route.stage))||(route.screen==='commission'&&!campaignOpen(s,route.stage,route.commissionIndex))||(route.screen==='ending'&&restoredPlaces(s).length!==5)))route=navigation.back();
  if(!route)return;screen=route.screen;if(route.stage)stage=route.stage;if(screen==='mission')step=route.step;if(screen==='commission'){commissionIndex=route.commissionIndex;requestCard=null;}feedback=null;report=null;render();window.scrollTo({top:0,behavior:'instant'});
}
function settings(replaysOpen=false){modal('설정',settingsContent(s,{replaysOpen}));if(replaysOpen)dialog.querySelector?.('.concept-replays')?.scrollIntoView?.({block:'start'});}
// Silent clip with DOM captions; the village music stops while it is open and returns when the dialog closes.
function openConcept(id,back){if(!replayUnlocked(s,id))return;const item=replayItem(id);modal(item.title,conceptView(id,back==='settings'?'settings':''));conceptPlayer=createConceptPlayer(dialog.querySelector?.('.concept-player'));syncMusic();}
function togglePreview(){
  if(studentSnapshot){s=studentSnapshot;studentSnapshot=null;stage=s.stage;step=s.step[stage]||0;selectedStage=STAGES.find(t=>!restoredPlaces(s).includes(t.id)&&isStageOpen(s,t.id))?.id||STAGES.at(-1).id;navigation.reset();dialog.close();go('map');}
  else{save();studentSnapshot=JSON.parse(JSON.stringify(s));s=JSON.parse(JSON.stringify(s));s.adminUnlocked=true;render();}
}
function notebook(){modal('우리 탐험대의 가방',notebookContent(s));}
function tool(id){const t=STAGES[id-1];if(!t||!restoredPlaces(s).includes(id))return;if(!s.toolUses.includes(String(id)))s.toolUses.push(String(id));save();modal(`${toolArt(t.id)} ${t.reward}`,id===1?lensTool('duck',2):toolContent(s,id));}
function lensTool(id,index){if(!Object.hasOwn(OBSERVATIONS,id))id='duck';const o=OBSERVATIONS[id][Math.max(0,Math.min(2,index))];return '<div class="inline-options">'+Object.keys(OBSERVATIONS).map(a=>btn(a==='frog'?'개구리':a==='crab'?'게':a==='duck'?'오리':'토끼','lens-animal',a===id?'selected':'quiet','data-id="'+a+'"')).join('')+'</div><div class="detail-crop tool-crop" style="--focus-x:'+o.x+';--focus-y:'+o.y+'">'+art(id)+'</div><p>'+o.text+'</p><div class="inline-options">'+OBSERVATIONS[id].map((o,i)=>btn(o.label,'lens-part','quiet','data-id="'+id+'" data-value="'+i+'"')).join('')+'</div>';}
function moveLens(e,surface){const label=document.querySelector('.lens-notes h2'),caption=document.querySelector('.lens-notes>p'),record=document.querySelector('.lens-notes [data-action=observe]');if(label)label.textContent='자유롭게 확대 중';if(caption)caption.textContent='관찰할 부분에서 손을 떼어 줘.';if(record)record.disabled=true;const box=surface.getBoundingClientRect(),x=Math.max(0,Math.min(100,(e.clientX-box.left)/box.width*100)),y=Math.max(0,Math.min(100,(e.clientY-box.top)/box.height*100));for(const el of [surface,document.querySelector('#lens-detail')]){if(el){el.style.setProperty('--focus-x',x);el.style.setProperty('--focus-y',y);}}}
function stopMotionFrame(){if(motionRAF!==null){window.cancelAnimationFrame(motionRAF);motionRAF=null;}}
function mountMotionPlayer(){
 const host=document.querySelector('.motion-observer');
 motionPlayer=createMotionPlayer(host,{phase:motionPhase,playing:motionPlaying,slow:motionSlow,
  onUpdate(state){motionPhase=state.phase;motionPlaying=state.playing;paintMotion();},
  onError(){failedMotionVideos.add(host.dataset.motion);motionPlaying=false;motionPhase=0;render();document.querySelector('#announcer').textContent=MOTIONS[host.dataset.motion]?.optional?'영상을 불러오지 못했어. 다시 불러오기 버튼을 눌러 봐.':'영상을 열 수 없어 움직임 설명 그림으로 바꿨어. 그림으로 관찰하거나 영상을 다시 불러와 사진을 찍어 봐.';}
 });
 paintMotion();
}
function stopMotion(reset=true){stopMotionFrame();motionPlayer?.pause();motionPlaying=false;motionTime=0;if(reset){motionPhase=0;motionPlayer?.seek(0);}paintMotion();}
function paintMotion(){
 const host=document.querySelector('.motion-observer');if(!host)return;const id=host.dataset.motion;if(!Object.hasOwn(MOTIONS,id))return;
 const frame=motionPlayer?videoFrameAt(id,motionPhase):frameAt(motionPhase),svg=host.querySelector('.motion-model');if(svg)svg.outerHTML=motionDiagram(id,motionPhase);
 const caption=host.querySelector('.motion-caption');if(caption)caption.textContent=motionCaption(id,frame,motionPlayer?.viewed||motionOpen(s,id));
 const play=host.querySelector('.motion-control-play');if(play){const label=play.querySelector('[data-play-label]'),glyph=play.querySelector('[data-motion-play-icon]');if(label)label.textContent=motionPlaying?'일시정지':'재생';if(glyph)glyph.innerHTML=icon(motionPlaying?'pause':'play');play.setAttribute('aria-label',motionPlaying?'일시정지':'재생');}
 const overlay=host.querySelector('.motion-start-button');if(overlay)overlay.hidden=motionPlaying;host.querySelector('.motion-player')?.classList.toggle('is-playing',motionPlaying);
 const slow=host.querySelector('[data-action="motion-slow"]');if(slow)slow.textContent=motionSlow?'보통 속도':'느리게';
 const slider=host.querySelector('#motion-phase');if(slider)slider.value=motionPhase;
 // Actual decoded video pixels, after playback, are required for a photo.
 if(motionPlayer){const ready=motionPlayer.ready&&motionPlayer.viewed,capture=host.querySelector('[data-action="motion-capture"]'),note=host.querySelector('[data-motion-ready]');if(capture)capture.disabled=!ready;if(note){note.textContent=motionGuide({viewed:motionPlayer.viewed,ready,playing:motionPlaying,done:s.inquiry.motion[id]!==undefined,next:note.dataset.next,allDone:note.hasAttribute('data-all-done'),extra:note.hasAttribute('data-extra')});note.classList.toggle('ready',ready);}}
 const full=host.querySelector('[data-action="motion-fullscreen"]');if(full){const expanded=document.fullscreenElement===host.querySelector('.motion-player');full.setAttribute('aria-label',expanded?'동영상 전체화면 닫기':'동영상 전체화면 보기');full.setAttribute('title',expanded?'전체화면 닫기 (Esc)':'전체화면 보기');full.querySelector('[data-motion-fullscreen-icon]').innerHTML=icon(expanded?'shrink':'expand');}
 const video=host.querySelector('video.motion-video'),format=t=>'0:'+String(Math.floor(Number(t)||0)).padStart(2,'0'),current=host.querySelector('[data-motion-current]'),duration=host.querySelector('[data-motion-duration]');if(current)current.textContent=format(video?.currentTime);if(duration)duration.textContent=format(video?.duration||5);
}
function startMotionFrame(){if(typeof window.requestAnimationFrame!=='function')return;motionRAF=window.requestAnimationFrame(time=>{if(!motionPlaying||screen!=='mission'||stage!==3)return;const delta=motionTime?time-motionTime:0;motionTime=time;const old=frameAt(motionPhase);motionPhase=(motionPhase+delta/(motionSlow?100:40))%101;const slider=document.querySelector('#motion-phase');if(slider)slider.value=motionPhase;if(frameAt(motionPhase)!==old)paintMotion();startMotionFrame();});}
function download(){
  modal('나의 탐험 일기',researchDiaryView(s)+'<div class="dialog-actions">'+btn('노트 덮기','close-dialog','primary')+'</div>');
}
// Only says why saving stopped; backup and restore were removed from the app (2026-10-26).
function storageHelp(){modal('기록 저장 안내',`<p role="status">${esc(storageMessage(recordStore.status)||'기록은 현재 브라우저에 자동 저장돼.')}</p><div class="dialog-actions">${btn('닫기','close-dialog','secondary')}</div>`);}
function openCommission(id,index=0){
  if(!isStageOpen(s,id)||!campaignOpen(s,id,index))return;stage=id;commissionIndex=index;evidenceOpen=false;go('commission');
}
function requestCommission(id,index=0){
  if(!isStageOpen(s,id)||!campaignOpen(s,id,index))return;
  if(index===2||(campaignDone(s,id,0)&&campaignDone(s,id,1))){openCommission(id,index);return;}
  modal('편지가 도착했어!',commissionLetter(s,id));
  playSound(s.soundEnabled,'star');
  document.querySelector('#announcer').textContent=`${COMMISSIONS[id-1].npc}에게서 편지가 도착했어.`;
}
// Jump to the card that holds the first blank (or else wrong) answer and mark that row.
function showGap(){const parts=requestParts(stage,commissionIndex),gap=requestGap(s,stage,parts);picked=null;if(!gap)return say(campaignHint(s,stage,commissionIndex));
  const cards=requestCards(s,stage,parts),k=cards.findIndex(c=>c.part===gap.index&&(c.kind==='own-sort'||c.kind==='retest'||c.rows.some(r=>r.key===gap.key)));
  if(commissionIndex<2)commissionIndex=gap.index;if(k>=0)requestCard=k;say(gap.text,false,gap.key?['row:'+gap.key]:[]);}
// The last challenge is part of every place: the two requests lead straight into it, and the reward waits until it is done.
const challengeLeft=()=>campaignOpen(s,stage,2)&&!campaignDone(s,stage,2);
function toChallenge(){openCommission(stage,2);say('부탁을 해결했어! 이제 마지막 도전으로 이 장소를 완성하자.',true);}
function submitCommission(){
  if(commissionIndex<2){
    const result=claimRequest(s,stage);
    if(!result.ok)return showGap();
    playSound(s.soundEnabled,result.fresh?'stamp':'correct');if(challengeLeft())return toChallenge();restoredFlash=stage;go('reward');return;
  }
  const result=claimCommission(s,stage,commissionIndex);
  if(!result.ok)return showGap();
  playSound(s.soundEnabled,result.fresh?'stamp':'correct');
  if(commissionIndex===1&&challengeLeft())return toChallenge();
  if(commissionIndex>=1){restoredFlash=stage;go('reward');return;}
  say(commissionIndex===2?'도전 도장을 받았어! 네 전시관에도 남겨 뒀어.':'첫 기록을 받았어! 이제 다른 상황에도 적용해 보자.',true);
}
// Flips the observation notebook in place so the page-turn animation is not lost to a re-render.
function turnNotePage(book,index,animate=true){if(!book)return;const pages=[...book.querySelectorAll('.note-page')];if(!pages[index]||pages[index].classList.contains('on'))return;
  pages.forEach((p,i)=>{p.classList.toggle('on',i===index);p.hidden=i!==index;});if(animate){pages[index].classList.remove('turning');void pages[index].offsetWidth;pages[index].classList.add('turning');}
  book.querySelectorAll('.note-tabs .btn').forEach((b,i)=>{b.classList.toggle('on',i===index);b.setAttribute('aria-pressed',String(i===index));})}
function act(action,el){const id=el.dataset.id,value=el.dataset.value,key=el.dataset.key;
  if(screen==='commission'&&el.dataset.commissionIndex!==undefined){
    const part=Number(el.dataset.commissionIndex);if(![0,1,2].includes(part)||!campaignOpen(s,stage,part))return;
    if(picked&&Number(picked.commissionIndex)!==part)picked=null;commissionIndex=part;
  }
  switch(action){
    case 'home':go('home');break;
    case 'start':start();break;
    case 'story-intro':openStory('intro');break;
    case 'story-outro':if(s.adminUnlocked||restoredPlaces(s).length===5)openStory('outro');break;
    case 'story-skip':finishStory();break;
    case 'story-toggle':storyPlayer?.toggle();break;
    case 'story-fullscreen':storyFullscreen();break;
    case 'intro-done':s.introSeen=true;dialog.close();go('map');break;
    case 'map':if(screen==='reward')restoredFlash=stage;selectedStage=STAGES.find(t=>!restoredPlaces(s).includes(t.id)&&isStageOpen(s,t.id))?.id||5;arrived=true;go('map');break;
    case 'map-overview':case 'map-explore':if(screen==='map'&&restoredPlaces(s).length===STAGES.length){mapOverview=action==='map-overview';questOpen=false;autoEnter=false;render();document.querySelector('#main')?.focus({preventScroll:true});document.querySelector('#announcer').textContent=mapOverview?'다섯 장소를 모두 복구한 마을이야. 중앙 코어가 빛나고 있어.':'마을 산책을 시작해. 길이나 건물을 눌러 봐.';}break;
    case 'map-select':selectMap(Number(id));break;
    case 'quest-toggle':setQuestOpen(!questOpen);return;
    case 'locked-next':dialog.close();selectMap(Number(id));break;
    case 'sound-all':{const on=!(s.musicOn!==false||s.soundEnabled);s.musicOn=on;s.soundEnabled=on;save();syncMusic();if(!on)silence();else playSound(true);const b=document.querySelector('[data-action="sound-all"]');if(b){b.innerHTML=icon(on?'sound':'muted');b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'소리 끄기':'소리 켜기');b.title=on?'소리 끄기':'소리 켜기';}break;}
    case 'map-walk':autoEnter=false;map?.walk?.(id);break;
    case 'map-prev':case 'map-next':selectMap(Math.max(1,Math.min(5,selectedStage+(action==='map-prev'?-1:1))));break;
    case 'enter':enter(Number(id));break;
    case 'replay-stage':enter(Number(id),true);break;
    case 'review-activities':reviewActivities(Number(id)||stage);break;
    case 'review-open':reviewOpen(Number(id),Number(value));break;
    case 'commission-open':dialog.close();requestCommission(Number(id),Number(value)||0);break;
    case 'commission-letter':if(campaignOpen(s,Number(id),0))modal('주민에게서 온 편지',commissionLetter(s,Number(id)));break;
    case 'commission-accept':if(isStageOpen(s,Number(id))&&campaignOpen(s,Number(id),0)){dialog.close();openCommission(Number(id),campaignDone(s,Number(id),0)&&!campaignDone(s,Number(id),1)?1:0);}break;
    case 'commission-part':if(screen==='commission'&&[0,1].includes(Number(value))&&campaignOpen(s,stage,Number(value))){commissionIndex=Number(value);requestCard=null;feedback=null;picked=null;render();}break;
    case 'request-card':if(screen==='commission'){const n=requestCards(s,stage,requestParts(stage,commissionIndex)).length,k=Number(value);if(Number.isInteger(k)&&k>=0&&k<n){requestCard=k;feedback=null;picked=null;render();}}break;
    case 'commission-choice':if(screen==='commission'&&chooseCommission(s,stage,commissionIndex,key,value)){feedback=null;render();}break;
    case 'commission-sort':if(screen==='commission'&&chooseCommission(s,stage,commissionIndex,id,value)){picked=null;feedback=null;render();}break;
    case 'commission-submit':if(screen==='commission')submitCommission();break;
    case 'commission-next':if(screen==='commission'){if(commissionIndex<2&&campaignDone(s,stage,0)&&campaignDone(s,stage,1)){if(challengeLeft())toChallenge();else go('reward');}else if(commissionIndex===2)go('reward');}break;
    case 'note-page':turnNotePage(el.closest('.note-book'),Number(value));return;
    case 'commission-evidence':if(screen==='commission'){evidenceOpen=!evidenceOpen;campaignDraft(s,stage,commissionIndex).usedTool=true;const toolId=stage===2?1:stage-1;if(restoredPlaces(s).includes(toolId)&&!s.toolUses.includes(String(toolId)))s.toolUses.push(String(toolId));save();}break;
    case 'commission-level':if(screen==='commission'&&[1,2,3].includes(Number(value))){const d=campaignDraft(s,stage,commissionIndex);d.level=Number(value);d.prediction='';feedback=null;render();}break;
    case 'commission-predict':if(screen==='commission'&&['more','same','less'].includes(value)){campaignDraft(s,stage,commissionIndex).prediction=value;feedback=null;render();}break;
    case 'commission-trial':if(screen==='commission'){if(!runCommissionTrial(s,stage,commissionIndex))say('시험 전에 결과를 예상해 줘. 예상은 틀려도 괜찮아.');else{feedback={good:true,text:'시험 결과를 표에 적었어. 두 항목을 함께 비교해 줘.'};render();}}break;
    case 'gallery':go('gallery');break;
    case 'advance':advance();break;
    case 'previous':previous();break;
    case 'nav-back':back();break;
    case 'inspect':{
      if(id){if(!OBSERVE_PAIRS[round()]?.includes(id))return;s.activeAnimal=id;zoom=false;}
      focusIndex=Math.max(0,Math.min(2,Number(value)||0));if(relook&&OBSERVATIONS[s.activeAnimal]?.[focusIndex]?.id===relook)relook=null;feedback=null;render();break;
    }
    case 'animal-tab':focusIndex=0;if(OBSERVE_PAIRS[round()].includes(id)){s.activeAnimal=id;zoom=false;feedback=null;render();}break;
    // A wrong description sends the learner to the evidence: the specimen zooms to that part. A first-try match is called out.
    case 'observe':{const o=Object.values(OBSERVATIONS).flat().find(o=>o.id===id);if(!o)return;const owner=Object.keys(OBSERVATIONS).find(k=>OBSERVATIONS[k].includes(o));
      if(value&&value!=='right'){if(relook===id)return;relook=id;const tries=s.observeTries??={};if(!s.observed.includes(id))tries[id]='helped';if(owner){s.activeAnimal=owner;focusIndex=OBSERVATIONS[owner].indexOf(o);}const chosen=o.wrong[Number(String(value).split('-')[1])]?.replace(/\.$/,'');return say((chosen?withParticle('‘'+chosen+'’','은/는')+' 그림과 달라. ':'')+withParticle(o.look||o.label)+' 다시 봐!',false,['observe:'+value]);}
      const tries=s.observeTries??={},first=!s.observed.includes(id)&&!tries[id];if(!s.observed.includes(id)){s.observed.push(id);tries[id]??='first';}relook=null;feedback=null;render();document.querySelector('#announcer').textContent=first?'한 번에 맞혔어! 특징을 기록했어.':'특징을 기록했어.';if(first)toast('한 번에 맞혔어! 눈으로 잘 확인했네.');break;}
    case 'aha-pick':{const o=Object.values(OBSERVATIONS).flat().find(o=>o.id===id);if(!o?.ahaQ||!s.observed.includes(id)||![0,1].includes(Number(value)))break;(s.ahaPicks??={})[id]=Number(value);render();break;}
    case 'zoom':zoom=!zoom;render();break;
    case 'scan-reset':viewer?.call('reset');break;
    case 'dome-tilt':toggleTilt(el);break;
    case 'compare':{const c=s.compares[round()];for(const k of ['common','difference'])if(c[k]===value)delete c[k];if(['common','difference'].includes(key))c[key]=value;feedback=null;render();break;}
    case 'sort':{if(!SORT_ANIMALS.includes(id))break;if(value==='pool')delete s.sorts[round()][id];else s.sorts[round()][id]=value;feedback=null;render();
      // A card that breaks the everyday guess (a bird that cannot fly, a sea animal that is not a fish) explains itself once it lands in the right place.
      const key=round()?s.criteria[1]:'wings';if(value===(ANIMALS[id][key]?'yes':'no')&&ANIMALS[id].aha)toast('알고 보니! '+ANIMALS[id].aha,document.querySelector(`.drag-card[data-id="${id}"]`)||el);break;}
    case 'criterion':if(round()===1&&s.criteria[1]!==value){s.sorts[1]={};s.inquiry.reclass[1]={prediction:'',revealed:false};s.inquiry.verify[1].checked='';}s.criteria[round()]=value;feedback=null;render();break;
    case 'habitat':stopMotion();if(Object.hasOwn(HABITATS,id)||Object.hasOwn(DOME_ZONES,id))activeHabitat=id;feedback=null;render();break;
    case 'discover':{const d=DISCOVERIES.find(x=>x.id===id);if(!d)return;if(!s.discovered.includes(id))s.discovered.push(id);feedback=null;render();break;}
    case 'link':{if(!['frog','crab'].includes(id))break;const l=s.links[id],kind=el.dataset.kind;if(key==='pool'){for(const k of Object.keys(l))if(l[k]===value)delete l[k];}else if(['environment','body','life'].includes(key)){if(kind&&kind!==key)return say(`이 칸에는 ‘${{environment:'사는 곳',body:'몸의 특징',life:'움직이는 방법'}[key]}’ 카드가 들어가.`);l[key]=value;}feedback=null;render();break;}
    case 'pick':picked=picked?.ref===el.dataset.ref?null:{...el.dataset};render();break;
    case 'place':{if(!picked){playSound(s.soundEnabled);toast('먼저 옮길 카드를 눌러 줘.',el);break;}const {action,dataset}=dropData(picked,el.dataset);dropCard(action,dataset);return;}
    case 'flashlight-clue':if(screen==='mission'&&stage===4&&step%2===0){const c=CASES[round()],k=c.clues[Number(value)];if(k)modal('발견한 단서',clueFoundView(c,Number(value),s.cases[round()].opened.includes(k.id)));}break;
    case 'flashlight-collect':if(screen==='mission'&&stage===4&&step%2===0){const c=CASES[round()],a=s.cases[round()],k=c.clues[Number(value)];if(!k)break;const fresh=!a.opened.includes(k.id);if(fresh)a.opened.push(k.id);dialog.close();feedback=null;save();render();if(fresh)playSound(s.soundEnabled,'star');document.querySelector('.flashlight-hotspot[data-value="'+value+'"]')?.focus({preventScroll:true});document.querySelector('#announcer').textContent=k.kind+' 단서를 발견 수첩에 붙였어. '+(a.opened.length<2?'다른 특징도 찾아보자.':'이 단서가 다른 동물과 어떻게 다른지 생각해 봐.');}break;
    case 'flashlight-guess':if(screen==='mission'&&stage===4&&step%2===0){const c=CASES[round()],a=s.cases[round()];if(a.opened.length<2){say('손전등으로 서로 다른 단서를 두 개 이상 찾아 봐.');break;}modal('이 동물은 누구일까?',flashlightGuessView(c,a));}break;
    case 'case-animal':if(stage===4&&CASES[round()].candidates.includes(id)){s.cases[round()].candidate=id;dialog.close();feedback=null;render();document.querySelector('.flashlight-note:not(.locked)')?.focus();}break;
    case 'case-continue':{
      if(stage!==4||step%2!==0)break;
      const a=s.cases[round()];
      if(a.opened.length<2){feedback={text:'손전등으로 반짝이는 곳을 비춰 봐. 서로 다른 단서 두 개 이상을 발견 수첩에 붙여 줘.',good:false};render();document.querySelector('.flashlight-hotspot:not(.found)')?.focus();break;}
      if(!a.candidate){modal('이 동물은 누구일까?',flashlightGuessView(CASES[round()],a));break;}
      panelPages.set(panelKey('.case-activity'),a.candidate?1:0);render();
      document.querySelector('.flashlight-note:not(.locked):not(.selected)')?.focus();break;
    }
    case 'case-reset':Object.assign(s.cases[round()],{opened:[],grounds:[],candidate:''});clueIndex=0;feedback=null;render();break;
    case 'case-ground':{const a=s.cases[round()];if(!a.opened.includes(value))break;a.grounds=a.grounds.includes(value)?a.grounds.filter(g=>g!==value):[...a.grounds,value];feedback=null;render();break;}
    // Spent energy stays spent even when the answer changes (screen 08); 'case-reset' starts a fresh investigation.
    case 'clue-spend':{const c=CASES[round()],a=s.cases[round()],k=c.clues[Number(value)];if(!k||a.opened.includes(k.id))break;if(a.opened.length>=CLUE_ENERGY)return say('조사 에너지를 다 썼어. 연 단서로 판단하거나 ‘다시 조사’를 눌러 봐.');a.opened.push(k.id);feedback=null;save();render();break;}
    case 'case-habitat':s.cases[round()].habitat=value;feedback=null;render();break;
    case 'case-reason':s.cases[round()].reason=value;feedback=null;render();break;
    case 'design-problem':{const prior=s.designs[round()].problem;if(!selectDesignProblem(s,round(),value))break;report=null;feedback={good:true,text:`${PROBLEMS[prior]?.product||'이전 초안'} 기록은 그대로 보관했어. ${PROBLEMS[value].product} 초안을 이어서 만들어 봐.`};render();break;}
    case 'source-seen':s.designs[round()].experiment.sourceSeen=true;feedback={good:true,text:'이 특징을 물건의 어느 부분에 쓸까?'};render();break;
    case 'design-choice':if(['feature','structure'].includes(key))s.designs[round()][key]=value;s.designs[round()].explanation='';report=null;feedback=null;render();break;
    // A part dropped on a spot of the product (screen 09); dropped back on the tray it comes off.
    case 'design-part':{const d=s.designs[round()];if(key==='pool'){if(d.structure===value){d.structure='';d.spot='';}}else if(PRODUCTS[d.problem]?.spots.some(x=>x[0]===key)&&STRUCTURES.some(x=>x[0]===value)){d.structure=value;d.spot=key;}else break;d.explanation='';report=null;feedback={good:true,text:key==='pool'?'부품을 상자로 돌려놓았어. 그린 선은 그대로야.':PRODUCTS[d.problem].spots.find(x=>x[0]===key)[1]+'에 부품을 붙였어. 시험해서 기능을 확인해 봐.'};render();break;}
    case 'studio-download':if(s.studioRecord)downloadStudioArtwork(s.studioRecord).catch(()=>say('그림을 저장하지 못했어. 다시 눌러 줘.'));break;
    case 'sketch-toggle':sketching=!sketching;render();break;
    case 'sketch-undo':s.designs[round()].strokes.pop();render();break;
    case 'test':report=recordTrial(s,round());feedback={good:report.passed,text:report.passed?'특징과 구조가 연결됐어! 이제 아래 설명 카드도 골라 봐.':'바꿀 부분을 찾은 거야! 설계를 고쳐 다시 시험해 봐.'};render();break;
    case 'explain':s.designs[round()].explanation=value;feedback=null;render();break;
    case 'verify-run':s.inquiry.verify[0].ran=true;feedback=null;render();break;
    case 'verify-cause':s.inquiry.verify[0].cause=value;feedback=null;render();break;
    case 'verify-fix':s.inquiry.verify[0].fix=value;feedback=null;render();break;
    case 'verify-recheck':{const x=s.inquiry.verify[0];if(!x.fix)break;x.checked=x.fix;feedback=null;render();if(!OBSERVABLE.includes(x.fix))say(`‘${CRITERIA[x.fix]}’로도 결과가 달라. 몸에서 확인할 수 있는 기준을 골라 봐.`);break;}
    case 'verify-own':if(OWN_CRITERIA.includes(s.criteria[1]))s.inquiry.verify[1].checked=s.criteria[1];feedback=null;render();break;
    case 'sort-predict':s.inquiry.reclass[round()].prediction=value;s.inquiry.reclass[round()].revealed=false;render();break;
    case 'sort-reveal':{const before=groupRects();if(s.inquiry.reclass[round()].prediction)s.inquiry.reclass[round()].revealed=true;render();flipGroups(before);break;}
    case 'sort-before':{const before=groupRects();s.inquiry.reclass[round()].revealed=false;render();flipGroups(before);break;}
    case 'case-hint':caseHint=!caseHint;render();break;
    case 'clue-open':clueIndex=Math.max(0,Math.min(4,Number(value)||0));render();break;
    case 'motion-fullscreen':toggleMotionFullscreen(document.querySelector('.motion-player')).catch(()=>{document.querySelector('#announcer').textContent='전체화면을 열지 못했어. 이 화면에서 영상을 계속 볼 수 있어.';});break;
    case 'motion-play':motionPlaying=!motionPlaying;motionTime=0;if(motionPlayer){if(motionPlaying)motionPlayer.play();else motionPlayer.pause();paintMotion();}else render();break;
    case 'motion-slow':motionSlow=!motionSlow;if(motionPlayer){motionPlayer.setSlow(motionSlow);paintMotion();}else render();break;
    case 'motion-frame':stopMotion(false);motionPhase=Number(value)||0;if(motionPlayer){motionPlayer.seek(motionPhase);paintMotion();}else render();break;
    case 'motion-predict':if(Object.hasOwn(MOTIONS,id)&&['part','other'].includes(value)){s.inquiry.motionPredictions[id]=value;feedback=null;render();}break;
    case 'motion-retry':failedMotionVideos.delete(id);motionPhase=0;motionPlaying=false;render();break;
    case 'motion-photo':{const photo=normalizeMotionPhoto(s.inquiry.motionPhotos?.[id]);if(photo)modal('내가 찍은 전시 사진','<figure class="motion-photo-review"><img src="'+photo.dataURL+'" alt="영상에서 직접 고른 전시 사진"><figcaption>내가 고른 '+photo.time.toFixed(1)+'초의 순간</figcaption></figure><div class="dialog-actions">'+btn('닫기','close-dialog','primary')+'</div>');}break;
    case 'motion-capture':if(Object.hasOwn(MOTIONS,id)){
      const captured=motionPlayer?.capture?.(),photo=normalizeMotionPhoto(captured);
      if(motionPlayer&&!photo){document.querySelector('#announcer').textContent='재생 버튼을 누르고 영상이 보이면 다시 사진을 찍어 줘. 이전 사진은 그대로야.';break;}
      if(!motionPlayer&&s.inquiry.motionPhotos?.[id]){say('영상이 다시 열리면 새 사진을 찍을 수 있어. 이전에 찍은 사진은 보관하고 있어.');break;}
      stopMotion(false);if(captured)motionPhase=captured.phase;const frame=motionPlayer?videoFrameAt(id,motionPhase):frameAt(motionPhase);
      s.inquiry.motion[id]=MOTION_KEY_FRAME;s.inquiry.motionEvidence[id]={frame,phase:motionPhase,source:motionPlayer?'video':'diagram'};
      if(photo)(s.inquiry.motionPhotos??={})[id]=photo;
      save();say(photo?'찰칵! 전시관에 보낼 사진 한 장을 골랐어. 사진 속 동물의 몸과 움직임을 살펴봐.':'설명 그림의 관찰 기록을 남겼어. 영상이 다시 열리면 전시 사진도 찍어 봐.',true);
    }break;
    case 'lab-summary':if(!comparisonReady(s.designs[round()]))return say('지금 모양도 시험해 줘. 서로 다른 두 모양의 결과가 필요해.');labSummary=1;feedback=null;render();break;
    case 'summary-page':if(labSummary&&['1','2'].includes(value)){labSummary=Number(value);feedback=null;render();window.scrollTo({top:0,behavior:'instant'});}break;
    case 'lab-back':labSummary=false;render();break;
    case 'experiment-level':s.designs[round()].experiment.level=Math.max(1,Math.min(3,Number(value)||1));s.designs[round()].experiment.reflection='';render();break;
    case 'prediction':s.designs[round()].experiment.prediction=value;render();break;
    case 'reflection':s.designs[round()].experiment.reflection=value;render();break;
    case 'experiment-run':{const d=s.designs[round()];if(!d.experiment.sourceSeen||!d.experiment.prediction){say('동물 특징을 먼저 기록하고, 결과를 예상해 줘.');break;}report=recordTrial(s,round());if(!report.passed){say('시험해 보니 맞지 않는 조건이 있어. 점검표를 보고 설계를 고쳐 봐.');break;}if(!addExperimentTrial(d)){say('동물 특징을 먼저 기록하고, 결과를 예상해 줘.');break;}feedback=null;render();break;}
    case 'feature-zoom':{if(!['web','shell','fur'].includes(el.dataset.kind))break;modal('동물 특징 크게 보기',`<div class="feature-enlargement">${anatomy(el.dataset.kind)}</div><div class="dialog-actions">${btn('닫기','close-dialog','primary')}</div>`);break;}
    case 'photo-zoom':{const img=el.querySelector('img');if(!img)break;if(relook){relook=null;render();}const x=el.style.getPropertyValue('--focus-x')||50,y=el.style.getPropertyValue('--focus-y')||50;modal('사진 크게 보기',`<div class="photo-zoom"><div class="detail-crop zoom-crop" style="--focus-x:${Number(x)};--focus-y:${Number(y)}"><img src="${esc(img.src)}" alt="${esc(img.alt)} 확대"></div><figure class="zoom-whole"><img src="${esc(img.src)}" alt="${esc(img.alt)} 전체"><span class="zoom-ring" style="left:${Number(x)}%;top:${Number(y)}%"></span><figcaption>전체 모습에서 동그라미가 확대한 곳이야.</figcaption></figure></div><div class="dialog-actions">${btn('닫기','close-dialog','primary')}</div>`);break;}
    case 'lens-animal':modal('확대 관찰',lensTool(id,0));break;
    case 'lens-part':modal('확대 관찰',lensTool(id,Number(value)||0));break;
    case 'notebook':notebook();break;
    case 'tool':tool(Number(id));break;
    case 'settings':settings();break;
    case 'concept-open':openConcept(id,value);break;
    case 'concept-play':conceptPlayer?.play();break;
    case 'concept-replay':conceptPlayer?.replay();break;
    case 'concept-back':settings(true);break;
    case 'music-toggle':s.musicOn=s.musicOn===false;save();syncMusic();settings();break;
    case 'sound':s.soundEnabled=!s.soundEnabled;save();if(!s.soundEnabled)silence();else playSound(true);render();if(dialog.open)settings();break;
    case 'admin':togglePreview();settings();break;
    case 'preview-end':if(studentSnapshot)togglePreview();break;
    case 'close-dialog':dialog.close();break;
    case 'reset-confirm':modal('탐험 기록을 초기화할까요?',`<p>관찰 기록·탐험 별·탐사 도구·주민 답장·발명 작품과 그림·이전 버전 기록이 이 기기에서 모두 지워져요. 소리 설정은 그대로 남아요.</p><div class="dialog-actions">${btn('취소','close-dialog','secondary','autofocus')}${btn('기록 지우기','reset','danger')}</div>`);break;
    case 'reset':{const next=Object.assign(freshExpedition(),{soundEnabled:s.soundEnabled,soundVolume:s.soundVolume,musicOn:s.musicOn,musicVolume:s.musicVolume});ensureCampaign(next);if(!studentSnapshot&&!recordStore.write(next,{replace:true})){storageHelp();break;}stopMotion();focusIndex=0;clueIndex=0;s=next;if(studentSnapshot)s.adminUnlocked=true;commissionIndex=0;evidenceOpen=false;navigation.reset();stage=1;step=0;selectedStage=1;activeHabitat='forest';zoom=false;sketching=false;stroke=null;dialog.close();go('home');break;}
    case 'ending':if(s.adminUnlocked||restoredPlaces(s).length===5)go('ending');break;
    case 'download':download();break;
    case 'dome-look':if(DOME_ZONES[el.dataset.id]){stopMotion();looked.add(el.dataset.id);activeHabitat=el.dataset.id;feedback=null;render();}break;
    case 'retry-images':render();break;
  }
  save();
}
// Shown as a bubble right above the tapped button, so it never hides the control the learner needs next.
// speaker: a village resident's name turns the toast into a pixel speech bubble over them.
// Click sound per action: undefined plays the default tap, null stays quiet (that action plays its own sound).
const CLICK_SOUND={sound:null,enter:null,place:null,notebook:'page','note-page':'page',settings:'page',tool:'page'};
function toast(text,anchor,speaker){if(typeof document.createElement!=='function')return;let t=document.querySelector('#hint-toast');if(!t){t=document.createElement('div');t.id='hint-toast';t.className='hint-toast';t.setAttribute('role','status');document.body.append(t);}t.classList.toggle('speech',!!speaker);if(speaker){const b=document.createElement('b'),p=document.createElement('span');b.textContent=speaker;p.textContent=text;t.replaceChildren(b,p);}else t.textContent=text;const b=anchor?.getBoundingClientRect?.();if(b){const half=t.offsetWidth/2;t.style.left=Math.min(innerWidth-16-half,Math.max(16+half,b.left+b.width/2))+'px';t.style.top=Math.max(72,b.top-10)+'px';}t.classList.remove('show');void t.offsetWidth;t.classList.add('show');}
// A hint stays readable until the learner taps again (no timer that hides it mid-sentence).
const hideToast=()=>document.querySelector('#hint-toast')?.classList.remove('show');document.addEventListener('pointerdown',hideToast,true);if(typeof window.addEventListener==='function')window.addEventListener('resize',()=>{hideToast();fitBubble();});
// Mori's bubble (activity instruction) opens on tap and closes when the learner taps anywhere else.
document.addEventListener('click',e=>{const buddy=document.querySelector('.mission-page .guide-buddy,.commission-page .commission-feedback');if(!buddy)return;if(e.target.closest?.('.buddy-toggle')){buddy.classList.toggle('open');buddy.classList.remove('has-feedback','auto');}else if(!buddy.contains(e.target))buddy.classList.remove('open','auto');});
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;if(el.getAttribute('aria-disabled')==='true'){toast(el.dataset.why||'아직 누를 수 없어.',el);return;}if(CLICK_SOUND[el.dataset.action]!==null)playSound(s.soundEnabled,CLICK_SOUND[el.dataset.action]);act(el.dataset.action,el);});
document.addEventListener('input',e=>{
  if(e.target.id==='sound-volume'){s.soundVolume=Number(e.target.value)/100;e.target.nextElementSibling.textContent=e.target.value+'%';setSoundVolume(s.soundVolume);save();return;}
  if(e.target.id==='music-volume'){s.musicVolume=Number(e.target.value)/100;e.target.nextElementSibling.textContent=e.target.value+'%';setMusicVolume(s.musicVolume);syncMusic();save();return;}
  if(e.target.id==='experiment-note'||e.target.id==='peer-note'){s.designs[round()].experiment[e.target.id==='peer-note'?'peer':'note']=e.target.value.slice(0,180);save();return;}
  if(e.target.id==='experiment-level'){s.designs[round()].experiment.level=Number(e.target.value);s.designs[round()].experiment.reflection='';const label=document.querySelector('#level-label');if(label)label.textContent=EXPERIMENTS[s.designs[round()].problem].levels[Number(e.target.value)-1];const model=document.querySelector('.current-model');if(model)model.innerHTML=experimentDiagram(s.designs[round()].problem,Number(e.target.value),false);save();return;}
  if(e.target.id==='motion-phase'){const next=Number(e.target.value);stopMotion(false);motionPhase=next;motionPlayer?.seek(next);paintMotion();save();return;}
  if(e.target.id==='invention-name'){const d=s.designs[round()];d.name=e.target.value.slice(0,24);document.querySelector('#design-title').textContent=d.name||PROBLEMS[d.problem]?.product||'어떤 물건을 만들까?';save();}});
document.addEventListener('change',e=>{if(e.target.id==='experiment-level')render();});
document.addEventListener('fullscreenchange',paintMotion);
function sketchPoint(e,svg){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return [Math.round(Math.max(0,Math.min(320,p.x))),Math.round(Math.max(0,Math.min(260,p.y)))];}
document.addEventListener('pointerdown',e=>{const surface=e.target.closest?.('#lens-surface');if(surface&&!e.target.closest('[data-action]')){e.preventDefault();lensPointer={surface,id:e.pointerId};try{surface.setPointerCapture(e.pointerId);}catch{}moveLens(e,surface);return;}if(e.target.id==='motion-phase')stopMotion(false);if(e.target.id!=='drawing-surface'||!sketching||stage!==5||step%2!==0)return;e.preventDefault();const svg=e.target.closest('svg'),d=s.designs[round()];if(d.strokes.length>=30)return say('선은 30개까지야. 마지막 선을 지우고 다시 그려 줘.');const points=[sketchPoint(e,svg)],line=document.createElementNS('http://www.w3.org/2000/svg','polyline');d.strokes.push(points);line.setAttribute('points',points[0].join(','));svg.querySelector('#sketch-lines').append(line);try{svg.setPointerCapture(e.pointerId);}catch{}stroke={svg,points,line,id:e.pointerId};});
document.addEventListener('pointermove',e=>{if(lensPointer&&e.pointerId===lensPointer.id){moveLens(e,lensPointer.surface);return;}if(!stroke||e.pointerId!==stroke.id)return;e.preventDefault();if(stroke.points.length<250){stroke.points.push(sketchPoint(e,stroke.svg));stroke.line.setAttribute('points',stroke.points.map(p=>p.join(',')).join(' '));}});
for(const name of ['pointerup','pointercancel'])document.addEventListener(name,e=>{if(lensPointer&&e.pointerId===lensPointer.id){const animalId=lensPointer.surface.dataset.animal,list=OBSERVATIONS[animalId],x=Number(lensPointer.surface.style.getPropertyValue('--focus-x')),y=Number(lensPointer.surface.style.getPropertyValue('--focus-y'));focusIndex=list.reduce((best,o,i)=>(o.x-x)**2+(o.y-y)**2<(list[best].x-x)**2+(list[best].y-y)**2?i:best,0);lensPointer=null;render();}if(stroke&&e.pointerId===stroke.id){stroke=null;save();}});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target?.matches?.('[role=button][data-action]')){e.preventDefault();e.target.click();return;}if(dialog.open||screen!=='map'||e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;if(e.key==='Escape'&&questOpen){setQuestOpen(false);document.querySelector('[data-action="quest-toggle"]')?.focus();return;}if(questOpen)return;const direction={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'}[e.key];if(direction){e.preventDefault();autoEnter=false;map?.walk?.(direction);}else if(e.key==='Enter'&&!e.target?.closest?.('button,a,summary')){e.preventDefault();map?.interact?.();}});
document.addEventListener('error',e=>{if(e.target.tagName!=='IMG'||!e.target.dataset.image)return;e.target.classList.add('image-failed');if(!document.querySelector('#asset-warning'))app.insertAdjacentHTML('afterbegin','<p id="asset-warning" role="status">그림을 불러오지 못했어. 연결을 확인하고 <button data-action="retry-images">그림 다시 보기</button>를 눌러 줘.</p>');},true);
dialog.addEventListener('close',()=>{conceptPlayer?.destroy();conceptPlayer=null;syncMusic();if(!questOpen)map?.resume?.();});
if(typeof window.addEventListener==='function'){const resize=()=>document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||window.innerHeight)+'px');window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);resize();
  // The on-screen keyboard shrinks the visual viewport: bring the field being typed in back to the middle once it has opened.
  const keepField=()=>{const el=document.activeElement;if(el?.matches?.('textarea,input[type=text],input:not([type])'))setTimeout(()=>el.scrollIntoView?.({block:'center',behavior:'smooth'}),250);};
  document.addEventListener('focusin',keepField);window.visualViewport?.addEventListener('resize',keepField);document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMotion(false);storyPlayer?.pause();silence();}});}
enableDrag(app,(card,zone)=>{if(card.commissionIndex!==zone.commissionIndex)return;const {action,dataset}=dropData(card,zone);if(zone.commissionIndex!==undefined)dataset.commissionIndex=zone.commissionIndex;dropCard(action,dataset);});
render();
