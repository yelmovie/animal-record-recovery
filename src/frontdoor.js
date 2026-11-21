import {header,home} from './landing-views.js';
import {createRecordStorage,storageMessage} from './record-storage.js';
import {freshExpedition,expeditionResume} from './expedition.js';
import {btn,esc} from './presentation.js';
import {playSound,playMusic,setMusicVolume,setSoundVolume,silence} from './audio.js';
import {BUILD_INFO} from './build-info.js';

const app=document.querySelector('#app');
const store=createRecordStorage({getItem:key=>localStorage.getItem(key)});
const loaded=store.read(),s=loaded.state||freshExpedition();
let player,request=0,introOpen=false,failedAction,owner=true;
const restart=history.state?.frontdoorAction;
if(restart)history.replaceState({...history.state,frontdoorAction:null},'');
const resize=()=>document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||innerHeight)+'px');
window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);resize();

function landing(){
 request++;player?.destroy();player=null;introOpen=false;
 app.innerHTML=header(s,{screen:'home'})+home(s);
 const warning=storageMessage(loaded.status);
 if(warning)app.insertAdjacentHTML('afterbegin',`<div id="storage-warning" role="alert"><span>${esc(warning)}</span></div>`);
 playMusic(s.musicOn===false?null:'village');
}
function load(module){
 let timeout;
 return Promise.race([module(),new Promise((_,reject)=>{
  timeout=setTimeout(()=>reject(new Error('Screen timed out')),10000);
 })]).finally(()=>clearTimeout(timeout));
}
function pending(){
 app.innerHTML='<main id="main" class="boot-message frontdoor-load"><p role="status">다음 화면을 준비하고 있어…</p>'+btn('첫 화면으로','front-home','secondary')+'</main>';
}
function failed(action){
 failedAction=action;
 app.innerHTML='<main id="main" class="boot-message frontdoor-load" tabindex="-1"><h1>화면을 열지 못했어</h1><p>연결을 확인하고 다시 열어 줘.</p>'+btn('다시 열기','front-retry','primary')+btn('첫 화면으로','front-home','secondary')+'</main>';
 document.querySelector('#main').focus({preventScroll:true});
}
function leaveStory(){
 player?.destroy();player=null;introOpen=false;
 if(document.fullscreenElement===app)document.exitFullscreen?.()?.catch(()=>{});
}
async function openRuntime(action){
 const ticket=++request;
 leaveStory();pending();
 try{
  const {openFromLanding}=await load(()=>import('./adventure-app.js'));
  if(ticket!==request)return;
  window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);
  app.removeEventListener('click',onClick);
  owner=false;openFromLanding(action);
 }catch{if(ticket===request)failed(action);}
}
async function openIntro(){
 const ticket=++request;
 introOpen=true;history.pushState({...history.state,appDepth:(history.state?.appDepth||0)+1},'');silence();playMusic(s.voiceOn===false&&s.musicOn!==false?'village':null);pending();
 if(!document.fullscreenElement)app.requestFullscreen?.()?.catch(()=>{});
 try{
  const {storyView,createStoryPlayer}=await load(()=>import('./story-player.js'));
  if(ticket!==request)return;
  app.innerHTML=storyView(s,{screen:'intro'});
  const host=app.querySelector('[data-story]');
  // Voice off: the film's lines are mixed into its sound, so it plays muted and the village theme keeps going under it.
  player=createStoryPlayer(host,{onEnd:()=>openRuntime('intro-finished'),volume:s.voiceOn===false?0:s.soundEnabled?(s.soundVolume??.8):s.musicOn!==false?(s.musicVolume??.5):0});
  host.focus({preventScroll:true});
 }catch{if(ticket===request){leaveStory();failed('story-intro');}}
}
function onClick(event){
 const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
 const action=button.dataset.action;
 playSound(s.soundEnabled,action==='settings'?'page':'tap');
 if(action==='start'){if(expeditionResume(s)==='intro')openIntro();else openRuntime('resume');}
 if(action==='story-intro')openIntro();
 if(action==='settings')openRuntime('settings');
 if(action==='story-skip'&&introOpen)openRuntime('intro-finished');
 if(action==='story-toggle')player?.toggle();
 if(action==='story-fullscreen'){
  if(document.fullscreenElement===app)document.exitFullscreen?.()?.catch(()=>{});
  else app.requestFullscreen?.()?.catch(()=>{});
 }
 if(action==='front-home'){leaveStory();landing();app.querySelector('.landing-start')?.focus();}
 if(action==='front-retry'){
  history.replaceState({...history.state,frontdoorAction:failedAction},'');location.reload();
 }
}
setSoundVolume(s.soundVolume??.8);setMusicVolume(s.musicVolume);
// Browser back on the front door (2026-11-21): the intro film returns to the landing; on the landing, entries left
// from an earlier visit (after a reload) are skipped so the next back leaves the page as usual.
addEventListener('popstate',event=>{if(!owner)return;if(introOpen){leaveStory();landing();return;}const d=event.state?.appDepth||0;if(d>0)history.go(-d);});
app.addEventListener('click',onClick);
// The intro film carries its own sound: a hidden tab pauses it (the play button resumes it), like the runtime's story player.
document.addEventListener('visibilitychange',()=>{if(document.hidden)player?.pause();});
landing();
if(restart==='story-intro')openIntro();
else if(['map','resume','settings','intro-finished'].includes(restart))openRuntime(restart);
// Offline revisit: only the deployed build registers sw.js (the source dev server never does).
// After it takes over, it also keeps what this first load already fetched.
if(BUILD_INFO.sha!=='development'&&'serviceWorker' in navigator)addEventListener('load',()=>{
 navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(reg=>reg.active?.postMessage({cache:[location.href,...performance.getEntriesByType('resource').map(e=>e.name)]})).catch(()=>{});
});
