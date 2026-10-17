let context;
const active=new Set();
// Pixabay sound files (see assets/CREDITS.md). Gains even out the sources' peaks (tap ≈.33, others ≈.5); tune by ear on the classroom tablet.
const FILES={tap:.5,correct:.55,retry:.75,star:1.4,stamp:.7,fanfare:.8};
const buffers={};let loading=null;
// Synth fallback while a file is still loading or failed: [notes, gap, wave, top-note length].
const SYNTH={tap:[[640]],correct:[[523.25,659.25,783.99]],retry:[[440,392]],star:[[1046.5,1318.5],.07],stamp:[[160],0,'triangle'],fanfare:[[523.25,659.25,783.99,1046.5],.14,'triangle',.5]};
export function silence(){
  for(const source of active){try{source.stop();}catch{ /* Already ended. */ }}
  active.clear();
}
function load(){
  loading ||= Promise.all(Object.keys(FILES).map(name=>fetch(new URL(`../assets/sfx/${name}.mp3`,import.meta.url)).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(data=>context.decodeAudioData(data)).then(buffer=>{buffers[name]=buffer;}).catch(()=>{ /* Keep the synth fallback for this sound. */ })));
}
function track(source,gain){active.add(source);source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();};}
// kind: 'tap' | 'correct' | 'retry' | 'star' | 'stamp' | 'fanfare'; true/false are kept for older callers.
export function playSound(enabled,kind='tap'){
  if(!enabled)return;
  try{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return;
    context ||= new AudioContext();
    if(context.state==='suspended')context.resume().catch(()=>{});
    load();
    const name=kind===true?'correct':kind===false||!Object.hasOwn(FILES,kind)?'tap':kind;
    if(buffers[name]){
      const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=buffers[name];gain.gain.value=FILES[name];source.connect(gain);gain.connect(context.destination);track(source,gain);source.start();return;
    }
    const [notes,gap=.09,wave='sine',hold=.09]=SYNTH[name],start=context.currentTime;
    notes.forEach((hz,i)=>{
      const oscillator=context.createOscillator(),gain=context.createGain(),at=start+i*gap,len=i===notes.length-1?hold:.09;
      oscillator.type=wave;oscillator.frequency.value=hz;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.05,at+.006);gain.gain.exponentialRampToValueAtTime(.001,at+len);
      oscillator.connect(gain);gain.connect(context.destination);track(oscillator,gain);
      oscillator.start(at);oscillator.stop(at+len+.01);
    });
  }catch{ /* Audio unavailability must not block learning. */ }
}
