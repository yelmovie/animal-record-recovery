import {bindConceptFocus} from './concept-focus.js';
// Concept / motion replay player (dokdo-design dom-video-modal rules). Content lives in concepts.js.
import {CONCEPTS,MOTION_REPLAYS,replayItem,replayUnlocked,captionAt} from './concepts.js';
import {btn,icon,esc,off} from './presentation.js';

// Entry button for an activity screen. Callers show it only after the learner made the discovery.
export const conceptButton=(id,label='왜 그럴까? 영상으로 보기')=>replayItem(id)?btn(icon('arrow')+' '+label,'concept-open','secondary concept-entry',`data-id="${id}"`):'';

// back: 'settings' returns to the replay list in settings when the clip closes.
export function conceptView(id,back=''){
 const item=replayItem(id);if(!item)return '';
 const sources=item.sources.map(([src,type])=>`<source src="${src}" type="${type}">`).join('');
 return `<div class="concept-player" data-concept="${item.id}"><div class="concept-stage"><video class="concept-video" muted playsinline preload="metadata" poster="${item.poster}" aria-label="${esc(item.title)} 설명 영상, 소리 없음">${sources}</video>${item.endFrame?`<img class="concept-end" src="${item.poster}" alt="" hidden>`:''}${btn(icon('arrow')+' 영상 재생','concept-play','primary concept-play','hidden')}</div><p class="concept-caption" role="status" aria-live="polite">${esc(captionAt(item.id,0))}</p><p class="concept-status" hidden>영상을 불러오지 못해서 그림과 설명으로 보여 줄게.</p><ol class="concept-cues" hidden>${item.captions.map(([, ,text])=>`<li>${esc(text)}</li>`).join('')}</ol><div class="dialog-actions">${btn('처음부터 다시 보기','concept-replay','secondary','hidden')}${back==='settings'?btn(icon('back')+' 영상 목록으로','concept-back','primary'):btn('닫기','close-dialog','primary')}</div></div>`;
}

// Settings list: finished activities open, locked ones say how to open them. No video is fetched here.
export function replayList(s){
 const row=item=>{const open=replayUnlocked(s,item.id);return `<li>${btn(`<span class="concept-thumb">${open?`<video preload="none" muted playsinline poster="${item.poster}" tabindex="-1" aria-hidden="true"></video>`:icon('lock')}</span><span><b>${esc(item.title)}</b><small>${open?`${Math.round(item.seconds)}초 · 소리 없음`:esc(item.hint)}</small></span>`,'concept-open',`concept-row ${open?'':'locked'}`,`data-id="${item.id}" data-value="settings" ${open?'':off(item.hint)}`)}</li>`;};
 return `<h4>개념 영상</h4><ul class="concept-list">${CONCEPTS.map(row).join('')}</ul><h4>움직임 영상</h4><ul class="concept-list">${MOTION_REPLAYS.map(row).join('')}</ul>`;
}

