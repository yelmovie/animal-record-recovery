// Seconds refer to reviewed local clips (user-supplied and generated), not equal thirds.
export const MOTION_CLIPS={
 camel:{duration:5,picks:[1.2,2,4.6],push:[[1.75,2.15],[2.85,3.3],[4.05,4.4]]},
 penguin:{duration:5,picks:[.8,2.4,4.6],push:[[1.7,3.3]]},
 rabbit:{duration:5,picks:[1.2,2.8,3.5],push:[[2.45,3.1]]},
 frog:{duration:5,picks:[.9,2.2,3.8],push:[[1.75,3.2]]},
 duck:{duration:5,picks:[1.2,2.1,3.3],prepare:[[.85,1.6]],push:[[.15,.8],[1.6,2.65],[3.65,4.6]]},
 crab:{duration:5,picks:[.1,1.7,4.8],push:[[.6,4.4]]},
 butterfly:{duration:4.25,picks:[.05,.4,.85],push:[[.2,.65],[1.2,1.7],[2.2,2.75],[3.2,3.8]]},
 marine:{duration:5,picks:[.1,1.7,4.7],push:[[.65,4.4]]}
};
const BASE=new URL('../assets/videos/motion/',import.meta.url).href;
export const motionVideoURL=(id,ext='mp4')=>Object.hasOwn(MOTION_CLIPS,id)?BASE+id+'.'+ext:'';
export const motionFramePhase=(id,index)=>MOTION_CLIPS[id].picks[index]/MOTION_CLIPS[id].duration*100;
export function videoFrameAt(id,phase){
 const clip=MOTION_CLIPS[id];if(!clip)return 0;
 const time=Math.max(0,Math.min(100,Number(phase)||0))/100*clip.duration;
 if(clip.push.some(([from,to])=>time>=from&&time<=to))return 1;
 return time<clip.push[0][0]||clip.prepare?.some(([from,to])=>time>=from&&time<to)?0:2;
}

// Fullscreen the existing player so the media clock and photo controls stay intact.
export async function toggleMotionFullscreen(player){
 if(!player)throw new Error('No video player');
 const doc=player.ownerDocument;
 if(doc.fullscreenElement===player){await doc.exitFullscreen();return;}
 if(player.requestFullscreen){await player.requestFullscreen();return;}
 const video=player.querySelector('.motion-video');
 if(video?.webkitEnterFullscreen){video.webkitEnterFullscreen();return;}
 throw new Error('Fullscreen unavailable');
}

// Keep the media clock authoritative. A stalled or seeking video cannot grant a record.
export function createMotionPlayer(host,{phase=0,playing=false,slow=false,onUpdate=()=>{},onError=()=>{}}={}){
 const video=host?.querySelector('.motion-video');if(!video)return null;
 let alive=true,pendingPhase=phase,viewed=false;
 const events=[];
 const listen=(name,fn)=>{video.addEventListener(name,fn);events.push([name,fn]);};
 const duration=()=>Number.isFinite(video.duration)&&video.duration>0?video.duration:0;
 const percent=()=>duration()?video.currentTime/duration()*100:pendingPhase;
 const update=()=>{if(alive)onUpdate({phase:percent(),playing:!video.paused&&!video.ended});};
 function seek(value){pendingPhase=Math.max(0,Math.min(100,Number(value)||0));if(duration())video.currentTime=pendingPhase/100*duration();}
 function play(){
  if(!alive)return;playing=true;
  if(video.ended||percent()>=99.9)seek(0);
  const promise=video.play();
  promise?.catch(()=>{if(alive){video.pause();update();}});
 }
 video.muted=true;video.playbackRate=slow?.45:1;
 listen('loadedmetadata',()=>{if(!alive)return;seek(pendingPhase);if(playing)play();});
 listen('playing',()=>{viewed=true;update();});
 for(const name of ['timeupdate','play','pause','seeking','seeked','ended','loadeddata','canplay','waiting'])listen(name,update);
 listen('error',()=>{if(alive)onError();});
 if(video.readyState>=1){seek(pendingPhase);if(playing)play();}
 return {
  get phase(){return percent();},get ready(){return video.readyState>=2&&!video.seeking;},get viewed(){return viewed;},
  capture(){
   if(!alive||!viewed||video.readyState<2||video.seeking||!duration()||!video.videoWidth||!video.videoHeight)return null;
   try{
    const canvas=video.ownerDocument.createElement('canvas');
    const draw=(width,quality)=>{const scale=Math.min(width/video.videoWidth,360/video.videoHeight,1);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);const context=canvas.getContext('2d');if(!context)return '';context.drawImage(video,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/webp',quality);};
    let dataURL=draw(480,.72);if(dataURL.length>64000)dataURL=draw(320,.62);
    if(!/^data:image\/(webp|png|jpeg);base64,/.test(dataURL)||dataURL.length>64000)return null;
    return {dataURL,width:canvas.width,height:canvas.height,time:video.currentTime,duration:duration(),phase:percent()};
   }catch{return null;}
  },
  play,pause(){playing=false;video.pause();update();},seek,
  setSlow(value){video.playbackRate=value?.45:1;},
  destroy(){alive=false;for(const [name,fn]of events)video.removeEventListener(name,fn);video.pause();video.removeAttribute('src');video.load();}
 };
}
