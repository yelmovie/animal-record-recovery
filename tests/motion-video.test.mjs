import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOTION_CLIPS,motionFramePhase,videoFrameAt,createMotionPlayer} from '../src/motion-video.js';

class Video extends EventTarget{
 constructor(){super();this.duration=NaN;this.readyState=0;this._time=0;this.paused=true;this.ended=false;this.seeking=false;}
 get currentTime(){return this._time;}
 set currentTime(value){this._time=value;this.seeking=true;}
 play(){this.paused=false;this.ended=false;this.dispatchEvent(new Event('play'));return Promise.resolve();}
 pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
 removeAttribute(){}load(){}
 finishSeek(){this.seeking=false;this.dispatchEvent(new Event('seeked'));}
}
test('reviewed push times replace equal thirds and repeated wing strokes count',()=>{
 for(const id of Object.keys(MOTION_CLIPS)){
  assert.equal(videoFrameAt(id,motionFramePhase(id,0)),0,id+' preparation');
  assert.equal(videoFrameAt(id,motionFramePhase(id,1)),1,id+' push');
  assert.equal(videoFrameAt(id,motionFramePhase(id,2)),2,id+' travel');
 }
 assert.equal(videoFrameAt('rabbit',34),0,'the old 34% shortcut is before the actual rabbit push');
 for(const seconds of [.4,1.5,2.5,3.5])assert.equal(videoFrameAt('butterfly',seconds/4.25*100),1);
 assert.equal(videoFrameAt('butterfly',100),2);
});
test('player restores the chosen time after metadata and reports actual paused media time',()=>{
 const video=new Video(),updates=[];
 const player=createMotionPlayer({querySelector:()=>video},{phase:56,onUpdate:s=>updates.push(s)});
 assert.equal(player.ready,false);video.duration=5;video.readyState=4;video.dispatchEvent(new Event('loadedmetadata'));
 assert.ok(Math.abs(video.currentTime-2.8)<.001);assert.equal(player.ready,false,'cannot record a pending seek');
 video.finishSeek();assert.equal(player.ready,true);assert.ok(Math.abs(player.phase-56)<.001);
 player.setSlow(true);assert.equal(video.playbackRate,.45);player.play();assert.equal(video.paused,false);
 video._time=3;video.dispatchEvent(new Event('timeupdate'));assert.equal(updates.at(-1).phase,60);
 player.pause();assert.equal(updates.at(-1).playing,false);assert.equal(player.phase,60);
 const count=updates.length;player.destroy();video.dispatchEvent(new Event('timeupdate'));assert.equal(updates.length,count,'destroyed players cannot update the next animal');
});
test('a pause before metadata cancels pending autoplay, and errors reach the fallback',()=>{
 const video=new Video();let errors=0;
 const player=createMotionPlayer({querySelector:()=>video},{playing:true,onError:()=>errors++});
 player.pause();video.duration=5;video.readyState=4;video.dispatchEvent(new Event('loadedmetadata'));
 assert.equal(video.paused,true);
 video.dispatchEvent(new Event('error'));assert.equal(errors,1);
 player.destroy();video.dispatchEvent(new Event('error'));assert.equal(errors,1);
});
