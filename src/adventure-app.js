import {researchLines} from './research-report.js';
import {createMotionPlayer,videoFrameAt} from './motion-video.js';
import {createStoryPlayer} from './story-player.js';
import {normalizeExperiment,addExperimentTrial,comparisonReady,EXPERIMENTS,frameAt,MOTIONS,MOTION_KEY_FRAME} from './inquiry.js';
import {motionView,motionDiagram,experimentDiagram,anatomy} from './inquiry-views.js';
import {STAGES,ANIMALS,DOME_ZONES,SORT_ANIMALS,CRITERIA,OWN_CRITERIA,OBSERVABLE,OBSERVATIONS,OBSERVE_PAIRS,HABITATS,DISCOVERIES,CASES,CLUE_ENERGY,FEATURES,STRUCTURES,PROBLEMS,PRODUCTS,STORAGE_KEY,freshExpedition,restoreExpedition,isStageOpen,countStage,claimTask,taskHint,taskMistake,recordTrial,reportDesigns,selectDesignProblem} from './expedition.js';
import {art,mori,icon,btn,esc,withParticle} from './presentation.js';
import {header,page,questPanel,settingsContent,notebookContent,toolContent} from './shell-views.js';
import {createVillage} from './village.js';
import {createNavigation} from './navigation.js';
import {playSound,silence} from './audio.js';
import {enableDrag,dropData} from './drag.js';
import {can3d,mount3d,disable3d} from './view3d.js';
import {COMMISSIONS,ensureCampaign,campaignDraft,campaignDone,campaignOpen,chooseCommission,claimCommission,campaignHint,runCommissionTrial,restoredPlaces,campaignReport} from './campaign.js';

