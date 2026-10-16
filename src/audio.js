let context;
const active=new Set();
export function silence(){
  for(const oscillator of active){try{oscillator.stop();}catch{ /* Already ended. */ }}
  active.clear();
}
export function playSound(enabled,success=false){
  if(!enabled)return;
  try{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return;
    context ||= new AudioContext();
    if(context.state==='suspended')context.resume().catch(()=>{});
    const start=context.currentTime;
    const notes=success?[523.25,659.25,783.99]:[640];
    notes.forEach((hz,i)=>{
      const oscillator=context.createOscillator(),gain=context.createGain(),at=start+i*.09;
      oscillator.type='sine';oscillator.frequency.value=hz;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.045,at+.006);gain.gain.exponentialRampToValueAtTime(.001,at+.09);
      oscillator.connect(gain);gain.connect(context.destination);
      active.add(oscillator);oscillator.onended=()=>{active.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.start(at);oscillator.stop(at+.10);
    });
  }catch{ /* Audio unavailability must not block learning. */ }
}
