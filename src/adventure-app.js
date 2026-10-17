import {normalizeExperiment,addExperimentTrial,comparisonReady,EXPERIMENTS,frameAt,MOTIONS,MOTION_KEY_FRAME} from './inquiry.js';
import {motionView,motionDiagram,experimentDiagram,anatomy} from './inquiry-views.js';
import {STAGES,OBSERVATIONS,OBSERVE_PAIRS,HABITATS,DISCOVERIES,CASES,FEATURES,STRUCTURES,PROBLEMS,STORAGE_KEY,freshExpedition,restoreExpedition,isStageOpen,countStage,claimTask,taskHint,taskMistake,recordTrial,reportDesigns} from './expedition.js';
import {art,mori,icon,btn,esc} from './presentation.js';
import {header,page,questPanel,settingsContent,notebookContent,toolContent} from './shell-views.js';
import {createTrailMap} from './trail-map.js';
import {createNavigation} from './navigation.js';
import {playSound,silence} from './audio.js';

const app=document.querySelector('#app'),dialog=document.querySelector('#dialog'),navigation=createNavigation();
let s,storageOK=true;
try{s=restoreExpedition(localStorage.getItem(STORAGE_KEY));}catch{s=freshExpedition();storageOK=false;}
let screen='home',stage=s.stage,step=s.step[stage]||0,selectedStage=stage,feedback=null,map=null,arrived=true,activeHabitat='forest',zoom=false,labSummary=false,focusIndex=0,clueIndex=0,motionPhase=0,motionPlaying=false,motionSlow=false,motionRAF=null,motionTime=0,lensPointer=null,sketching=false,stroke=null,report=null,exportURL=null,restoredFlash=null;
const round=()=>Math.floor(step/2);
const view=()=>({screen,stage,step,selectedStage,arrived,activeHabitat,zoom,labSummary,focusIndex,clueIndex,motionPhase,motionPlaying,motionSlow,sketching,report,feedback,restoredFlash,canGoBack:navigation.canGoBack});
function save(){
  s.stage=stage;s.step[stage]=step;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));storageOK=true;}catch{storageOK=false;}
  const status=document.querySelector('.save-label');if(status)status.textContent=storageOK?'기록 저장됨':'저장 공간 확인';
  const warning=document.querySelector('#storage-warning');
  if(!storageOK&&!warning)app.insertAdjacentHTML('afterbegin','<p id="storage-warning" role="alert">지금은 기록을 저장할 수 없어. 이 창을 닫지 말고 저장 공간을 확인해 줘.</p>');
  if(storageOK)warning?.remove();
}
function render(){
  stopMotionFrame();
  navigation.visit({screen,stage:['mission','reward'].includes(screen)?stage:null,step:screen==='mission'?step:null});
  const active=document.activeElement,data=active?.dataset?.action?{...active.dataset}:null;
  map?.destroy();map=null;
  if(screen==='map')arrived=!isStageOpen(s,selectedStage)||s.mapPosition===String(selectedStage);
  app.innerHTML=header(s,view())+page(s,view());restoredFlash=null;
  // Tablet landscape can clip the last choice inside the panel; show a cue while more is below.
  const ws=app.querySelector?.('.activity-workspace');if(ws){const cue=()=>ws.classList.toggle('more',ws.scrollHeight-ws.scrollTop-ws.clientHeight>8);ws.addEventListener('scroll',cue,{passive:true});cue();setTimeout(cue,600);}
  if(motionPlaying&&screen==='mission'&&stage===3&&step%2===0)startMotionFrame();
  if(screen==='map')map=createTrailMap(document.querySelector('#trail-world'),{position:s.mapPosition,onArrive(id){
    if(screen!=='map'||selectedStage!==id)return;arrived=true;s.mapPosition=String(id);document.querySelector('#quest-panel').innerHTML=questPanel(s,view());document.querySelector('#travel-text').textContent=`모리: ${STAGES[id-1].name}에 도착했어. 함께 탐험하자!`;save();
  }});
  if(screen==='map'&&!arrived)map.move(selectedStage);
  if(data)[...app.querySelectorAll('[data-action]')].find(el=>Object.entries(data).every(([k,v])=>el.dataset[k]===v))?.focus({preventScroll:true});
  save();
}
// FLIP: cards glide from their old group to the new one, so a changed criterion visibly regroups the same animals.
function groupRects(){return new Map([...document.querySelectorAll('.group-animal[data-id]')].map(el=>[el.dataset.id,el.getBoundingClientRect()]));}
function flipGroups(before){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('.group-animal[data-id]').forEach(el=>{const a=before.get(el.dataset.id),b=el.getBoundingClientRect();if(!a)return;const dx=a.left-b.left,dy=a.top-b.top;if(Math.abs(dx)+Math.abs(dy)<2)return;const moved=el.classList.contains('moved');
    el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:`translate(${dx/2}px,${dy/2-(moved?46:0)}px) scale(${moved?1.15:1})`,offset:.5},{transform:'none'}],{duration:moved?950:600,delay:moved?200:0,easing:'cubic-bezier(.3,.7,.2,1)',fill:'backwards'});});
}
function go(where){labSummary=false;stopMotion();screen=where;feedback=null;report=null;stroke=null;render();document.querySelector('#main')?.classList?.add('screen-enter');document.querySelector('#main')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
function say(text,good=false,wrong=[]){feedback={text,good,wrong};render();document.querySelector('#announcer').textContent=text;}
function modal(title,content){stopMotion();dialog.innerHTML=`<header class="dialog-heading"><h2 id="dialog-title">${title}</h2>${btn(icon('close'),'close-dialog','icon-btn quiet','aria-label="닫기"')}</header>${content}`;if(!dialog.open)dialog.showModal();}
function start(){
  if(s.introSeen){go('map');return;}
  modal('우리 탐험대에 온 걸 환영해!',`<div class="intro-team">${art('explorer','',true)}${mori(1)}</div><p class="dialog-lead"><b>하루</b>는 너와 함께 탐험하고,<br><b>모리</b>는 발견한 사실을 기록해.</p><p>다섯 장소의 뒤섞인 동물 기록을 되찾아 줘. 장소를 되찾을 때마다 탐사 도구를 하나씩 받아. 다섯 개를 모두 모아 보자!</p><div class="dialog-actions">${btn('함께 길 따라 출발! '+icon('arrow'),'intro-done','primary')}</div>`);
}
function selectMap(id){
  if(!Number.isInteger(id)||!STAGES[id-1])return;selectedStage=id;arrived=!isStageOpen(s,id);
  document.querySelectorAll('.map-marker').forEach(el=>{el.classList.toggle('current',Number(el.dataset.id)===id);el.setAttribute('aria-pressed',String(Number(el.dataset.id)===id));});
  document.querySelector('#quest-panel').innerHTML=questPanel(s,view());
  if(isStageOpen(s,id)){document.querySelector('#travel-text').textContent='모리: 길을 따라갈게. 조금만 기다려!';map.move(id);}
  else document.querySelector('#travel-text').textContent=`모리: ${id-1}장 기록을 먼저 되찾으면 이 길이 열려.`;
}
function enter(id){
  if(!isStageOpen(s,id))return;stage=id;step=s.step[id]??Math.min(3,countStage(s,id));
  if(step>0&&!s.activities.includes(`${id}-${step-1}`))step=Math.min(3,countStage(s,id));
  selectedStage=id;activeHabitat='forest';zoom=false;focusIndex=0;clueIndex=0;sketching=false;if(stage===5){const d=s.designs[round()];if(!d.problem){d.problem=round()?(s.designs[0].problem==='protect'?'warm':'protect'):'swim';d.name=PROBLEMS[d.problem].product;}}go('mission');
}
function advance(){
  stopMotion();
  const result=claimTask(s,stage,step);if(!result.ok){const m=isStageOpen(s,stage)?taskMistake(s,stage,step):null;return say(m?.text||taskHint(stage,step),false,m?.wrong);}
  playSound(s.soundEnabled,true);
  if(step===3){save();go('reward');if(typeof setTimeout==='function')setTimeout(()=>{if(screen==='reward')playSound(s.soundEnabled,'fanfare');},2000);return;}
  labSummary=false;step++;s.step[stage]=step;focusIndex=0;clueIndex=0;if(stage===5&&!s.designs[round()].problem){const d=s.designs[round()];d.problem=s.designs[0].problem==='protect'?'warm':'protect';d.name=PROBLEMS[d.problem].product;}feedback=null;
  report=null;zoom=false;sketching=false;activeHabitat='forest';if(result.fresh)feedback={good:true,text:'좋아! 별 하나 받았어. 다음 탐구도 해 보자.'};render();window.scrollTo({top:0,behavior:'instant'});document.querySelector('#main')?.focus({preventScroll:true});document.querySelector('#announcer').textContent=result.fresh?'별 하나 받았어! 다음 탐구로 이어가자!':'다음 탐구로 이어가자!';if(result.fresh)flyStar();
}
// A new star pops in the middle of the screen, then flies into the top counter so the learner sees where it went.
function flyStar(){
  if(typeof document.createElement!=='function')return;
  const el=document.createElement('div'),target=document.querySelector('.star-count .icon')?.getBoundingClientRect();el.className='star-fly';el.setAttribute('aria-hidden','true');el.innerHTML=icon('star')+'<b>+1</b>';document.body.append(el);
  if(!el.animate||!target?.width||matchMedia('(prefers-reduced-motion: reduce)').matches){setTimeout(()=>el.remove(),900);return;}
  const dx=target.left+target.width/2-innerWidth/2,dy=target.top+target.height/2-innerHeight/2,count=document.querySelector('.star-count b'),total=count?.textContent;if(count)count.textContent=Number(total)-1;
  el.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:0},{transform:'translate(-50%,-50%) scale(1.2)',opacity:1,offset:.25},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.55},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.2)`,opacity:.8}],{duration:1100,easing:'cubic-bezier(.5,0,.3,1)'}).onfinish=()=>{el.remove();if(count)count.textContent=total;document.querySelector('.star-count')?.animate?.([{transform:'scale(1)'},{transform:'scale(1.4)'},{transform:'scale(1)'}],{duration:380,easing:'ease-out'});};
}
function previous(){labSummary=false;stopMotion();if(step===0){go('map');return;}step--;report=null;zoom=false;sketching=false;feedback=null;render();window.scrollTo({top:0,behavior:'instant'});}
function back(){labSummary=false;stopMotion();
  let route=navigation.back();while(route&&((route.screen==='mission'&&!isStageOpen(s,route.stage))||(route.screen==='reward'&&!s.completed.includes(route.stage))||(route.screen==='ending'&&s.completed.length!==5)))route=navigation.back();
  if(!route)return;screen=route.screen;if(route.stage)stage=route.stage;if(screen==='mission')step=route.step;feedback=null;report=null;render();window.scrollTo({top:0,behavior:'instant'});
}
function settings(){modal('설정과 탐험 안내',settingsContent(s));}
function notebook(){modal('우리 탐험대의 가방',notebookContent(s));}
function tool(id){const t=STAGES[id-1];if(!t||!s.completed.includes(id))return;if(!s.toolUses.includes(String(id)))s.toolUses.push(String(id));save();modal(`${icon(t.rewardIcon)} ${t.reward}`,id===1?lensTool('duck',2):toolContent(s,id));}
function lensTool(id,index){if(!Object.hasOwn(OBSERVATIONS,id))id='duck';const o=OBSERVATIONS[id][Math.max(0,Math.min(2,index))];return '<div class="inline-options">'+Object.keys(OBSERVATIONS).map(a=>btn(a==='frog'?'개구리':a==='crab'?'게':a==='duck'?'오리':'토끼','lens-animal',a===id?'selected':'quiet','data-id="'+a+'"')).join('')+'</div><div class="detail-crop tool-crop" style="--focus-x:'+o.x+';--focus-y:'+o.y+'">'+art(id)+'</div><p>'+o.text+'</p><div class="inline-options">'+OBSERVATIONS[id].map((o,i)=>btn(o.label,'lens-part','quiet','data-id="'+id+'" data-value="'+i+'"')).join('')+'</div>';}
function moveLens(e,surface){const label=document.querySelector('.lens-notes h2'),caption=document.querySelector('.lens-notes>p'),record=document.querySelector('.lens-notes [data-action=observe]');if(label)label.textContent='자유롭게 확대 중';if(caption)caption.textContent='관찰할 부분에서 손을 떼어 줘.';if(record)record.disabled=true;const box=surface.getBoundingClientRect(),x=Math.max(0,Math.min(100,(e.clientX-box.left)/box.width*100)),y=Math.max(0,Math.min(100,(e.clientY-box.top)/box.height*100));for(const el of [surface,document.querySelector('#lens-detail')]){if(el){el.style.setProperty('--focus-x',x);el.style.setProperty('--focus-y',y);}}}
function stopMotionFrame(){if(motionRAF!==null){window.cancelAnimationFrame(motionRAF);motionRAF=null;}}
function stopMotion(reset=true){stopMotionFrame();motionPlaying=false;motionTime=0;if(reset)motionPhase=0;paintMotion();}
function paintMotion(){const host=document.querySelector('.motion-observer');if(!host)return;const id=host.dataset.motion;if(!Object.hasOwn(MOTIONS,id))return;const svg=host.querySelector('.motion-model');if(svg)svg.outerHTML=motionDiagram(id,motionPhase);const caption=host.querySelector('.motion-caption');if(caption)caption.textContent=MOTIONS[id].frames[frameAt(motionPhase)];const play=host.querySelector('[data-action="motion-play"]');if(play)play.textContent=motionPlaying?'멈춤':'재생';const slider=host.querySelector('#motion-phase');if(slider)slider.value=motionPhase;host.querySelectorAll('[data-action="motion-frame"]').forEach(b=>b.classList.toggle('selected',Math.floor(Number(b.dataset.value)/34)===frameAt(motionPhase)));}
function startMotionFrame(){if(typeof window.requestAnimationFrame!=='function')return;motionRAF=window.requestAnimationFrame(time=>{if(!motionPlaying||screen!=='mission'||stage!==3)return;const delta=motionTime?time-motionTime:0;motionTime=time;const old=frameAt(motionPhase);motionPhase=(motionPhase+delta/(motionSlow?100:40))%101;const slider=document.querySelector('#motion-phase');if(slider)slider.value=motionPhase;if(frameAt(motionPhase)!==old)paintMotion();startMotionFrame();});}
function download(){
  const lines=['동물기록 복구작전 — 하루와 모리의 탐험 기록',`탐험 별 ${s.activities.length}/20 · 복구 장소 ${s.completed.length}/5`,'',...STAGES.map(t=>`${t.name}: ${countStage(s,t.id)}/4 활동`),'','[관찰한 특징]',...Object.values(OBSERVATIONS).flat().filter(o=>s.observed.includes(o.id)).map(o=>o.text),'','[발견한 환경]',...DISCOVERIES.filter(d=>s.discovered.includes(d.id)).map(d=>d.text),'','[동물 안내 카드]',...CASES.filter((_,i)=>s.activities.includes(`4-${i*2+1}`)).map(c=>c.sentence),'','[나의 발명]',...reportDesigns(s).flatMap((d,i)=>[`발명 ${i+1}: ${d.name}`,`문제: ${PROBLEMS[d.problem]?.name||'선택 전'}`,`특징: ${FEATURES.find(x=>x[0]===d.feature)?.[1]||''}`,`구조: ${STRUCTURES.find(x=>x[0]===d.structure)?.[1]||''}`,`시험 ${d.trials.length}회 · 설계선 ${d.strokes.length}개`,PROBLEMS[d.problem]?.reason||'',...d.experiment.trials.map(t=>'비교 시험'+': '+(EXPERIMENTS[t.problem]?.levels[t.level-1]||'')+' · 예상 '+(EXPERIMENTS[t.problem]?.predictions.find(x=>x[0]===t.prediction)?.[1]||'')),'알게 된 점: '+d.experiment.note,'친구 의견: '+d.experiment.peer,'']),'[친구와 이야기해 봐]','어떤 동물의 특징을 빌렸어?','첫 시험에서 무엇을 고쳤어?','친구의 발명과 내 발명은 어떻게 다를까?'];
  const text=lines.join('\n');if(exportURL)URL.revokeObjectURL(exportURL);exportURL=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}));
  modal('나의 연구 기록 저장',`<p>모은 관찰과 두 발명을 파일로 챙겨 가자!</p><textarea class="report-text" readonly aria-label="나의 연구 기록">${esc(text)}</textarea><div class="dialog-actions">${btn('닫기','close-dialog','secondary')}<a class="btn primary" id="report-download" download="하루와-모리-탐험기록.txt">${icon('download')} TXT 파일 받기</a></div>`);document.querySelector('#report-download').href=exportURL;
}
function act(action,el){const id=el.dataset.id,value=el.dataset.value,key=el.dataset.key;
  switch(action){
    case 'home':go('home');break;
    case 'start':start();break;
    case 'intro-done':s.introSeen=true;dialog.close();go('map');break;
    case 'map':if(screen==='reward')restoredFlash=stage;selectedStage=STAGES.find(t=>!s.completed.includes(t.id)&&isStageOpen(s,t.id))?.id||5;arrived=true;go('map');break;
    case 'map-select':selectMap(Number(id));break;
    case 'map-prev':case 'map-next':selectMap(Math.max(1,Math.min(5,selectedStage+(action==='map-prev'?-1:1))));break;
    case 'enter':enter(Number(id));break;
    case 'advance':advance();break;
    case 'previous':previous();break;
    case 'nav-back':back();break;
    case 'inspect':focusIndex=Math.max(0,Math.min(2,Number(value)||0));render();break;
    case 'animal-tab':focusIndex=0;if(OBSERVE_PAIRS[round()].includes(id)){s.activeAnimal=id;zoom=false;feedback=null;render();}break;
    case 'observe':{const o=Object.values(OBSERVATIONS).flat().find(o=>o.id===id);if(!o)return;if(value&&value!=='right')return say(`렌즈로 ${o.label} 부분을 다시 살펴봐. 그림과 다른 설명이야.`,false,['observe:'+value]);if(!s.observed.includes(id))s.observed.push(id);feedback=null;render();document.querySelector('#announcer').textContent='특징을 기록했어.';break;}
    case 'zoom':zoom=!zoom;render();break;
    case 'compare':if(['common','difference'].includes(key))s.compares[round()][key]=value;feedback=null;render();break;
    case 'sort':s.sorts[round()][id]=value;feedback=null;render();break;
    case 'criterion':if(round()===1&&s.criteria[1]!==value){s.sorts[1]={};s.inquiry.reclass[1]={prediction:'',revealed:false};}s.criteria[round()]=value;feedback=null;render();break;
    case 'habitat':stopMotion();if(Object.hasOwn(HABITATS,id))activeHabitat=id;feedback=null;render();break;
    case 'discover':{const d=DISCOVERIES.find(x=>x.id===id);if(!d)return;if(!s.discovered.includes(id))s.discovered.push(id);feedback=null;render();break;}
    case 'link':if(['frog','crab'].includes(id)&&['environment','body','life'].includes(key))s.links[id][key]=value;feedback=null;render();break;
    case 'case-trait':{const a=s.cases[round()];if(a.traits.includes(value))a.traits=a.traits.filter(v=>v!==value);else if(a.traits.length<2)a.traits.push(value);else return say('특징은 두 개야. 바꾸고 싶은 카드를 먼저 눌러 빼 줘.');feedback=null;render();break;}
    case 'case-animal':s.cases[round()].candidate=id;feedback=null;render();break;
    case 'case-reset':s.inquiry.evidence[round()]=[];clueIndex=0;s.cases[round()].traits=[];s.cases[round()].candidate='';feedback=null;render();break;
    case 'case-habitat':s.cases[round()].habitat=value;feedback=null;render();break;
    case 'case-reason':s.cases[round()].reason=value;feedback=null;render();break;
    case 'design-problem':{const d=s.designs[round()];if(!Object.hasOwn(PROBLEMS,value)||(round()&&value===s.designs[0].problem))return;if(d.problem!==value)d.experiment=normalizeExperiment();d.problem=value;if(!d.name||Object.values(PROBLEMS).some(p=>p.product===d.name))d.name=PROBLEMS[value].product;d.feature='';d.structure='';d.explanation='';report=null;feedback=null;render();break;}
    case 'source-seen':s.designs[round()].experiment.sourceSeen=true;feedback={good:true,text:'이 특징을 물건의 어느 부분에 쓸까?'};render();break;
    case 'design-choice':if(['feature','structure'].includes(key))s.designs[round()][key]=value;s.designs[round()].explanation='';report=null;feedback=null;render();break;
    case 'sketch-toggle':sketching=!sketching;render();break;
    case 'sketch-undo':s.designs[round()].strokes.pop();render();break;
    case 'test':report=recordTrial(s,round());feedback={good:report.passed,text:report.passed?'특징과 구조가 연결됐어! 이제 아래 설명 카드도 골라 봐.':'바꿀 부분을 찾은 거야! 설계를 고쳐 다시 시험해 봐.'};render();break;
    case 'explain':s.designs[round()].explanation=value;feedback=null;render();break;
    case 'sort-predict':s.inquiry.reclass[round()].prediction=value;s.inquiry.reclass[round()].revealed=false;render();break;
    case 'sort-reveal':{const before=groupRects();if(s.inquiry.reclass[round()].prediction)s.inquiry.reclass[round()].revealed=true;render();flipGroups(before);break;}
    case 'sort-before':{const before=groupRects();s.inquiry.reclass[round()].revealed=false;render();flipGroups(before);break;}
    case 'clue-open':clueIndex=Number(value)===1?1:0;render();break;
    case 'clue-save':{const c=CASES[round()],a=s.cases[round()];if(!c.correct.includes(value))break;if(!s.inquiry.evidence[round()].includes(value))s.inquiry.evidence[round()].push(value);a.traits=[...s.inquiry.evidence[round()]];feedback=null;render();break;}
    case 'motion-play':motionPlaying=!motionPlaying;motionTime=0;render();break;
    case 'motion-slow':motionSlow=!motionSlow;render();break;
    case 'motion-frame':stopMotion();motionPhase=Number(value)||0;render();break;
    case 'motion-capture':if(Object.hasOwn(MOTIONS,id)){const m=MOTIONS[id],frame=frameAt(motionPhase);stopMotion(false);if(frame!==MOTION_KEY_FRAME){delete s.inquiry.motion[id];return say(`이 장면은 ‘${m.frames[frame]}’ 장면이야. ${m.goal}을 찾아 멈춰 봐.`);}s.inquiry.motion[id]=frame;save();say(`찾았어! ${m.goal}이야.`,true);}break;
    case 'lab-summary':if(!comparisonReady(s.designs[round()]))return say('지금 모양도 시험해 줘. 서로 다른 두 모양의 결과가 필요해.');labSummary=true;feedback=null;render();break;
    case 'lab-back':labSummary=false;render();break;
    case 'experiment-level':s.designs[round()].experiment.level=Math.max(1,Math.min(3,Number(value)||1));s.designs[round()].experiment.reflection='';render();break;
    case 'prediction':s.designs[round()].experiment.prediction=value;render();break;
    case 'reflection':s.designs[round()].experiment.reflection=value;render();break;
    case 'experiment-run':{const d=s.designs[round()];report=recordTrial(s,round());if(!report.passed){say('고른 동물 특징과 물건의 부분이 어울리는지 다시 살펴봐. 아래의 이전 활동을 눌러 고쳐 봐.');break;}if(!addExperimentTrial(d)){say('동물 특징을 먼저 기록하고, 결과를 예상해 줘.');break;}feedback=null;render();break;}
    case 'lens-animal':modal('확대 관찰',lensTool(id,0));break;
    case 'lens-part':modal('확대 관찰',lensTool(id,Number(value)||0));break;
    case 'notebook':notebook();break;
    case 'tool':tool(Number(id));break;
    case 'settings':settings();break;
    case 'sound':s.soundEnabled=!s.soundEnabled;if(!s.soundEnabled)silence();else playSound(true);render();if(dialog.open)settings();break;
    case 'admin':s.adminUnlocked=!s.adminUnlocked;if(screen==='mission'&&!isStageOpen(s,stage))go('map');else render();settings();break;
    case 'close-dialog':dialog.close();break;
    case 'reset-confirm':modal('탐험 기록을 처음부터 시작할까?',`<p>이 브라우저의 관찰·탐험 별·발명·이전 기록이 지워져.</p><div class="dialog-actions">${btn('계속 탐험할래','close-dialog','secondary')}${btn('처음부터 시작','reset','primary')}</div>`);break;
    case 'reset':stopMotion();focusIndex=0;clueIndex=0;s=freshExpedition();navigation.reset();stage=1;step=0;selectedStage=1;activeHabitat='forest';zoom=false;sketching=false;stroke=null;dialog.close();go('home');break;
    case 'ending':if(s.completed.length===5)go('ending');break;
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
  if(e.target.id==='motion-phase'){const next=Number(e.target.value);stopMotion(false);motionPhase=next;paintMotion();save();return;}
  if(e.target.id==='invention-name'){const d=s.designs[round()];d.name=e.target.value.slice(0,24);document.querySelector('#design-title').textContent=d.name||PROBLEMS[d.problem]?.product||'어떤 물건을 만들까?';save();}});
document.addEventListener('change',e=>{if(['experiment-level','motion-phase'].includes(e.target.id))render();});
function sketchPoint(e,svg){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return [Math.round(Math.max(0,Math.min(320,p.x))),Math.round(Math.max(0,Math.min(260,p.y)))];}
document.addEventListener('pointerdown',e=>{const surface=e.target.closest?.('#lens-surface');if(surface&&!e.target.closest('[data-action]')){e.preventDefault();lensPointer={surface,id:e.pointerId};surface.setPointerCapture(e.pointerId);moveLens(e,surface);return;}if(e.target.id==='motion-phase')stopMotion(false);if(e.target.id!=='drawing-surface'||!sketching||stage!==5||step%2!==0)return;e.preventDefault();const svg=e.target.closest('svg'),d=s.designs[round()];if(d.strokes.length>=30)return say('선은 30개까지야. 마지막 선을 지우고 다시 그려 줘.');const points=[sketchPoint(e,svg)],line=document.createElementNS('http://www.w3.org/2000/svg','polyline');d.strokes.push(points);line.setAttribute('points',points[0].join(','));svg.querySelector('#sketch-lines').append(line);svg.setPointerCapture(e.pointerId);stroke={svg,points,line,id:e.pointerId};});
document.addEventListener('pointermove',e=>{if(lensPointer&&e.pointerId===lensPointer.id){moveLens(e,lensPointer.surface);return;}if(!stroke||e.pointerId!==stroke.id)return;e.preventDefault();if(stroke.points.length<250){stroke.points.push(sketchPoint(e,stroke.svg));stroke.line.setAttribute('points',stroke.points.map(p=>p.join(',')).join(' '));}});
for(const name of ['pointerup','pointercancel'])document.addEventListener(name,e=>{if(lensPointer&&e.pointerId===lensPointer.id){const animalId=lensPointer.surface.dataset.animal,list=OBSERVATIONS[animalId],x=Number(lensPointer.surface.style.getPropertyValue('--focus-x')),y=Number(lensPointer.surface.style.getPropertyValue('--focus-y'));focusIndex=list.reduce((best,o,i)=>(o.x-x)**2+(o.y-y)**2<(list[best].x-x)**2+(list[best].y-y)**2?i:best,0);lensPointer=null;render();}if(stroke&&e.pointerId===stroke.id){stroke=null;save();}});
document.addEventListener('keydown',e=>{if(dialog.open||screen!=='map'||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();selectMap(Math.max(1,Math.min(5,selectedStage+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1))));});
document.addEventListener('error',e=>{if(e.target.tagName!=='IMG'||!e.target.dataset.image)return;e.target.classList.add('image-failed');if(!document.querySelector('#asset-warning'))app.insertAdjacentHTML('afterbegin','<p id="asset-warning" role="status">그림을 불러오지 못했어. 연결을 확인하고 <button data-action="retry-images">그림 다시 보기</button>를 눌러 줘.</p>');},true);
dialog.addEventListener('close',()=>{if(exportURL){URL.revokeObjectURL(exportURL);exportURL=null;}});
if(typeof window.addEventListener==='function'){const resize=()=>document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||window.innerHeight)+'px');window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);resize();document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMotion(false);});}
render();