const app=document.querySelector('#app'),dialog=document.querySelector('#dialog'),navigation=createNavigation();
let s,storageOK=true;
try{s=restoreExpedition(localStorage.getItem(STORAGE_KEY));}catch{s=freshExpedition();storageOK=false;}
ensureCampaign(s);
let commissionIndex=0,evidenceOpen=false,motionPlayer=null,storyPlayer=null;
const failedMotionVideos=new Set();
let screen='home',stage=s.stage,step=s.step[stage]||0,selectedStage=stage,feedback=null,map=null,arrived=true,activeHabitat='forest',zoom=false,labSummary=false,focusIndex=0,clueIndex=0,motionPhase=0,motionPlaying=false,motionSlow=false,motionRAF=null,motionTime=0,lensPointer=null,sketching=false,stroke=null,report=null,exportURL=null,restoredFlash=null,picked=null,viewer=null,tilt=false,questOpen=false,autoEnter=false;
// Parts pinned on the 3D specimen this visit (not saved: a found part stays pinned through s.observed).
const pinned=new Set(),looked=new Set();
const round=()=>Math.floor(step/2);
const view=()=>({screen,stage,step,commissionIndex,evidenceOpen,selectedStage,arrived,activeHabitat,zoom,labSummary,focusIndex,clueIndex,motionPhase,motionPlaying,motionSlow,failedMotionVideos:[...failedMotionVideos],sketching,report,feedback,restoredFlash,picked,questOpen,use3d:can3d(),pinned:[...pinned],looked:[...looked],tilt,tiltable:typeof DeviceOrientationEvent!=='undefined',canGoBack:navigation.canGoBack});
function save(){
  s.stage=stage;s.step[stage]=step;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));storageOK=true;}catch{storageOK=false;}
  const status=document.querySelector('.save-label');if(status)status.textContent=storageOK?'이 기기 브라우저에 저장됨':'저장 공간 확인';
  const warning=document.querySelector('#storage-warning');
  if(!storageOK&&!warning)app.insertAdjacentHTML('afterbegin','<p id="storage-warning" role="alert">지금은 기록을 저장할 수 없어. 이 창을 닫지 말고 저장 공간을 확인해 줘.</p>');
  if(storageOK)warning?.remove();
}
// Keep long sets of records on named, persistent pages instead of stacking them.
const panelPages=new Map();
function setupPanels(){
  const tabs=(selector,childSelector,labels)=>{
    app.querySelectorAll(selector).forEach((host,group)=>{
      const panels=[...host.querySelectorAll(childSelector)];if(panels.length<2)return;
      const key=[screen,stage,step,commissionIndex,selector,group].join(':');
      let current=Math.min(panelPages.get(key)||0,panels.length-1);
      const nav=document.createElement('nav');nav.className='panel-tabs';nav.setAttribute('aria-label','내용 선택');
      panels.forEach((panel,i)=>{const button=document.createElement('button');button.type='button';button.className='btn quiet';button.textContent=labels?.[i]||panel.querySelector('h2,h3,b,legend')?.textContent||`${i+1}번 기록`;button.addEventListener('click',()=>{current=i;panelPages.set(key,i);update();});nav.append(button);});
      function update(){panels.forEach((p,i)=>{p.hidden=i!==current;nav.children[i].setAttribute('aria-pressed',String(i===current));});}
      host.prepend(nav);host.classList.add('paged-panel');update();
    });
  };
  tabs('.repair-wall',':scope > .repair-board');
  tabs('.broadcast-desk',':scope > .broadcast-strip');
  tabs('.lost-records',':scope > .lost-paper');
  tabs('.museum-exhibits',':scope > .museum-exhibit');
  tabs('.final-inventions',':scope > article');
  tabs('.request-lab-grid',':scope > section',['모양 시험','결과·이유']);
  tabs('.case-activity',':scope > section',step%2?['사는 곳','움직이는 방법']:['동물 선택','근거 연결']);
  tabs('.verify-steps',':scope > .verify-step',['검증','이유 찾기','기준 고치기']);
  tabs('.design-options',':scope > section',['문제 고르기','특징 관찰','부품 붙이기']);
  // A compact viewport switches the two complete lab panels without losing any inputs.
  if(typeof matchMedia==='function'&&matchMedia('(max-height: 600px), (max-width: 700px)').matches){
    tabs('.experiment-lab',':scope > section',['모양 시험','결과 비교']);
    tabs('.lab-summary',':scope > section',['결과 비교','내 생각']);
  }
}
function render(){
  storyPlayer?.destroy();storyPlayer=null;
  stopMotionFrame();
  motionPlayer?.destroy();motionPlayer=null;
  navigation.visit({screen,stage:['mission','reward','commission'].includes(screen)?stage:null,step:screen==='mission'?step:null,commissionIndex:screen==='commission'?commissionIndex:null});
  const active=document.activeElement,data=active?.dataset?.action?{...active.dataset}:null;
  map?.destroy();map=null;
  if(screen==='map')arrived=!isStageOpen(s,selectedStage)||s.mapPosition===String(selectedStage);
  const flashed=restoredFlash;app.innerHTML=header(s,view())+page(s,view());restoredFlash=null;
  setupPanels();
  const storyHost=app.querySelector?.('[data-story]');
  if(storyHost)storyPlayer=createStoryPlayer(storyHost,{onEnd:finishStory});
  // Every close-up photo opens large on tap (all animals, every screen that shows one).
  app.querySelectorAll?.('.detail-crop').forEach(el=>{el.dataset.action='photo-zoom';el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label','사진 크게 보기');});
  sync3d();
  mountMotionPlayer();
  if(!motionPlayer&&motionPlaying&&screen==='mission'&&stage===3&&step%2===0)startMotionFrame();
  if(screen==='map')map=createVillage(document.querySelector('#trail-world'),{position:s.mapPosition,completed:restoredPlaces(s),flash:flashed,onTalk:talk,onArrive(id){
    if(screen!=='map'||selectedStage!==id)return;arrived=true;s.mapPosition=String(id);
    // A building the learner picked opens as soon as Haru reaches its door; the walk after a restore only arrives.
    if(autoEnter&&isStageOpen(s,id)){autoEnter=false;save();enter(id);return;}document.querySelector('#quest-panel').innerHTML=questPanel(s,view());document.querySelector('#travel-text').textContent=`모리: ${STAGES[id-1].name}에 도착했어. 함께 탐험하자!`;save();
  }});
  // Right after a restore, stay by the building until it has lit up, then head to the next place.
  if(screen==='map'&&!arrived){const m=map;if(flashed&&typeof setTimeout==='function')setTimeout(()=>{if(map===m)m.move(selectedStage);},2400);else m.move(selectedStage);}
  if(data)[...app.querySelectorAll('[data-action]')].find(el=>Object.entries(data).every(([k,v])=>el.dataset[k]===v))?.focus({preventScroll:true});
  save();
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
      onPick(i){focusIndex=i;pinned.add(list[i].id);feedback=null;playSound(s.soundEnabled);render();document.querySelector('#announcer').textContent=`${list[i].label}에 관찰핀을 꽂았어.`;},
      onMiss(hint,pt){playSound(s.soundEnabled,'retry');toast(hint,tapAnchor(pt));}};}
  if(kind==='dome'){const list=DISCOVERIES.slice(round()*3,round()*3+3);
    return {zones:[...Object.keys(HABITATS),...Object.keys(DOME_ZONES)],names:Object.fromEntries([...Object.entries(HABITATS),...Object.entries(DOME_ZONES)].map(([id,h])=>[id,h.name])),active:DOME_ZONES[activeHabitat]?activeHabitat:(list.find(d=>d.habitat===activeHabitat)||list[0]).habitat,onFail:fail3d,
      extras:Object.entries(DOME_ZONES).map(([zone,z])=>({id:zone,animal:z.animal,habitat:zone,name:z.animalName,found:looked.has(zone)})),
      onLook(zone){if(!DOME_ZONES[zone])return;stopMotion();looked.add(zone);activeHabitat=zone;feedback=null;playSound(s.soundEnabled);render();document.querySelector('#announcer').textContent=DOME_ZONES[zone].text;},
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
function go(where){labSummary=false;autoEnter=false;picked=null;stopMotion();screen=where;feedback=null;report=null;stroke=null;render();document.querySelector('#announcer').textContent='';document.querySelector('#main')?.classList?.add('screen-enter');document.querySelector('#main')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
function say(text,good=false,wrong=[]){if(!good)playSound(s.soundEnabled,'retry');feedback={text,good,wrong};render();document.querySelector('#announcer').textContent=text;}
function modal(title,content){stopMotion();dialog.innerHTML=`<header class="dialog-heading"><h2 id="dialog-title">${title}</h2>${btn(icon('close'),'close-dialog','icon-btn quiet','aria-label="닫기"')}</header>${content}`;if(!dialog.open)dialog.showModal();}
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
function talk(npc,text,el){const next=STAGES.find(t=>!restoredPlaces(s).includes(t.id)&&isStageOpen(s,t.id));const line=text||(next?`다음은 ${next.name}이야. 건물을 누르면 같이 갈게!`:'다섯 기록을 모두 되찾았어. 캠프로 돌아가자!');const tip=document.querySelector('#travel-text');if(tip)tip.textContent=`${npc.name}: ${line}`;toast(line,el);}
function selectMap(id){
  if(!Number.isInteger(id)||!STAGES[id-1])return;selectedStage=id;arrived=!isStageOpen(s,id);
  document.querySelectorAll('.map-marker[data-action="map-select"]').forEach(el=>{el.classList.toggle('current',Number(el.dataset.id)===id);el.setAttribute('aria-pressed',String(Number(el.dataset.id)===id));});
  document.querySelector('#quest-panel').innerHTML=questPanel(s,view());
  if(isStageOpen(s,id)){autoEnter=true;document.querySelector('#travel-text').textContent='모리: 길을 따라갈게. 문 앞에 닿으면 바로 들어가자!';map.move(id);}
  else document.querySelector('#travel-text').textContent=`모리: ${id-1}장 기록을 먼저 되찾으면 이 길이 열려.`;
}
function enter(id,replay=false){
  if(!isStageOpen(s,id))return;stage=id;step=s.step[id]??Math.min(STAGES[id-1].tasks.length-1,countStage(s,id));
  if(s.completed.includes(id)){reviewActivities(id);return;}
  if(replay)step=0;
  if(step>0&&!s.activities.includes(`${id}-${step-1}`))step=Math.min(STAGES[id-1].tasks.length-1,countStage(s,id));
  selectedStage=id;activeHabitat='forest';zoom=false;focusIndex=0;clueIndex=0;sketching=false;if(stage===5){const d=s.designs[round()];if(!d.problem){d.problem=round()?(s.designs[0].problem==='protect'?'warm':'protect'):'swim';d.name=PROBLEMS[d.problem].product;}}go('mission');
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
  const result=claimTask(s,stage,step);if(!result.ok){const m=isStageOpen(s,stage)?taskMistake(s,stage,step):null;return say(m?.text||taskHint(stage,step),false,m?.wrong);}
  playSound(s.soundEnabled,true);
  if(step===STAGES[stage-1].tasks.length-1){save();openCommission(stage,campaignDone(s,stage,0)?1:0);return;}
  labSummary=false;step++;s.step[stage]=step;focusIndex=0;clueIndex=0;if(stage===5&&!s.designs[round()].problem){const d=s.designs[round()];d.problem=s.designs[0].problem==='protect'?'warm':'protect';d.name=PROBLEMS[d.problem].product;}feedback=null;
  report=null;zoom=false;sketching=false;activeHabitat='forest';render();window.scrollTo({top:0,behavior:'instant'});document.querySelector('#main')?.focus({preventScroll:true});document.querySelector('#announcer').textContent=result.fresh?'별 하나 받았어! 다음 탐구로 이어가자!':'다음 탐구로 이어가자!';if(result.fresh)flyStar();
}
// A new star pops in the middle of the screen, then flies into the top counter so the learner sees where it went.
function flyStar(){
  if(typeof document.createElement!=='function')return;
  const el=document.createElement('div'),target=document.querySelector('.star-count .icon')?.getBoundingClientRect();el.className='star-fly';el.setAttribute('aria-hidden','true');el.innerHTML=icon('star')+'<b>+1</b>';document.body.append(el);
  if(!el.animate||!target?.width||matchMedia('(prefers-reduced-motion: reduce)').matches){playSound(s.soundEnabled,'star');setTimeout(()=>el.remove(),900);return;}
  const dx=target.left+target.width/2-innerWidth/2,dy=target.top+target.height/2-innerHeight/2;
  el.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:0},{transform:'translate(-50%,-50%) scale(1.2)',opacity:1,offset:.25},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.55},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.2)`,opacity:.8}],{duration:1100,easing:'cubic-bezier(.5,0,.3,1)'}).onfinish=()=>{el.remove();playSound(s.soundEnabled,'star');document.querySelector('.star-count')?.animate?.([{transform:'scale(1)'},{transform:'scale(1.4)'},{transform:'scale(1)'}],{duration:380,easing:'ease-out'});};
}
function previous(){labSummary=false;stopMotion();if(step===0){go('map');return;}step--;report=null;zoom=false;sketching=false;feedback=null;render();window.scrollTo({top:0,behavior:'instant'});}
function back(){labSummary=false;stopMotion();
  let route=navigation.back();while(route&&((route.screen==='mission'&&!isStageOpen(s,route.stage))||(route.screen==='reward'&&!restoredPlaces(s).includes(route.stage))||(route.screen==='commission'&&!campaignOpen(s,route.stage,route.commissionIndex))||(route.screen==='ending'&&restoredPlaces(s).length!==5)))route=navigation.back();
  if(!route)return;screen=route.screen;if(route.stage)stage=route.stage;if(screen==='mission')step=route.step;if(screen==='commission')commissionIndex=route.commissionIndex;feedback=null;report=null;render();window.scrollTo({top:0,behavior:'instant'});
}
function settings(){modal('설정과 탐험 안내',settingsContent(s));}
function notebook(){modal('우리 탐험대의 가방',notebookContent(s));}
function tool(id){const t=STAGES[id-1];if(!t||!restoredPlaces(s).includes(id))return;if(!s.toolUses.includes(String(id)))s.toolUses.push(String(id));save();modal(`${icon(t.rewardIcon)} ${t.reward}`,id===1?lensTool('duck',2):toolContent(s,id));}
function lensTool(id,index){if(!Object.hasOwn(OBSERVATIONS,id))id='duck';const o=OBSERVATIONS[id][Math.max(0,Math.min(2,index))];return '<div class="inline-options">'+Object.keys(OBSERVATIONS).map(a=>btn(a==='frog'?'개구리':a==='crab'?'게':a==='duck'?'오리':'토끼','lens-animal',a===id?'selected':'quiet','data-id="'+a+'"')).join('')+'</div><div class="detail-crop tool-crop" style="--focus-x:'+o.x+';--focus-y:'+o.y+'">'+art(id)+'</div><p>'+o.text+'</p><div class="inline-options">'+OBSERVATIONS[id].map((o,i)=>btn(o.label,'lens-part','quiet','data-id="'+id+'" data-value="'+i+'"')).join('')+'</div>';}
function moveLens(e,surface){const label=document.querySelector('.lens-notes h2'),caption=document.querySelector('.lens-notes>p'),record=document.querySelector('.lens-notes [data-action=observe]');if(label)label.textContent='자유롭게 확대 중';if(caption)caption.textContent='관찰할 부분에서 손을 떼어 줘.';if(record)record.disabled=true;const box=surface.getBoundingClientRect(),x=Math.max(0,Math.min(100,(e.clientX-box.left)/box.width*100)),y=Math.max(0,Math.min(100,(e.clientY-box.top)/box.height*100));for(const el of [surface,document.querySelector('#lens-detail')]){if(el){el.style.setProperty('--focus-x',x);el.style.setProperty('--focus-y',y);}}}
function stopMotionFrame(){if(motionRAF!==null){window.cancelAnimationFrame(motionRAF);motionRAF=null;}}
function mountMotionPlayer(){
 const host=document.querySelector('.motion-observer');
 motionPlayer=createMotionPlayer(host,{phase:motionPhase,playing:motionPlaying,slow:motionSlow,
  onUpdate(state){motionPhase=state.phase;motionPlaying=state.playing;paintMotion();},
  onError(){failedMotionVideos.add(host.dataset.motion);motionPlaying=false;motionPhase=0;render();document.querySelector('#announcer').textContent=MOTIONS[host.dataset.motion]?.optional?'영상을 불러오지 못했어. 새로고침한 뒤 다시 살펴봐 줘.':'영상을 열 수 없어 움직임 설명 그림으로 바꿨어.';}
 });
}
function stopMotion(reset=true){stopMotionFrame();motionPlayer?.pause();motionPlaying=false;motionTime=0;if(reset){motionPhase=0;motionPlayer?.seek(0);}paintMotion();}
function paintMotion(){
 const host=document.querySelector('.motion-observer');if(!host)return;const id=host.dataset.motion;if(!Object.hasOwn(MOTIONS,id))return;
 const frame=motionPlayer?videoFrameAt(id,motionPhase):frameAt(motionPhase),svg=host.querySelector('.motion-model');if(svg)svg.outerHTML=motionDiagram(id,motionPhase);
 const caption=host.querySelector('.motion-caption');if(caption)caption.textContent=MOTIONS[id].frames[frame];
 const play=host.querySelector('[data-action="motion-play"]');if(play){play.textContent=motionPlaying?'멈춤':'재생';play.classList?.toggle('selected',motionPlaying);}
 const slow=host.querySelector('[data-action="motion-slow"]');if(slow)slow.textContent=motionSlow?'보통 속도':'느리게';
 const slider=host.querySelector('#motion-phase');if(slider)slider.value=motionPhase;
 host.querySelectorAll('[data-action="motion-frame"]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.frame)===frame));
}
function startMotionFrame(){if(typeof window.requestAnimationFrame!=='function')return;motionRAF=window.requestAnimationFrame(time=>{if(!motionPlaying||screen!=='mission'||stage!==3)return;const delta=motionTime?time-motionTime:0;motionTime=time;const old=frameAt(motionPhase);motionPhase=(motionPhase+delta/(motionSlow?100:40))%101;const slider=document.querySelector('#motion-phase');if(slider)slider.value=motionPhase;if(frameAt(motionPhase)!==old)paintMotion();startMotionFrame();});}
function download(){
  const lines=researchLines(s);
  const text=lines.join('\n');if(exportURL)URL.revokeObjectURL(exportURL);exportURL=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}));
  modal('나의 연구 기록 저장',`<p>모은 관찰과 작품별 발명 기록을 파일로 챙겨 가자!</p><textarea class="report-text" readonly aria-label="나의 연구 기록">${esc(text)}</textarea><div class="dialog-actions">${btn('닫기','close-dialog','secondary')}<a class="btn primary" id="report-download" download="하루와-모리-탐험기록.txt">${icon('download')} TXT 파일 받기</a></div>`);document.querySelector('#report-download').href=exportURL;
}
function openCommission(id,index=0){
  if(!isStageOpen(s,id)||!campaignOpen(s,id,index))return;stage=id;commissionIndex=index;evidenceOpen=false;go('commission');
}
function submitCommission(){
  const result=claimCommission(s,stage,commissionIndex);
  if(!result.ok)return say(campaignHint(s,stage,commissionIndex));
  playSound(s.soundEnabled,result.fresh?'stamp':'correct');
  if(commissionIndex===1){restoredFlash=stage;go('reward');return;}
  say(commissionIndex===2?'도전 도장을 받았어! 네 전시관에도 남겨 뒀어.':'첫 기록을 받았어! 이제 다른 상황에도 적용해 보자.',true);
}
function act(action,el){const id=el.dataset.id,value=el.dataset.value,key=el.dataset.key;
  switch(action){
    case 'home':go('home');break;
    case 'start':start();break;
    case 'story-intro':openStory('intro');break;
    case 'story-outro':if(restoredPlaces(s).length===5)openStory('outro');break;
    case 'story-skip':finishStory();break;
    case 'story-toggle':storyPlayer?.toggle();break;
    case 'story-fullscreen':storyFullscreen();break;
    case 'intro-done':s.introSeen=true;dialog.close();go('map');break;
    case 'map':if(screen==='reward')restoredFlash=stage;selectedStage=STAGES.find(t=>!restoredPlaces(s).includes(t.id)&&isStageOpen(s,t.id))?.id||5;arrived=true;go('map');break;
    case 'map-select':selectMap(Number(id));break;
    case 'quest-toggle':{questOpen=!questOpen;const page=document.querySelector('.map-page');page?.classList.toggle('quest-open',questOpen);el.setAttribute('aria-expanded',String(questOpen));el.innerHTML=icon(questOpen?'close':'book')+'<span>'+(questOpen?'닫기':'장소 정보')+'</span>';return;}
    case 'map-prev':case 'map-next':selectMap(Math.max(1,Math.min(5,selectedStage+(action==='map-prev'?-1:1))));break;
    case 'enter':enter(Number(id));break;
    case 'replay-stage':enter(Number(id),true);break;
    case 'review-activities':reviewActivities(Number(id)||stage);break;
    case 'review-open':reviewOpen(Number(id),Number(value));break;
    case 'commission-open':dialog.close();openCommission(Number(id),Number(value)||0);break;
    case 'commission-choice':if(screen==='commission'&&chooseCommission(s,stage,commissionIndex,key,value)){feedback=null;render();}break;
    case 'commission-sort':if(screen==='commission'&&chooseCommission(s,stage,commissionIndex,id,value)){picked=null;feedback=null;render();}break;
    case 'commission-submit':if(screen==='commission')submitCommission();break;
    case 'commission-next':if(screen==='commission'){if(commissionIndex===0)openCommission(stage,1);else if(commissionIndex===1)go('reward');else go('gallery');}break;
    case 'commission-evidence':if(screen==='commission'){evidenceOpen=!evidenceOpen;campaignDraft(s,stage,commissionIndex).usedTool=true;const toolId=stage===2?1:stage-1;if(restoredPlaces(s).includes(toolId)&&!s.toolUses.includes(String(toolId)))s.toolUses.push(String(toolId));render();}break;
    case 'commission-level':if(screen==='commission'&&[1,2,3].includes(Number(value))){const d=campaignDraft(s,stage,commissionIndex);d.level=Number(value);d.prediction='';feedback=null;render();}break;
    case 'commission-predict':if(screen==='commission'&&['more','same','less'].includes(value)){campaignDraft(s,stage,commissionIndex).prediction=value;feedback=null;render();}break;
    case 'commission-trial':if(screen==='commission'){if(!runCommissionTrial(s,stage,commissionIndex))say('시험 전에 결과를 예상해 줘. 예상은 틀려도 괜찮아.');else{feedback={good:true,text:'시험 결과를 표에 적었어. 두 항목을 함께 비교해 줘.'};render();}}break;
    case 'gallery':go('gallery');break;
    case 'advance':advance();break;
    case 'previous':previous();break;
    case 'nav-back':back();break;
    case 'inspect':focusIndex=Math.max(0,Math.min(2,Number(value)||0));render();break;
    case 'animal-tab':focusIndex=0;if(OBSERVE_PAIRS[round()].includes(id)){s.activeAnimal=id;zoom=false;feedback=null;render();}break;
    case 'observe':{const o=Object.values(OBSERVATIONS).flat().find(o=>o.id===id);if(!o)return;if(value&&value!=='right')return say(can3d()?`3D 표본에서 ${o.label} 부분을 다시 살펴봐. 본 모습과 다른 설명이야.`:`렌즈로 ${o.label} 부분을 다시 살펴봐. 그림과 다른 설명이야.`,false,['observe:'+value]);if(!s.observed.includes(id))s.observed.push(id);feedback=null;render();document.querySelector('#announcer').textContent='특징을 기록했어.';break;}
    case 'zoom':zoom=!zoom;render();break;
    case 'scan-reset':viewer?.call('reset');break;
    case 'dome-tilt':toggleTilt(el);break;
    case 'compare':{const c=s.compares[round()];for(const k of ['common','difference'])if(c[k]===value)delete c[k];if(['common','difference'].includes(key))c[key]=value;feedback=null;render();break;}
    case 'sort':if(!SORT_ANIMALS.includes(id))break;if(value==='pool')delete s.sorts[round()][id];else s.sorts[round()][id]=value;feedback=null;render();break;
    case 'criterion':if(round()===1&&s.criteria[1]!==value){s.sorts[1]={};s.inquiry.reclass[1]={prediction:'',revealed:false};s.inquiry.verify[1].checked='';}s.criteria[round()]=value;feedback=null;render();break;
    case 'habitat':stopMotion();if(Object.hasOwn(HABITATS,id)||(can3d()&&Object.hasOwn(DOME_ZONES,id)))activeHabitat=id;feedback=null;render();break;
    case 'discover':{const d=DISCOVERIES.find(x=>x.id===id);if(!d)return;if(!s.discovered.includes(id))s.discovered.push(id);feedback=null;render();break;}
    case 'link':{if(!['frog','crab'].includes(id))break;const l=s.links[id],kind=el.dataset.kind;if(key==='pool'){for(const k of Object.keys(l))if(l[k]===value)delete l[k];}else if(['environment','body','life'].includes(key)){if(kind&&kind!==key)return say(`이 칸에는 ‘${{environment:'사는 곳',body:'몸의 특징',life:'움직이는 방법'}[key]}’ 카드가 들어가.`);l[key]=value;}feedback=null;render();break;}
    case 'pick':picked=picked?.ref===el.dataset.ref?null:{...el.dataset};render();break;
    case 'place':{if(!picked){toast('먼저 옮길 카드를 눌러 줘.',el);break;}const {action,dataset}=dropData(picked,el.dataset);picked=null;act(action,{dataset});return;}
    case 'case-animal':s.cases[round()].candidate=id;feedback=null;render();break;
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
    case 'design-part':{const d=s.designs[round()];if(key==='pool'){if(d.structure===value){d.structure='';d.spot='';}}else if(PRODUCTS[d.problem]?.spots.some(x=>x[0]===key)&&STRUCTURES.some(x=>x[0]===value)){d.structure=value;d.spot=key;}else break;d.explanation='';report=null;feedback=null;render();break;}
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
    case 'clue-open':clueIndex=Math.max(0,Math.min(4,Number(value)||0));render();break;
    case 'motion-play':motionPlaying=!motionPlaying;motionTime=0;if(motionPlayer){if(motionPlaying)motionPlayer.play();else motionPlayer.pause();paintMotion();}else render();break;
    case 'motion-slow':motionSlow=!motionSlow;if(motionPlayer){motionPlayer.setSlow(motionSlow);paintMotion();}else render();break;
    case 'motion-frame':stopMotion(false);motionPhase=Number(value)||0;if(motionPlayer){motionPlayer.seek(motionPhase);paintMotion();}else render();break;
    case 'motion-predict':if(Object.hasOwn(MOTIONS,id)&&['part','other'].includes(value)){s.inquiry.motionPredictions[id]=value;feedback=null;render();}break;
    case 'motion-capture':if(Object.hasOwn(MOTIONS,id)){
      if(!s.inquiry.motionPredictions[id]){say('먼저 어떤 몸 부분이 움직임을 도울지 예상해 골라 봐. 틀려도 괜찮아.');break;}
      if(motionPlayer&&!motionPlayer.ready){document.querySelector('#announcer').textContent='영상 장면을 불러오는 중이야. 잠깐 기다려 줘.';break;}
      stopMotion(false);const m=MOTIONS[id],frame=motionPlayer?videoFrameAt(id,motionPhase):frameAt(motionPhase);
      if(frame!==m.target)return say(`이 장면은 ‘${m.frames[frame]}’ 장면이야. ${m.goal}을 찾아 멈춰 봐. 이전에 남긴 기록은 그대로야.`);
      s.inquiry.motion[id]=MOTION_KEY_FRAME;s.inquiry.motionEvidence[id]={frame,phase:motionPhase,source:motionPlayer?'video':'diagram'};save();say(`찾았어! 내 예상과 관찰한 몸 부분을 비교해 봐.`,true);
    }break;
    case 'lab-summary':if(!comparisonReady(s.designs[round()]))return say('지금 모양도 시험해 줘. 서로 다른 두 모양의 결과가 필요해.');labSummary=true;feedback=null;render();break;
    case 'lab-back':labSummary=false;render();break;
    case 'experiment-level':s.designs[round()].experiment.level=Math.max(1,Math.min(3,Number(value)||1));s.designs[round()].experiment.reflection='';render();break;
    case 'prediction':s.designs[round()].experiment.prediction=value;render();break;
    case 'reflection':s.designs[round()].experiment.reflection=value;render();break;
    case 'experiment-run':{const d=s.designs[round()];if(!d.experiment.sourceSeen||!d.experiment.prediction){say('동물 특징을 먼저 기록하고, 결과를 예상해 줘.');break;}report=recordTrial(s,round());if(!report.passed){say('시험해 보니 맞지 않는 조건이 있어. 점검표를 보고 설계를 고쳐 봐.');break;}if(!addExperimentTrial(d)){say('동물 특징을 먼저 기록하고, 결과를 예상해 줘.');break;}feedback=null;render();break;}
    case 'feature-zoom':{if(!['web','shell','fur'].includes(el.dataset.kind))break;modal('동물 특징 크게 보기',`<div class="feature-enlargement">${anatomy(el.dataset.kind)}</div><div class="dialog-actions">${btn('닫기','close-dialog','primary')}</div>`);break;}
    case 'photo-zoom':{const img=el.querySelector('img');if(!img)break;const x=el.style.getPropertyValue('--focus-x')||50,y=el.style.getPropertyValue('--focus-y')||50;modal('사진 크게 보기',`<div class="photo-zoom"><div class="detail-crop zoom-crop" style="--focus-x:${Number(x)};--focus-y:${Number(y)}"><img src="${esc(img.src)}" alt="${esc(img.alt)} 확대"></div><figure class="zoom-whole"><img src="${esc(img.src)}" alt="${esc(img.alt)} 전체"><span class="zoom-ring" style="left:${Number(x)}%;top:${Number(y)}%"></span><figcaption>전체 모습에서 동그라미가 확대한 곳이야.</figcaption></figure></div><div class="dialog-actions">${btn('닫기','close-dialog','primary')}</div>`);break;}
    case 'lens-animal':modal('확대 관찰',lensTool(id,0));break;
    case 'lens-part':modal('확대 관찰',lensTool(id,Number(value)||0));break;
    case 'notebook':notebook();break;
    case 'tool':tool(Number(id));break;
    case 'settings':settings();break;
    case 'sound':s.soundEnabled=!s.soundEnabled;if(!s.soundEnabled)silence();else playSound(true);render();if(dialog.open)settings();break;
    case 'admin':s.adminUnlocked=!s.adminUnlocked;if(screen==='mission'&&!isStageOpen(s,stage))go('map');else render();settings();break;
    case 'close-dialog':dialog.close();break;
    case 'reset-confirm':modal('탐험 기록을 처음부터 시작할까?',`<p>이 브라우저의 관찰·탐험 별·발명·이전 기록이 지워져.</p><div class="dialog-actions">${btn('계속 탐험할래','close-dialog','secondary')}${btn('처음부터 시작','reset','primary')}</div>`);break;
    case 'reset':stopMotion();focusIndex=0;clueIndex=0;s=freshExpedition();ensureCampaign(s);commissionIndex=0;evidenceOpen=false;navigation.reset();stage=1;step=0;selectedStage=1;activeHabitat='forest';zoom=false;sketching=false;stroke=null;dialog.close();go('home');break;
    case 'ending':if(restoredPlaces(s).length===5)go('ending');break;
    case 'download':download();break;
    case 'retry-images':render();break;
  }
  save();
}
let toastTimer=0;
// Shown as a bubble right above the tapped button, so it never hides the control the learner needs next.
function toast(text,anchor){let t=document.querySelector('#hint-toast');if(!t){t=document.createElement('div');t.id='hint-toast';t.className='hint-toast';t.setAttribute('role','status');document.body.append(t);}t.textContent=text;const b=anchor?.getBoundingClientRect?.();if(b){const half=t.offsetWidth/2;t.style.left=Math.min(innerWidth-16-half,Math.max(16+half,b.left+b.width/2))+'px';t.style.top=Math.max(72,b.top-10)+'px';}t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600);}
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;if(el.getAttribute('aria-disabled')==='true'){toast(el.dataset.why||'아직 누를 수 없어.',el);return;}if(el.dataset.action!=='sound')playSound(s.soundEnabled);act(el.dataset.action,el);});
document.addEventListener('input',e=>{
  if(e.target.id==='experiment-note'||e.target.id==='peer-note'){s.designs[round()].experiment[e.target.id==='peer-note'?'peer':'note']=e.target.value.slice(0,180);save();return;}
  if(e.target.id==='experiment-level'){s.designs[round()].experiment.level=Number(e.target.value);s.designs[round()].experiment.reflection='';const label=document.querySelector('#level-label');if(label)label.textContent=EXPERIMENTS[s.designs[round()].problem].levels[Number(e.target.value)-1];const model=document.querySelector('.current-model');if(model)model.innerHTML=experimentDiagram(s.designs[round()].problem,Number(e.target.value),false);save();return;}
  if(e.target.id==='motion-phase'){const next=Number(e.target.value);stopMotion(false);motionPhase=next;motionPlayer?.seek(next);paintMotion();save();return;}
  if(e.target.id==='invention-name'){const d=s.designs[round()];d.name=e.target.value.slice(0,24);document.querySelector('#design-title').textContent=d.name||PROBLEMS[d.problem]?.product||'어떤 물건을 만들까?';save();}});
document.addEventListener('change',e=>{if(['experiment-level','motion-phase'].includes(e.target.id))render();});
function sketchPoint(e,svg){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return [Math.round(Math.max(0,Math.min(320,p.x))),Math.round(Math.max(0,Math.min(260,p.y)))];}
document.addEventListener('pointerdown',e=>{const surface=e.target.closest?.('#lens-surface');if(surface&&!e.target.closest('[data-action]')){e.preventDefault();lensPointer={surface,id:e.pointerId};surface.setPointerCapture(e.pointerId);moveLens(e,surface);return;}if(e.target.id==='motion-phase')stopMotion(false);if(e.target.id!=='drawing-surface'||!sketching||stage!==5||step%2!==0)return;e.preventDefault();const svg=e.target.closest('svg'),d=s.designs[round()];if(d.strokes.length>=30)return say('선은 30개까지야. 마지막 선을 지우고 다시 그려 줘.');const points=[sketchPoint(e,svg)],line=document.createElementNS('http://www.w3.org/2000/svg','polyline');d.strokes.push(points);line.setAttribute('points',points[0].join(','));svg.querySelector('#sketch-lines').append(line);svg.setPointerCapture(e.pointerId);stroke={svg,points,line,id:e.pointerId};});
document.addEventListener('pointermove',e=>{if(lensPointer&&e.pointerId===lensPointer.id){moveLens(e,lensPointer.surface);return;}if(!stroke||e.pointerId!==stroke.id)return;e.preventDefault();if(stroke.points.length<250){stroke.points.push(sketchPoint(e,stroke.svg));stroke.line.setAttribute('points',stroke.points.map(p=>p.join(',')).join(' '));}});
for(const name of ['pointerup','pointercancel'])document.addEventListener(name,e=>{if(lensPointer&&e.pointerId===lensPointer.id){const animalId=lensPointer.surface.dataset.animal,list=OBSERVATIONS[animalId],x=Number(lensPointer.surface.style.getPropertyValue('--focus-x')),y=Number(lensPointer.surface.style.getPropertyValue('--focus-y'));focusIndex=list.reduce((best,o,i)=>(o.x-x)**2+(o.y-y)**2<(list[best].x-x)**2+(list[best].y-y)**2?i:best,0);lensPointer=null;render();}if(stroke&&e.pointerId===stroke.id){stroke=null;save();}});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target?.matches?.('[role=button][data-action]')){e.preventDefault();e.target.click();return;}if(dialog.open||screen!=='map'||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();selectMap(Math.max(1,Math.min(5,selectedStage+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1))));});
document.addEventListener('error',e=>{if(e.target.tagName!=='IMG'||!e.target.dataset.image)return;e.target.classList.add('image-failed');if(!document.querySelector('#asset-warning'))app.insertAdjacentHTML('afterbegin','<p id="asset-warning" role="status">그림을 불러오지 못했어. 연결을 확인하고 <button data-action="retry-images">그림 다시 보기</button>를 눌러 줘.</p>');},true);
dialog.addEventListener('close',()=>{if(exportURL){URL.revokeObjectURL(exportURL);exportURL=null;}});
if(typeof window.addEventListener==='function'){const resize=()=>document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||window.innerHeight)+'px');window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);resize();document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMotion(false);storyPlayer?.pause();silence();}});}
enableDrag(app,(card,zone)=>{const {action,dataset}=dropData(card,zone);picked=null;playSound(s.soundEnabled);act(action,{dataset});});
render();
