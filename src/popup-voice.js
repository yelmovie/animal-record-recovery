import {VOICE_LINES} from './voice-lines.js';
// Reads popup text aloud when it appears: request-card intros, the reward change line, an opened resident letter
// and the map villain's speech bubble.
// Matching is by exact text (VOICE_LINES). Text behind an open dialog waits until the dialog closes; a line stops when
// its text leaves the screen or another voice starts. Concept captions use speakLine directly (concept-video.js).
const assets=new URL('../assets/',import.meta.url);
const SELECTORS='.request-part-intro,.reward-content>p,details.letter-body[open],.map-encounter-say,.map-encounter-clear';
let opts=null,player=null,release,done=null,popupText=null,villainLine=false;
const spoken=new Set();
// Before the learner's first tap or key the browser refuses to play, so a line on screen at load waits for that input
// (and is not marked as read); a line the input has already taken off the screen is simply skipped.
const awaitingInput=()=>typeof navigator!=='undefined'&&navigator.userActivation&&!navigator.userActivation.hasBeenActive;
export const voiceLinePlaying=()=>!!player&&!player.paused&&!player.ended;
/** A guide voice that would cut a villain's line already playing waits for it to end (at most 2s), then runs start. */
export function afterVillainLine(start){
  if(!villainLine||!voiceLinePlaying()){start();return;}
  let fired=false;const go=()=>{if(fired)return;fired=true;clearTimeout(timer);player?.removeEventListener('ended',go);player?.removeEventListener('pause',go);start();};
  const timer=setTimeout(go,2000);player.addEventListener('ended',go);player.addEventListener('pause',go);
}
function finish(){release?.();release=undefined;popupText=null;villainLine=false;const d=done;done=null;d?.();}
export function stopLine(){done=null;player?.pause();release?.();release=undefined;popupText=null;villainLine=false;}
/** Plays the recorded line for this exact text. onEnd runs when it ends or fails, not when it is stopped. */
export function speakLine(text,{onEnd}={}){
  const clip=VOICE_LINES[text];if(!clip||!opts)return false;
  stopLine();
  if(!opts.enabled()||!(opts.volume()>0)||document.hidden||awaitingInput())return false;
  if(!player){
    player=new Audio();
    player.addEventListener('playing',()=>{release??=opts.duck();});
    // A line the browser pauses on its own (audio focus, a pulled headset) gives the music back too.
    player.addEventListener('pause',()=>{release?.();release=undefined;});
    for(const name of ['ended','error'])player.addEventListener(name,finish);
  }
  player.src=new URL('audio/'+clip+'.mp3',assets).href;player.volume=Math.min(1,Math.max(0,opts.volume()));
  done=onEnd||null;
  player.play()?.catch(finish);
  return true;
}
const textOf=el=>el.matches('details')?[...el.querySelectorAll(':scope>p')].map(p=>p.textContent.trim()).join(' ')
  :el.matches('.map-encounter-clear')?(el.textContent.match(/“(.+)”/)?.[1]??''):el.textContent.trim();
function scan(){
  const dialogs=[...document.querySelectorAll('dialog[open]')],top=dialogs.at(-1);
  // present: still in the page (a hidden bubble keeps its line playing); shown: not hidden, so a line shown again is read again.
  const present=new Set(),shown=new Set(),visible=[];
  for(const el of document.querySelectorAll(SELECTORS)){
    const text=textOf(el);if(!VOICE_LINES[text])continue;
    present.add(text);
    if(el.closest('[hidden]'))continue;
    shown.add(text);
    if(!top||top.contains(el))visible.push([text,el.matches('.map-encounter-say,.map-encounter-clear')]);
  }
  for(const text of [...spoken])if(!shown.has(text))spoken.delete(text);
  if(popupText&&!present.has(popupText))stopLine();
  const otherVoice=document.querySelector('[data-speaking="true"]');
  const [next,villain]=visible.find(([text])=>!spoken.has(text))??[];
  if(!next||otherVoice||awaitingInput())return;
  spoken.add(next);
  if(speakLine(next)){popupText=next;villainLine=villain;}
}
export function installPopupVoice(options){
  if(opts||typeof MutationObserver!=='function'||!document.body?.querySelectorAll)return;opts=options;
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;scan();});})
    .observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['open','hidden','data-speaking']});
  // Another voice (resident dialogue, broadcast, story video) takes over.
  document.addEventListener('play',event=>{const el=event.target;if(el!==player&&(el.tagName==='AUDIO'||el.tagName==='VIDEO'&&!el.muted))stopLine();},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLine();});
  // The first input unlocks playback: read what is still on screen once the page has handled that input.
  const first=()=>{document.removeEventListener('pointerup',first,true);document.removeEventListener('keyup',first,true);setTimeout(scan,0);};
  if(awaitingInput()){document.addEventListener('pointerup',first,true);document.addEventListener('keyup',first,true);}
  scan();
}