// One media clock drives the caption. Blocked autoplay or reduced motion → play button; no metadata in 6s → poster + all captions.
export function createConceptPlayer(host,{onPlayingChange=()=>{}}={}){
 const video=host?.querySelector('.concept-video'),item=replayItem(host?.dataset.concept);if(!video||!item)return null;
 const caption=host.querySelector('.concept-caption'),cues=host.querySelector('.concept-cues'),status=host.querySelector('.concept-status'),end=host.querySelector('.concept-end'),playButton=host.querySelector('[data-action="concept-play"]'),replay=host.querySelector('[data-action="concept-replay"]'),sources=[...video.querySelectorAll('source')];
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 let closed=false,failed=false,last=null;const events=[];let releaseFocus=()=>{};
 const listen=(el,name,fn)=>{el.addEventListener(name,fn);events.push([el,name,fn]);};
 const show=t=>{const text=captionAt(item.id,t);if(text!==last){caption.textContent=text;last=text;}};
 const focus=el=>el?.focus?.({preventScroll:true});
 function play(){
  if(closed||failed)return;if(end)end.hidden=true;replay.hidden=true;
  if(video.ended)video.currentTime=0;
  video.play()?.then(()=>{if(!closed)playButton.hidden=true;}).catch(()=>{if(closed||failed)return;playButton.hidden=false;focus(playButton);});
 }
 function fallback(){
  if(closed||failed)return;failed=true;clearTimeout(timer);
  video.pause();sources.forEach(x=>x.removeAttribute('src'));video.removeAttribute('src');video.load();video.hidden=true;
  if(end){end.hidden=false;end.alt=item.title+' 마지막 장면';}
  caption.hidden=true;cues.hidden=false;status.hidden=false;playButton.hidden=true;replay.hidden=true;onPlayingChange(false);
 }
 const timer=setTimeout(()=>{if(video.readyState<1)fallback();},6000);
 video.muted=true;show(0);
 listen(video,'loadedmetadata',()=>{clearTimeout(timer);if(reduced){playButton.hidden=false;focus(playButton);}else play();});
 for(const name of ['timeupdate','seeked'])listen(video,name,()=>show(video.currentTime));
 listen(video,'play',()=>onPlayingChange(true));listen(video,'pause',()=>onPlayingChange(false));
 listen(video,'ended',()=>{if(end)end.hidden=false;show(item.seconds);replay.hidden=false;onPlayingChange(false);focus(replay);});
 // A failed <source> fires on the source element; the video gives up after the last one.
 listen(video,'error',fallback);if(sources.length)listen(sources.at(-1),'error',fallback);
 if(end)listen(end,'error',()=>{end.remove();});
 if(video.readyState>=1){clearTimeout(timer);if(reduced)playButton.hidden=false;else play();}
 const vocabulary={ 'webbed-foot':['물갈퀴','넓은 면','오리발'], 'shell-helmet':['등딱지','단단한 덮개','안전모'], 'warm-fur':['열','털','공기'], 'sort-criteria':['기준','날개','같은 결과'], 'habitat-life':['발바닥','날개','물갈퀴','사는 곳'] };
 Object.assign(vocabulary,{frog:['뒷다리','물','앞으로'],crab:['다리','땅','옆으로'],duck:['발','물갈퀴','앞으로'],rabbit:['뒷다리','땅','앞으로'],butterfly:['날개','위로'],marine:['몸','꼬리','앞으로'],camel:['발','발바닥','모래','앞으로'],penguin:['짧은 날개','물','앞으로']});
 const words=vocabulary[item.id]||[];
 const labels={ 'webbed-foot':['물갈퀴','물 밀기','오리발'], 'shell-helmet':['등딱지','충격 줄이기','안전모'], 'warm-fur':['몸의 열','빠져나가는 열','털 사이 공기','열 손실 줄이기'], 'sort-criteria':['결과 비교','관찰할 기준','같은 결과'], 'habitat-life':['낙타의 발','펭귄의 날개','오리의 물갈퀴'] };
 Object.assign(labels,{frog:['뒷다리 접기','물을 뒤로 밀기','앞으로 이동'],crab:['다리 들기','땅 밀기','옆으로 이동'],duck:['발 움직이기','물갈퀴로 밀기','앞으로 이동'],rabbit:['뒷다리 굽히기','땅 뒤로 밀기','앞으로 뛰기'],butterfly:['날개 들기','날개 내리기','날개 다시 올리기'],marine:['몸과 꼬리','반대로 굽히기','앞으로 이동'],camel:['발 옮기기','넓은 발바닥','앞으로 이동'],penguin:['짧은 날개','물 밀기','앞으로 이동']});
 releaseFocus=bindConceptFocus(host,video,{steps:item.captions.map(([at],i)=>({at,term:labels[item.id]?.[i]||['움직임 준비','몸의 움직임','이동 결과'][i]})),terms:words,caption,anchor:host.querySelector('.concept-stage')});
 return {play,replay(){if(failed)return;video.currentTime=0;play();},get failed(){return failed;},
  destroy(){if(closed)return;closed=true;releaseFocus();clearTimeout(timer);for(const [el,name,fn] of events)el.removeEventListener(name,fn);video.pause();sources.forEach(x=>x.removeAttribute('src'));video.removeAttribute('src');video.load();onPlayingChange(false);}};
}
