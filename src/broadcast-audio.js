import {esc} from './presentation.js';
import {npcDialogue} from './npc-dialogue.js';

const CLIPS=['opening','rabbit','marine','duck','butterfly','camel','penguin','closing'];

// Narration is available only for a complete, correct learner-authored script.
export function broadcastClips(rows,draft){
  if(!rows.length||rows.some(row=>draft.answers[row.key]!==row.answer))return [];
  const animals=[...new Set(rows.map(row=>row.animal||row.key))];
  if(animals.some(id=>!CLIPS.includes(id)))return [];
  return ['opening',...animals,'closing'];
}
export function broadcastAudioControl(rows,draft,lines=[]){
  const clips=broadcastClips(rows,draft);
  return `<div class="broadcast-audio"><button type="button" class="btn quiet" data-broadcast-clips="${clips.join(',')}" data-broadcast-lines="${esc(JSON.stringify(lines))}" aria-pressed="false" ${clips.length?'':'disabled'}>방송 들어보기</button><span class="broadcast-audio-status" role="status">${clips.length?'하늘이와 내 원고를 방송으로 들어 봐.':'설명을 맞게 채우면 들어볼 수 있어.'}</span></div>`;
}
export function mountBroadcastAudio(host,{dialog,enabled,volume,duck,onStart,onFinish}){
  const buttons=[...host.querySelectorAll('[data-broadcast-clips]')];
  if(!buttons.length)return ()=>{};
  const events=new AbortController(),{signal}=events;
  const player=document.createElement('audio');
  player.preload='none';player.hidden=true;host.append(player);
  let button=null,queue=[],lines=[],index=0,release=null,epoch=0,ownsDialog=false;
  let context=null,analyser=null,samples=null,frame=0,lastFrame=0;
  const message=(target,text)=>{target.parentElement.querySelector('.broadcast-audio-status').textContent=text;};
  function restMouth(){
    cancelAnimationFrame(frame);frame=0;
    if(ownsDialog){dialog.dataset.speaking='false';dialog.dataset.mouth='closed';}
  }
  function animateMouth(time){
    if(!ownsDialog||player.paused||player.ended){restMouth();return;}
    if(time-lastFrame>80){
      lastFrame=time;
      let open;
      if(analyser){
        analyser.getFloatTimeDomainData(samples);
        const energy=samples.reduce((sum,value)=>sum+value*value,0)/samples.length;
        open=Math.sqrt(energy)>.012;
      }else open=Math.floor(player.currentTime*8)%3!==0;
      dialog.dataset.mouth=open?'open':'closed';
    }
    frame=requestAnimationFrame(animateMouth);
  }
  function prepareMeter(){
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!context&&AudioContext){
      try{
        context=new AudioContext();
        const source=context.createMediaElementSource(player);
        analyser=context.createAnalyser();analyser.fftSize=1024;
        samples=new Float32Array(analyser.fftSize);
        source.connect(analyser);analyser.connect(context.destination);
      }catch{analyser=null;}
    }
    void context?.resume().catch(()=>{});
  }
  function stop(resume=false){
    const active=!!button;
    epoch++;player.pause();restMouth();release?.();release=null;
    if(button){button.textContent='방송 들어보기';button.setAttribute('aria-pressed','false');}
    button=null;queue=[];
    if(ownsDialog){
      ownsDialog=false;dialog.classList.remove('broadcast-scene-dialog','npc-scene-dialog');
      delete dialog.dataset.mouth;delete dialog.dataset.speaking;
      if(dialog.open)dialog.close();
    }
    if(active&&resume)onFinish?.();
  }
  function fail(){
    if(!button)return;
    message(button,'음성을 불러오지 못했어. 다시 눌러 줘.');stop(true);
  }
  function play(){
    const request=++epoch;
    prepareMeter();
    void player.play().catch(()=>{if(request===epoch)fail();});
  }
  function playClip(){
    restMouth();
    const line=lines[index];
    dialog.querySelector('.npc-scene-line').textContent=line.text;
    dialog.querySelector('.broadcast-scene-status').textContent=`${line.cue} · ${index+1}/${queue.length}`;
    dialog.querySelector('[data-broadcast-pause]').textContent='잠깐 멈추기';
    player.src=new URL('../assets/audio/broadcast/'+queue[index]+'.mp3',import.meta.url).href;
    player.volume=Math.min(1,Math.max(0,volume()));play();
  }
  function openScene(){
    dialog.innerHTML=npcDialogue({id:'ranger',name:'하늘이의 살아있는 생태방송'},lines[0].text,{compact:true});
    dialog.querySelector('.npc-scene-actions').innerHTML='<span class="broadcast-scene-status" role="status"></span><button class="npc-scene-replay" type="button" data-broadcast-pause>잠깐 멈추기</button>';
    dialog.querySelector('.npc-scene-close').setAttribute('aria-label','방송 닫기');
    dialog.classList.add('npc-scene-dialog','broadcast-scene-dialog');
    ownsDialog=true;dialog.dataset.mouth='closed';dialog.showModal();
    dialog.querySelector('[data-broadcast-pause]').focus();
  }
  for(const target of buttons)target.addEventListener('click',()=>{
    if(target.disabled)return;
    if(button===target){message(target,'방송을 멈췄어.');stop(true);return;}
    stop();
    if(!enabled()||!(volume()>0)){message(target,'설정에서 효과음·목소리를 켜면 들을 수 있어.');return;}
    const clips=target.dataset.broadcastClips.split(',');
    if(clips.some(id=>!CLIPS.includes(id)))return;
    let script;
    try{script=JSON.parse(target.dataset.broadcastLines);}catch{return;}
    if(!Array.isArray(script)||script.length!==clips.length||script.some(line=>typeof line?.text!=='string'||typeof line.cue!=='string'))return;
    button=target;queue=clips;lines=script;index=0;
    target.textContent='방송 멈추기';target.setAttribute('aria-pressed','true');
    message(target,'하늘이의 방송을 듣고 있어.');onStart?.();openScene();playClip();
  },{signal});
  dialog.addEventListener('click',event=>{
    if(!ownsDialog)return;
    if(event.target.closest('.npc-scene-close')){message(button,'방송을 멈췄어.');stop(true);return;}
    if(!event.target.closest('[data-broadcast-pause]'))return;
    const control=dialog.querySelector('[data-broadcast-pause]');
    if(player.paused){control.textContent='잠깐 멈추기';play();}
    else{epoch++;player.pause();control.textContent='이어서 듣기';}
  },{signal});
  dialog.addEventListener('cancel',event=>{if(ownsDialog){event.preventDefault();message(button,'방송을 멈췄어.');stop(true);}},{signal});
  dialog.addEventListener('close',()=>{if(ownsDialog&&!dialog.open)stop(true);},{signal});
  player.addEventListener('playing',()=>{
    if(!button)return;
    release??=duck();restMouth();dialog.dataset.speaking='true';frame=requestAnimationFrame(animateMouth);
  },{signal});
  player.addEventListener('pause',()=>{restMouth();release?.();release=null;},{signal});
  player.addEventListener('waiting',restMouth,{signal});
  player.addEventListener('error',fail,{signal});
  player.addEventListener('ended',()=>{
    if(!button)return;
    if(++index<queue.length){playClip();return;}
    message(button,'방송을 다 들었어.');stop(true);
  },{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();},{signal});
  window.addEventListener('pagehide',()=>stop(),{signal});
  const dispose=()=>{stop();events.abort();player.removeAttribute('src');player.load();player.remove();void context?.close().catch(()=>{});};
  dispose.stop=()=>stop();
  return dispose;
}
