let context,sfxVolume=.8;
const active=new Set(),plays=[],lastStart={};
// Footsteps keep a lane of their own: a new step replaces only the previous step and never counts toward the three effects,
// so walking cannot cut a strike, a card or a jingle short (and they cannot cut the steps).
let stepNode=null;
// Pixabay and CC0 sound files (see assets/CREDITS.md). Gains even out the sources' peaks (tap ≈.33, others ≈.5); tune by ear on the classroom tablet.
const FILES={tap:.5,correct:.55,retry:.75,star:1.4,stamp:.7,fanfare:.8,talk:.45,step:.6,door:.45,page:.7,
  // Map villain sounds: CC0 files from the shared science library (normalised near -18 LUFS).
  'encounter-swing':.5,'encounter-one':.55,'encounter-two':.6,'encounter-heavy':.7,'encounter-exit':.45,'encounter-appear':.35,'encounter-contact':.55,'encounter-victory':.6,
  // Achievement cards (village-rewards.js): fly in, reveal (the two rarest use the longer jingle), land in the slot, full set. Same CC0 library.
  'card-whoosh':.5,'card-reveal':.6,'card-epic':.6,'card-slot':.6,'card-complete':.6,
  // A new place opens on the map (a latch, then a sparkle 120ms later) and the relay hop. Same CC0 library.
  unlock:.5,'unlock-sparkle':.45,jump:.4};
