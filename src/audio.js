let context,sfxVolume=.8;
const active=new Set(),plays=[],lastStart={};
// Pixabay sound files (see assets/CREDITS.md). Gains even out the sources' peaks (tap ≈.33, others ≈.5); tune by ear on the classroom tablet.
const FILES={tap:.5,correct:.55,retry:.75,star:1.4,stamp:.7,fanfare:.8,talk:.45,step:.6,door:.45,page:.7};
const buffers={};let loading=null;
// Synth fallback while a file is still loading or failed: [notes, gap, wave, top-note length].
const SYNTH={talk:[[880]],step:[[180],0,'triangle'],door:[[220,330],.08,'triangle'],page:[[700]],drop:[[659.25,987.77],.06,'sine',.14,.16],tap:[[640]],correct:[[523.25,659.25,783.99]],retry:[[440,392]],star:[[1046.5,1318.5],.07],stamp:[[160],0,'triangle'],fanfare:[[523.25,659.25,783.99,1046.5],.14,'triangle',.5]};
export function silence(){
  for(const source of active){try{source.stop();}catch{ /* Already ended. */ }}
  active.clear();plays.length=0;
}
export function setSoundVolume(value){
  if(!Number.isFinite(value))return;
  sfxVolume=Math.min(1,Math.max(0,value));
  if(sfxVolume===0)silence();
}
function load(){
  loading ||= Promise.all(Object.keys(FILES).map(name=>fetch(new URL(`../assets/sfx/${name}.mp3`,import.meta.url)).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(data=>context.decodeAudioData(data)).then(buffer=>{buffers[name]=buffer;}).catch(()=>{ /* Keep the synth fallback for this sound. */ })));
}
function track(source,gain,group){active.add(source);group.push(source);source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();group.splice(group.indexOf(source),1);if(!group.length&&plays.includes(group))plays.splice(plays.indexOf(group),1);};}
// kind: any FILES or SYNTH name ('drop' is synth-only); true/false are kept for older callers; unknown kinds fall back to 'tap'.
export const soundName=kind=>kind===true?'correct':kind===false||!(Object.hasOwn(FILES,kind)||Object.hasOwn(SYNTH,kind))?'tap':kind;
export function playSound(enabled,kind='tap'){
  if(!enabled||!sfxVolume)return;
  try{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return;
    context ||= new AudioContext();
    if(context.state==='suspended')context.resume().catch(()=>{});
    load();
    const name=soundName(kind),now=performance.now();
    // Same sound within 80ms is a double trigger; more than 3 effects at once turns to mush, so the oldest stops.
    if(now-(lastStart[name]??-1e9)<80)return;lastStart[name]=now;
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
// Browsers block audio before the first tap, so a blocked start is retried on the next pointerdown.
const MUSIC={village:'village-theme'};
let music=null,musicKey=null,musicVolume=.5;
function fade(el,to,done){
  const from=el.volume,start=performance.now();
  const tick=t=>{const k=Math.min(1,(t-start)/700);el.volume=Math.min(1,Math.max(0,from+(to-from)*k));if(k<1)requestAnimationFrame(tick);else done?.();};
  requestAnimationFrame(tick);
}
const start=el=>el.play().then(()=>{if(el===music)fade(el,musicVolume);}).catch(()=>{ /* Waiting for a tap. */ });
// Music and effects have independent controls in settings.
export function setMusicVolume(m){
  if(Number.isFinite(m)){musicVolume=Math.min(1,Math.max(0,m));if(music&&!music.paused)music.volume=musicVolume;}
}
export function stopMusic(){
  const el=music;music=null;musicKey=null;
  if(el)fade(el,0,()=>{el.pause();el.removeAttribute('src');el.load();});
}
// key: 'village' | null (silence).
export function playMusic(key){
  if(!key||!MUSIC[key]||!musicVolume||typeof Audio!=='function'){stopMusic();return;}
  if(key===musicKey&&music){if(music.paused)start(music);return;}
  stopMusic();
  const el=new Audio(new URL(`../assets/music/${MUSIC[key]}.mp3`,import.meta.url).href);
  el.loop=true;el.preload='auto';el.volume=0;music=el;musicKey=key;start(el);
}
if(typeof document!=='undefined'&&typeof document.addEventListener==='function'){
  document.addEventListener('pointerdown',()=>{if(music?.paused&&!document.hidden)start(music);});
  document.addEventListener('visibilitychange',()=>{if(!music)return;if(document.hidden)music.pause();else start(music);});
}
