import {esc} from './presentation.js';
import {residentTalk} from './resident-dialogue-lines.js';

export const moriWelcome='안녕! 나는 모리야. 동물의 몸과 움직임을 자세히 살펴보고, 찾은 특징으로 기록을 복구해 보자. 네가 그렇게 생각한 까닭도 함께 들려줘!';
const assets=new URL('../assets/',import.meta.url);

export function npcDialogue(npc,line,{mori,completed,finalLine,letter,compact=false}){
  const portrait=new URL('residents/dialogue/'+npc.id+'.webp',assets).href;
  const body=compact?[line]:mori?[moriWelcome]:residentTalk(npc,line,completed);
  const extra=compact?'':mori?line:finalLine;
  return `<div class="npc-scene-stage">
    <div class="npc-scene-portrait" data-portrait="${esc(npc.id)}" aria-hidden="true" style="--npc-art:url('${esc(portrait)}')"></div>
    <section class="npc-scene-panel">
      <h2 id="dialog-title">${esc(npc.name)}</h2>
      <button class="npc-scene-close" type="button" data-action="close-dialog" aria-label="대화 닫기">×</button>
      ${body.length===1?`<p class="npc-scene-line">${esc(body[0])}</p>`:`<div class="npc-scene-copy" role="group" aria-label="주민 대사" tabindex="0">
        <p class="npc-scene-line">${esc(body[0])}</p>
        ${body.slice(1).map(text=>`<p class="npc-scene-detail">${esc(text)}</p>`).join('')}
      </div>`}
      ${extra?`<p class="npc-scene-context">${esc(extra)}</p>`:''}
      <div class="npc-scene-actions">
        <span>${compact?'잠시 뒤 다음 장소로 이동해':mori?'탐험 친구':completed?'복구한 장소':'마을 주민'}</span>
        <button class="npc-scene-replay" type="button" data-npc-replay hidden>다시 듣기</button>
        ${letter?`<button class="npc-scene-next" type="button" data-action="commission-letter" data-id="${letter}">편지 읽기</button>`:'<button class="npc-scene-next" type="button" data-action="close-dialog">이야기 마치기</button>'}
      </div>
    </section>
  </div>`;
}

export function mountNpcVoice(dialog,npc,completed,{enabled,volume,duck,compact=false,onEnd,onPlaying}){
  const events=new AbortController(),{signal}=events;
  const player=document.createElement('audio');
  const replay=dialog.querySelector('[data-npc-replay]');
  const clip=npc.id==='mori'?'audio/npc-dialogue/mori-welcome.mp3':'audio/npc-dialogue/'+npc.id+(completed?'-after':'-before')+(compact?'.mp3':'-expanded.mp3');
  player.preload='none';player.src=new URL(clip,assets).href;player.hidden=true;dialog.append(player);
  let release,epoch=0;
  const idle=()=>{release?.();release=undefined;dialog.dataset.speaking='false';replay.textContent='다시 듣기';};
  const stop=()=>{epoch++;player.pause();idle();};
  const play=()=>{
    if(!dialog.open||document.hidden||!enabled()||!(volume()>0))return;
    stop();const request=epoch;
    player.currentTime=0;player.volume=Math.min(1,Math.max(0,volume()));
    void player.play().catch(()=>{if(epoch===request)idle();});
  };
  replay.hidden=!enabled()||!(volume()>0);
  replay.addEventListener('click',()=>{if(player.paused)play();else stop();},{signal});
  player.addEventListener('playing',()=>{if(!dialog.open||player.paused){stop();return;}release??=duck();onPlaying?.(player.duration);dialog.dataset.speaking='true';replay.textContent='음성 멈추기';},{signal});
  player.addEventListener('ended',()=>onEnd?.(),{signal});
  for(const event of ['ended','error','waiting'])player.addEventListener(event,idle,{signal});
  player.addEventListener('pause',()=>{if(player.paused)idle();},{signal});
  dialog.addEventListener('cancel',stop,{signal});
  dialog.addEventListener('close',stop,{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();},{signal});
  window.addEventListener('pagehide',stop,{signal});
  play();
  return ()=>{stop();events.abort();player.removeAttribute('src');player.load();player.remove();};
}