const buffers={},loading={};
// Synth fallback while a file is still loading or failed: [notes, gap, wave, top-note length].
const SYNTH={'encounter-swing':[[620,980],.035,'sine',.06,.06],'encounter-heavy':[[196,131],.05,'triangle',.16,.11],'encounter-appear':[[660,880],.08,'sine',.10,.04],'encounter-victory':[[523.25,659.25,783.99,1046.5],.12,'triangle',.35,.08],'encounter-one':[[234],0,'triangle',.07,.10],'encounter-two':[[570,285],.04,'triangle',.11,.09],'encounter-exit':[[420,360,290,210],.052,'sine',.16,.10],'encounter-contact':[[202,162],.045,'triangle',.10,.08],'card-whoosh':[[520,940],.04,'sine',.08,.05],'card-reveal':[[783.99,1046.5,1318.5],.07,'sine',.3,.07],'card-epic':[[659.25,783.99,1046.5,1318.5],.09,'triangle',.4,.07],'card-slot':[[987.77,1318.5],.05,'sine',.12,.08],'card-complete':[[523.25,659.25,783.99,1046.5],.13,'triangle',.5,.08],talk:[[880]],step:[[180],0,'triangle'],door:[[220,330],.08,'triangle'],page:[[700]],drop:[[659.25,987.77],.06,'sine',.14,.16],unlock:[[392,523.25],.06,'triangle',.12,.06],'unlock-sparkle':[[1318.5,1567.98,2093],.06,'sine',.22,.04],jump:[[300,620],.05,'sine',.1,.05],tap:[[640]],correct:[[523.25,659.25,783.99]],retry:[[440,392]],star:[[1046.5,1318.5],.07],stamp:[[160],0,'triangle'],fanfare:[[523.25,659.25,783.99,1046.5],.14,'triangle',.5]};
// Map villain events (map-encounters.js tone kinds) -> sound names.
const ENCOUNTER={swing:'encounter-swing',finish:'encounter-heavy',exit:'encounter-exit',appear:'encounter-appear',contact:'encounter-contact',victory:'encounter-victory'};
export const encounterSound=(kind,hits)=>kind==='hit'?hits===2?'encounter-two':'encounter-one':ENCOUNTER[kind]??null;
// Fetch files ahead of time so the first strike on the map does not fall back to the synth.
export function preloadSounds(names){
  try{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext||typeof navigator!=='undefined'&&navigator.userActivation&&!navigator.userActivation.hasBeenActive)return;
    context ||= new AudioContext();
    names.forEach(load);
  }catch{ /* Preloading is optional. */ }
}
export const ENCOUNTER_SOUNDS=['encounter-swing','encounter-one','encounter-two','encounter-heavy','encounter-exit','encounter-appear','encounter-contact','encounter-victory'];
export const REWARD_SOUNDS=['card-whoosh','card-reveal','card-epic','card-slot','card-complete'];
export const STAGE_OPEN_SOUNDS=['unlock','unlock-sparkle'];
export function silence(){
  for(const source of active){try{source.stop();}catch{ /* Already ended. */ }}
  active.clear();plays.length=0;stepNode=null;
}
export function setSoundVolume(value){
  if(!Number.isFinite(value))return;
  sfxVolume=Math.min(1,Math.max(0,value));
  if(sfxVolume===0)silence();
}
function load(name){
  if(!Object.hasOwn(FILES,name)||buffers[name]||loading[name])return;
  loading[name]=fetch(new URL(`../assets/sfx/${name}.mp3`,import.meta.url)).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(data=>context.decodeAudioData(data)).then(buffer=>{buffers[name]=buffer;}).catch(()=>{ /* Keep the synth fallback; do not repeatedly fetch a failed sound. */ });
}
function track(source,gain,group){active.add(source);group.push(source);source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();group.splice(group.indexOf(source),1);if(!group.length&&plays.includes(group))plays.splice(plays.indexOf(group),1);};}
// kind: any FILES or SYNTH name ('drop' is synth-only); true/false are kept for older callers; unknown kinds fall back to 'tap'.
export const soundName=kind=>kind===true?'correct':kind===false||!(Object.hasOwn(FILES,kind)||Object.hasOwn(SYNTH,kind))?'tap':kind;
export function playSound(enabled,kind='tap'){
  if(!enabled||!sfxVolume||globalThis.document?.hidden)return;
  // Before the first tap or key the browser keeps audio locked: skip the effect instead of starting a blocked context.
  if(typeof navigator!=='undefined'&&navigator.userActivation&&!navigator.userActivation.hasBeenActive)return;
  try{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return;
    context ||= new AudioContext();
    if(context.state==='suspended')context.resume().catch(()=>{});
    load(soundName(kind));
    const name=soundName(kind),now=performance.now();
    // Same sound within 80ms is a double trigger; more than 3 effects at once turns to mush, so the oldest stops.
    if(now-(lastStart[name]??-1e9)<80)return;lastStart[name]=now;
    if(name==='step'){
      if(stepNode){const {source,gain}=stepNode,at=context.currentTime;try{gain.gain.setTargetAtTime(0,at,.012);source.stop(at+.06);}catch{ /* Already ended. */ }}
      stepNode=null;if(!buffers.step)return;
      const source=context.createBufferSource(),gain=context.createGain(),lane=[];
      source.buffer=buffers.step;gain.gain.value=FILES.step*sfxVolume;source.connect(gain);gain.connect(context.destination);track(source,gain,lane);
      stepNode={source,gain};source.addEventListener?.('ended',()=>{if(stepNode?.source===source)stepNode=null;});source.start();return;
    }
    while(plays.length>=3)for(const node of plays.shift()){try{node.stop();}catch{ /* Already ended. */ }}
    const group=[];plays.push(group);
    if(buffers[name]){
      const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=buffers[name];gain.gain.value=FILES[name]*sfxVolume;source.connect(gain);gain.connect(context.destination);track(source,gain,group);source.start();return;
    }
    const [notes,gap=.09,wave='sine',hold=.09,peak=.05]=SYNTH[name],start=context.currentTime;
    notes.forEach((hz,i)=>{
      const oscillator=context.createOscillator(),gain=context.createGain(),at=start+i*gap,len=i===notes.length-1?hold:.09;
      oscillator.type=wave;oscillator.frequency.value=hz;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(peak*sfxVolume+.0001,at+.006);gain.gain.exponentialRampToValueAtTime(.001,at+len);
      oscillator.connect(gain);gain.connect(context.destination);track(oscillator,gain,group);
      oscillator.start(at);oscillator.stop(at+len+.01);
    });
  }catch{ /* Audio unavailability must not block learning. */ }
}

