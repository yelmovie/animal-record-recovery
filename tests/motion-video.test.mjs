import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOTION_CLIPS,motionFramePhase,videoFrameAt,createMotionPlayer,toggleMotionFullscreen} from '../src/motion-video.js';

test('fullscreen opens and closes the same player while leaving playback intact',async()=>{
 const video={currentTime:2.4,paused:false},doc={fullscreenElement:null,async exitFullscreen(){this.fullscreenElement=null;}};
 const player={ownerDocument:doc,querySelector(){return video;},async requestFullscreen(){doc.fullscreenElement=this;}};
 await toggleMotionFullscreen(player);assert.equal(doc.fullscreenElement,player);assert.equal(video.currentTime,2.4);assert.equal(video.paused,false);
 await toggleMotionFullscreen(player);assert.equal(doc.fullscreenElement,null);assert.equal(video.currentTime,2.4);
});

test('fullscreen uses the native video fallback where container fullscreen is unavailable',async()=>{
 let entered=0;const player={ownerDocument:{},querySelector(){return {webkitEnterFullscreen(){entered++;}};}};
 await toggleMotionFullscreen(player);assert.equal(entered,1);
 await assert.rejects(toggleMotionFullscreen({ownerDocument:{},querySelector(){return null;}}),/Fullscreen unavailable/);
});

class Video extends EventTarget{
 constructor(){super();this.duration=NaN;this.readyState=0;this._time=0;this.paused=true;this.ended=false;this.seeking=false;}
 get currentTime(){return this._time;}
 set currentTime(value){this._time=value;this.seeking=true;}
 play(){this.paused=false;this.ended=false;this.dispatchEvent(new Event('play'));return Promise.resolve();}
 pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
 removeAttribute(){}load(){}
 finishSeek(){this.seeking=false;this.dispatchEvent(new Event('seeked'));}
}

test('photos use decoded video pixels after playback and reject seeks, oversized images and disposed players',()=>{
 const video=new Video(),draws=[],canvas={width:0,height:0,getContext:()=>({drawImage:(...args)=>draws.push(args)}),toDataURL:()=> 'data:image/webp;base64,AAAA'};
 video.ownerDocument={createElement:()=>canvas};video.videoWidth=1280;video.videoHeight=720;
 const player=createMotionPlayer({querySelector:()=>video},{});
 assert.equal(player.capture(),null);video.duration=5;video.readyState=4;video.dispatchEvent(new Event('loadedmetadata'));video.finishSeek();
 assert.equal(player.capture(),null,'a decoded poster without playback is not a photo');
 video.play();video.dispatchEvent(new Event('playing'));video._time=.5;
 const photo=player.capture();assert.equal(photo.time,.5);assert.equal(photo.phase,10);assert.equal(photo.width,480);assert.equal(photo.height,270);assert.equal(draws[0][0],video);
 video.seeking=true;assert.equal(player.capture(),null);video.finishSeek();
 canvas.toDataURL=()=> 'data:image/webp;base64,'+'A'.repeat(65000);assert.equal(player.capture(),null,'storage size is bounded even after downscaling');
 player.destroy();assert.equal(player.capture(),null);
});
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
