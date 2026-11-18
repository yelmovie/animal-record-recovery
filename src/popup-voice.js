import {VOICE_LINES} from './voice-lines.js';
// Reads popup text aloud when it appears: request-card intros, the reward change line and an opened resident letter.
// Matching is by exact text (VOICE_LINES). Text behind an open dialog waits until the dialog closes; a line stops when
// its text leaves the screen or another voice starts. Concept captions use speakLine directly (concept-video.js).
const assets=new URL('../assets/',import.meta.url);
const SELECTORS='.request-part-intro,.reward-content>p,details.letter-body[open]';
let opts=null,player=null,release,done=null,popupText=null;
const spoken=new Set();
export const voiceLinePlaying=()=>!!player&&!player.paused&&!player.ended;
function finish(){release?.();release=undefined;popupText=null;const d=done;done=null;d?.();}
export function stopLine(){done=null;player?.pause();release?.();release=undefined;popupText=null;}
/** Plays the recorded line for this exact text. onEnd runs when it ends or fails, not when it is stopped. */
export function speakLine(text,{onEnd}={}){
  const clip=VOICE_LINES[text];if(!clip||!opts)return false;
  stopLine();
  if(!opts.enabled()||!(opts.volume()>0)||document.hidden)return false;
  if(!player){
    player=new Audio();
    player.addEventListener('playing',()=>{release??=opts.duck();});
    for(const name of ['ended','error'])player.addEventListener(name,finish);
  }
  player.src=new URL('audio/'+clip+'.mp3',assets).href;player.volume=Math.min(1,Math.max(0,opts.volume()));
  done=onEnd||null;
  player.play()?.catch(finish);
  return true;
}
const textOf=el=>el.matches('details')?[...el.querySelectorAll(':scope>p')].map(p=>p.textContent.trim()).join(' '):el.textContent.trim();
function scan(){
  const dialogs=[...document.querySelectorAll('dialog[open]')],top=dialogs.at(-1);
  const present=new Set(),visible=[];
  for(const el of document.querySelectorAll(SELECTORS)){
    const text=textOf(el);if(!VOICE_LINES[text])continue;
    present.add(text);
    if((!top||top.contains(el))&&!el.closest('[hidden]'))visible.push(text);
  }
  for(const text of [...spoken])if(!present.has(text))spoken.delete(text);
  if(popupText&&!present.has(popupText))stopLine();
  const otherVoice=document.querySelector('[data-speaking="true"]');
  const next=visible.find(text=>!spoken.has(text));
  if(!next||otherVoice)return;
  spoken.add(next);
  if(speakLine(next))popupText=next;
}
export function installPopupVoice(options){
  if(opts||typeof MutationObserver!=='function'||!document.body?.querySelectorAll)return;opts=options;
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;scan();});})
    .observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['open','hidden','data-speaking']});
  // Another voice (resident dialogue, broadcast, story video) takes over.
  document.addEventListener('play',event=>{const el=event.target;if(el!==player&&(el.tagName==='AUDIO'||el.tagName==='VIDEO'&&!el.muted))stopLine();},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLine();});
  scan();
}