// Background music (Suno tracks, see assets/CREDITS.md): one looping <audio>, faded in and out.
// village: the whole game. finale: the map finale dialog and the ending (certificate) screen. The finale song is at full
// level from its first second (its quiet bridge sits at 2:30~2:42), so it always starts from the top.
// Browsers block audio before the first tap, so a blocked start is retried on the next pointerdown or keydown.
const MUSIC={village:'village-theme',finale:'finale-theme'};
export const MUSIC_FILES=Object.values(MUSIC).map(name=>`assets/music/${name}.mp3`);
// Voices turn the music down instead of stopping it. Each speaker holds its own label and the music comes back only
// when every label is gone, so a screen redraw (setMusicVolume) or one voice ending cannot undo another voice's duck.
export const MUSIC_DUCK=.25;
const ducks=new Set(),ramps=new WeakMap(),leaving=new Map();
let music=null,musicKey=null,musicVolume=.5;
export const musicLevel=()=>musicVolume*(ducks.size?MUSIC_DUCK:1);
// True while a voice (or a held jingle) keeps the music down: a chime that must not land on a line waits for it.
export const musicDucked=()=>ducks.size>0;
// A newer fade on the same element replaces the one still running.
function fade(el,to,ms,done){
  const token={};ramps.set(el,token);
  const from=el.volume,start=performance.now();
  const tick=t=>{if(ramps.get(el)!==token)return;const k=Math.min(1,Math.max(0,(t-start)/ms));el.volume=Math.min(1,Math.max(0,from+(to-from)*k));if(k<1)requestAnimationFrame(tick);else done?.();};
  requestAnimationFrame(tick);
}
const settle=()=>{if(music&&!music.paused)fade(music,musicLevel(),200);};
const start=el=>el.play().then(()=>{if(el===music)fade(el,musicLevel(),700);}).catch(()=>{ /* Waiting for a tap. */ });
/** Turns the music down while a voice speaks. Returns the release for this label (safe to call twice). */
export function duckMusic(label){
  ducks.add(label);settle();
  return ()=>{if(ducks.delete(label))settle();};
}
// Music and effects have independent controls in settings.
export function setMusicVolume(m){
  if(!Number.isFinite(m))return;
  const next=Math.min(1,Math.max(0,m));
  if(next!==musicVolume){musicVolume=next;settle();}
}
// now: no fade (the learner switched sound off).
export function stopMusic(now=false){
  const el=music;music=null;musicKey=null;
  if(!el)return;
  const end=()=>{ramps.delete(el);leaving.delete(el);el.pause();el.removeAttribute('src');el.load();};
  if(now)end();else{leaving.set(el,end);fade(el,0,700,end);}
}
// key: 'village' | 'finale' | null (silence).
// Browsers block sound until the first tap, so the 2.3MB track waits for it instead of loading with the first screen.
let pendingMusic=null;
export function playMusic(key){
  if(!key||!MUSIC[key]||!musicVolume||typeof Audio!=='function'){pendingMusic=null;stopMusic();return;}
  if(typeof navigator!=='undefined'&&navigator.userActivation&&!navigator.userActivation.hasBeenActive){pendingMusic=key;return;}
  if(key===musicKey&&music){if(music.paused)start(music);return;}
  stopMusic();
  const el=new Audio(new URL(`../assets/music/${MUSIC[key]}.mp3`,import.meta.url).href);
  el.loop=true;el.preload='auto';el.volume=0;music=el;musicKey=key;start(el);
}
if(typeof document!=='undefined'&&typeof document.addEventListener==='function'){
  const resume=()=>{if(pendingMusic){const key=pendingMusic;pendingMusic=null;playMusic(key);}else if(music?.paused&&!document.hidden)start(music);};
  document.addEventListener('pointerdown',resume);document.addEventListener('keydown',resume);
  // A fade cannot finish in a hidden tab, so a track that was fading out ends at once.
  const hush=()=>{silence();music?.pause();for(const end of [...leaving.values()])end();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hush();else if(music)start(music);});
  globalThis.addEventListener?.('pagehide',hush);
}
