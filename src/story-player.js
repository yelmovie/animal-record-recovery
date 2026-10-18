import {btn,icon} from './presentation.js';

export const STORIES={
  intro:{title:'자연 기록 마을에 온 걸 환영해',duration:24,poster:'intro-01',finish:'탐험 시작하기',cues:[
    [0,5,'하루','저 다리를 건너면 자연 기록 마을이야. 같이 가자!'],
    [5,9,'모리','어? 관찰 기록이 뒤섞여서 수정의 빛이 약해졌어.'],
    [9,13,'모리','직접 관찰한 사실을 모으면 기록을 다시 연결할 수 있어.'],
    [13,17,'하루','다섯 장소를 탐험하며 주민들의 부탁을 해결해 보자!'],
    [17,24,'모리','먼저 관찰소로 가자. 어떤 동물을 만나게 될까?']
  ]},
  outro:{title:'우리의 발견으로 다시 열린 전시관',duration:24,poster:'outro-01',finish:'내 전시관 들어가기',cues:[
    [0,4,'모리','마지막 기록이 도착했어. 다섯 빛이 모두 연결됐어!'],
    [4,10,'하루','우리가 관찰하고, 비교하고, 만들어 낸 기록이야.'],
    [10,16,'모리','책이 있는 전시관으로 가자. 네 발견이 기다리고 있어.'],
    [16,20,'하루','드디어 문이 열렸어!'],
    [20,24,'모리','이제 네가 만든 자연의 기록을 함께 둘러보자.']
  ]}
};
export function storyCue(kind,time){return STORIES[kind]?.cues.find(([start,end])=>time>=start&&time<end)||null;}
export function storyView(s,v){const kind=v.screen==='outro'?'outro':'intro',story=STORIES[kind];return `<main id="main" tabindex="-1" class="story-screen" data-story="${kind}" aria-label="${story.title}"><video class="story-video" autoplay muted playsinline preload="auto" poster="./assets/story/${story.poster}.webp" aria-label="${story.title}"><source src="./assets/videos/story/${kind}.mp4" type="video/mp4"></video><div class="story-top"><span>${story.title}</span>${btn('건너뛰기 '+icon('arrow'),'story-skip','story-skip')}</div><div class="story-caption" aria-live="off"><b></b><span></span></div><p class="story-status" role="status"></p><footer class="story-controls">${btn('일시정지','story-toggle','story-control','aria-label="영상 일시정지"')}<progress class="story-progress" max="${story.duration}" value="0" aria-label="영상 재생 진행"></progress><span class="story-time">0:00 / 0:24</span>${btn('전체화면','story-fullscreen','story-control')}</footer></main>`;}

// One native media clock drives captions and completion. Disposing cancels all old callbacks.
export function createStoryPlayer(host,{onEnd}={}){
  const video=host.querySelector('video'),kind=host.dataset.story,story=STORIES[kind];
  const caption=host.querySelector('.story-caption'),speaker=caption.querySelector('b'),line=caption.querySelector('span'),progress=host.querySelector('progress'),time=host.querySelector('.story-time'),toggle=host.querySelector('[data-action="story-toggle"]'),status=host.querySelector('.story-status');
  let disposed=false,lastCue=null;const listeners=[];
  const listen=(name,fn)=>{video.addEventListener(name,fn);listeners.push([name,fn]);};
  const format=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
  function sync(){if(disposed)return;const at=video.currentTime||0,cue=storyCue(kind,at),duration=Number.isFinite(video.duration)?video.duration:story.duration;progress.max=duration;progress.value=at;time.textContent=`${format(at)} / ${format(duration)}`;if(cue!==lastCue){speaker.textContent=cue?.[2]||'';line.textContent=cue?.[3]||'';caption.hidden=!cue;lastCue=cue;}toggle.textContent=video.paused?'재생':'일시정지';toggle.setAttribute('aria-label',video.paused?'영상 재생':'영상 일시정지');}
  function play(){if(disposed)return;video.play()?.catch(()=>{if(!disposed){status.textContent='재생을 눌러 마을로 들어가 봐.';sync();}});}
  for(const name of ['timeupdate','loadedmetadata','play','pause','seeked'])listen(name,sync);
  listen('waiting',()=>{if(!disposed)status.textContent='마을 영상을 불러오는 중이야. 건너뛰기로 바로 이어갈 수도 있어.';});
  listen('playing',()=>{status.textContent='';});
  listen('error',()=>{status.textContent='영상을 불러오지 못했어. 건너뛰기를 누르면 바로 이어갈 수 있어.';sync();});
  listen('ended',()=>{if(!disposed)onEnd?.();});
  sync();play();
  return {toggle(){if(video.paused)play();else video.pause();},pause(){video.pause();},destroy(){disposed=true;for(const [name,fn]of listeners)video.removeEventListener(name,fn);video.pause();video.removeAttribute('src');video.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));video.load();}};
}
