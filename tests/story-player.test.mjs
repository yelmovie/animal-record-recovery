import {test} from 'node:test';
import assert from 'node:assert/strict';
import {storyCue,createStoryPlayer,STORIES} from '../src/story-player.js';

function harness(){
 const listeners=new Map(),node=()=>({textContent:'',hidden:false,setAttribute(){}});
 const speaker=node(),line=node(),caption={...node(),querySelector:s=>s==='b'?speaker:line},progress=node(),time=node(),toggle=node(),status=node();
 const video={currentTime:0,duration:24,paused:true,addEventListener(n,f){listeners.set(n,f);},removeEventListener(n){listeners.delete(n);},play(){this.paused=false;listeners.get('play')?.();return Promise.resolve();},pause(){this.paused=true;listeners.get('pause')?.();},removeAttribute(){},querySelectorAll(){return[];},load(){},emit(n){listeners.get(n)?.();}};
 const host={dataset:{story:'intro'},querySelector:s=>({'video':video,'.story-caption':caption,'progress':progress,'.story-time':time,'[data-action="story-toggle"]':toggle,'.story-status':status})[s]};
 let ended=0;const player=createStoryPlayer(host,{onEnd:()=>ended++});
 return {player,video,speaker,line,caption,progress,time,toggle,status,listeners,get ended(){return ended;}};
}
test('story captions follow the actual media clock across scene boundaries and seeking',()=>{
 const h=harness();assert.equal(h.speaker.textContent,'하루');h.video.currentTime=5;h.video.emit('timeupdate');assert.equal(h.speaker.textContent,'모리');assert.match(h.line.textContent,/수정/);h.player.toggle();assert.equal(h.video.paused,true);h.video.currentTime=1;h.video.emit('seeked');assert.match(h.line.textContent,/다리/);assert.equal(h.progress.value,1);h.player.destroy();
 for(const kind of Object.keys(STORIES)){assert.equal(storyCue(kind,-1),null);assert.equal(storyCue(kind,24),null);for(let at=0;at<24;at+=.25)assert.ok(storyCue(kind,at),`${kind} subtitle gap ${at}`);}
});
test('story failure keeps a visible escape path and disposing prevents stale completion',()=>{
 const h=harness();h.video.emit('error');assert.match(h.status.textContent,/건너뛰기/);h.player.destroy();h.video.emit('ended');assert.equal(h.ended,0);assert.equal(h.listeners.size,0);assert.equal(h.video.paused,true);
 const completed=harness();completed.video.emit('ended');assert.equal(completed.ended,1);completed.player.destroy();
});
