// Concept clips and motion-video replays: one data module. The player (concept-video.js) only reads this.
// Clips are silent; captions are DOM text shown on top of the video, so wording can change without re-rendering.
// seconds must match the rendered clip length (tools/concept-clips); captions are [start, end, text] in seconds.
import {comparisonReady,MOTIONS} from './inquiry.js';
import {taskReady,ANIMALS} from './expedition.js';
import {campaignDone} from './campaign.js';
import {MOTION_CLIPS,motionVideoURL,videoFrameAt} from './motion-video.js';

const BASE=new URL('../assets/concepts/',import.meta.url).href;
// A lab clip opens after the learner compared two shapes for that problem (current draft, saved record or archive).
const compared=(s,problem)=>[...(s.designs||[]),...(s.records?.designs||[]),...(s.designArchive||[]).flatMap(a=>Object.values(a||{}))].some(d=>d?.problem===problem&&d.experiment&&comparisonReady(d));
const motionSeen=(s,id)=>s.inquiry?.motion?.[id]!==undefined;

// The lab now only runs the swim problem, so the shell and fur clips open with any finished comparison
// (same idea — an animal feature's job copied into a product) instead of staying locked forever.
const labCompared=s=>['swim','protect','warm'].some(p=>compared(s,p));
export const CONCEPTS=[
 {id:'webbed-foot',title:'물갈퀴와 오리발이 물을 미는 방법',seconds:10,problem:'swim',hint:'5장 ‘모양 바꿔 비교하기’에서 오리발 모양 두 가지를 비교하면 열려',
  unlock:s=>compared(s,'swim'),captions:[[0,3.5,'오리는 발가락 사이 물갈퀴를 쫙 펴서 물을 뒤로 밀어.'],[3.5,7,'넓은 면으로 물을 많이 밀수록 몸은 앞으로 잘 나아가.'],[7,10,'오리발도 같은 원리야. 넓고 납작한 면이 물을 밀어.']]},
 {id:'shell-helmet',title:'등딱지와 안전모가 몸을 지키는 방법',seconds:10,problem:'protect',hint:'5장 ‘모양 바꿔 비교하기’에서 모양 두 가지를 비교하면 열려',
  unlock:s=>labCompared(s),captions:[[0,3.5,'거북은 단단한 등딱지가 몸을 감싸고 있어.'],[3.5,7,'무언가 부딪혀도 단단한 덮개가 충격을 막아 줘.'],[7,10,'안전모도 단단한 덮개로 머리를 감싸서 지켜 줘.']]},
 {id:'warm-fur',title:'털이 몸의 열을 지키는 방법',seconds:12,problem:'warm',hint:'5장 ‘모양 바꿔 비교하기’에서 모양 두 가지를 비교하면 열려',
  unlock:s=>labCompared(s),captions:[[0,3,'몸에서는 따뜻한 열이 계속 나와.'],[3,6.5,'털이 없으면 열이 금방 밖으로 빠져나가.'],[6.5,10,'촘촘한 털 사이에는 공기가 머물러서 열이 천천히 빠져나가.'],[10,12,'털이 열을 만드는 게 아니야. 빠져나가는 열을 줄여 주는 거야.']]},
 {id:'sort-criteria',title:'좋은 분류 기준은 무엇일까?',seconds:12,hint:'2장 ‘다 함께 쓸 기준 고치기’에서 기준을 고쳐 다시 검증하면 열려',
  unlock:s=>s.activities?.includes('2-1')||taskReady(s,2,1),captions:[[0,4,'‘빨리 달리나요?’로 나누면 세 연구원의 결과가 서로 달라.'],[4,8,'‘날개가 있나요?’는 몸을 보면 누구나 똑같이 확인할 수 있어.'],[8,12,'누구나 같은 결과가 나오고, 동물이 두 무리로 나뉘는 기준이 좋은 분류 기준이야.']]},
 {id:'habitat-life',title:'사는 곳과 알맞은 생김새',seconds:12.9,hint:'3장 선택 도전을 마치거나, 낙타·펭귄 움직임까지 기록하면 열려',
  unlock:s=>campaignDone(s,3,2)||(s.activities?.includes('3-3')&&motionSeen(s,'camel')&&motionSeen(s,'penguin')),captions:[[0,4.3,'낙타는 모래가 많은 건조한 곳에 살아. 넓적한 발바닥으로 모래를 디뎌.'],[4.3,8.6,'펭귄은 추운 바다에 살아. 짧은 날개로 물을 밀며 헤엄쳐.'],[8.6,12.9,'오리는 연못에 살아. 물갈퀴로 물을 밀어. 사는 곳에 알맞은 생김새를 가졌어.']]}
].map(c=>({...c,kind:'concept',sources:[[BASE+c.id+'.webm','video/webm'],[BASE+c.id+'.mp4','video/mp4']],poster:BASE+c.id+'.webp',endFrame:true}));

// 3장 motion videos (already recorded clips). Captions follow the reviewed scene timing in motion-video.js.
const NAMES={camel:'낙타',penguin:'펭귄'};
export const MOTION_REPLAYS=['frog','crab','duck','rabbit','butterfly','marine','camel','penguin'].map(id=>{const name=ANIMALS[id]?.name||NAMES[id],m=MOTIONS[id];return {
 id,kind:'motion',title:`${name} · ${m.part}`,seconds:MOTION_CLIPS[id].duration,hint:`3장에서 ${name} 움직임을 기록하면 열려`,unlock:s=>motionSeen(s,id),
 captions:m.frames.map((text,i)=>[i*MOTION_CLIPS[id].duration/3,(i+1)*MOTION_CLIPS[id].duration/3,text]),
 sources:[[motionVideoURL(id),'video/mp4']],poster:motionVideoURL(id,'webp'),endFrame:false};});

// Lab problem → its clip (stage 5, step 1).
export const LAB_CONCEPT={swim:'webbed-foot',protect:'shell-helmet',warm:'warm-fur'};
export const replayItem=id=>CONCEPTS.find(c=>c.id===id)||MOTION_REPLAYS.find(m=>m.id===id)||null;
// Teacher preview opens every clip for class demos (records are not touched).
// Activity screens use the learner's own progress only, so a preview never shows the button before the discovery.
export const activityUnlocked=(s,id)=>!!replayItem(id)?.unlock(s);
export const replayUnlocked=(s,id)=>!!replayItem(id)&&(s.adminUnlocked===true||activityUnlocked(s,id));
// Caption at a media time. Motion clips use their reviewed push intervals, not equal thirds.
export function captionAt(id,time){
 const item=replayItem(id);if(!item)return '';const t=Math.max(0,Number(time)||0);
 if(item.kind==='motion')return MOTIONS[id].frames[videoFrameAt(id,Math.min(100,t/item.seconds*100))];
 return (item.captions.find(([start,end])=>t>=start&&t<end)||item.captions.at(-1))[2];
}
