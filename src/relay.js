// Optional stage-3 challenge 「세 곳 이어달리기」. Which animal may cross a section is read from the stage-3
// records (DISCOVERIES: where it was met, MOTIONS: body part and kind of movement); there is no separate animal table.
// Values are diagram positions, not measured performance: nothing here ranks speed, height, time or distance.
import {DISCOVERIES,HABITATS,ANIMALS} from './expedition.js';
import {MOTIONS} from './inquiry.js';
import {withParticle} from './korean.js';

// A section is a place (habitat) plus the ways (MOTIONS kind) its path can be crossed.
export const RELAY_SECTIONS=[
 {id:'forest',habitat:'forest',kinds:['jump','fly'],title:'숲과 들 길',scene:'풀밭 사이로 물길이 흐르는 땅 위의 길이야.'},
 {id:'pond',habitat:'pond',kinds:['swim'],title:'연못 물길',scene:'연잎과 갈대 사이로 이어진 물길이야.'},
 {id:'sky',habitat:'forest',kinds:['fly'],title:'꽃밭 위 하늘길',scene:'발 디딜 땅이 없는, 꽃밭 위 높은 길이야.'},
 {id:'coast',habitat:'coast',kinds:['walk','swim'],title:'바다와 갯벌 길',scene:'갯벌과 바닷물이 나란히 이어진 길이야.'},
];
// How a kind of movement is said in a sentence, and what its on-screen button does.
const WAYS={jump:'뛰어서',fly:'날아서',swim:'헤엄쳐서',walk:'걸어서'};
export const RELAY_CONTROLS={
 jump:{act:'뛰기',help:'방향 버튼으로 움직이고, 물길 앞에서 ‘뛰기’를 눌러 건너뛰어.',hint:'물길 바로 앞까지 간 다음 ‘뛰기’를 눌러 봐. 오른쪽 방향 버튼을 누른 채로 뛰면 건너갈 수 있어.'},
 fly:{act:'날갯짓',help:'‘날갯짓’을 누르고 있으면 떠오르고, 떼면 천천히 내려와.',hint:'높은 꽃 울타리는 ‘날갯짓’을 길게 눌러 위로, 나뭇가지는 손을 떼고 아래로 지나가 봐.'},
 swim:{act:'',help:'방향 버튼으로 헤엄쳐. 막힌 곳은 옆으로 돌아가.',hint:'막힌 곳에서는 위·아래 방향 버튼으로 빈 물길을 찾아 돌아가 봐.'},
 walk:{act:'',help:'방향 버튼으로 걸어가. 바위는 옆으로 돌아가.',hint:'바위 앞에서는 위·아래 방향 버튼으로 빈 길을 찾아 돌아가 봐.'},
};
const STEPS=['3-0','3-1','3-2','3-3'];
export const freshRelay=()=>({picks:{},done:false});
// Opens only after the stage-3 observations are recorded, so the body part is never shown before its prediction.
export const relayOpen=s=>!!s&&(s.adminUnlocked===true||STEPS.every(id=>s.activities?.includes(id)));
// Only animals the learner already found (the teacher preview copy shows all six).
export const relayAnimals=s=>DISCOVERIES.filter(d=>s.adminUnlocked===true||s.discovered?.includes(d.id)).map(d=>d.animal);
export const relaySection=id=>RELAY_SECTIONS.find(x=>x.id===id);
export const relayKind=animal=>MOTIONS[animal]?.kind||'';
const sectionWays=section=>section.kinds.map(k=>WAYS[k]).join(' 또는 ');
// ok: met in this place and moves in a way the path allows. Otherwise the sentence repeats the learner's own record.
export function relayCheck(sectionId,animal){
 const section=relaySection(sectionId),d=DISCOVERIES.find(x=>x.animal===animal),m=MOTIONS[animal];
 if(!section||!d||!m)return {ok:false,reason:'unknown',text:'이 길을 지나갈 동물을 골라 줘.'};
 const name=ANIMALS[animal].name,place=HABITATS[d.habitat].name;
 if(d.habitat!==section.habitat)return {ok:false,reason:'place',text:`${withParticle(name,'은/는')} ${place}에서 만났어. 이 길은 ${HABITATS[section.habitat].name}에 있어. 여기에서 만난 동물을 떠올려 봐.`};
 if(!section.kinds.includes(m.kind))return {ok:false,reason:'way',text:`${withParticle(name,'은/는')} ${withParticle(m.part,'으로/로')} ${WAYS[m.kind]} 움직여. 이 길은 ${sectionWays(section)} 지나가야 해. 다른 동물을 떠올려 봐.`};
 return {ok:true,reason:'',text:`${d.text} 움직일 때 쓰는 몸 부분은 ${withParticle(m.part,'이야/야')}.`};
}
export const relayNext=s=>{const i=RELAY_SECTIONS.findIndex(x=>!s.relay?.picks?.[x.id]);return s.relay?.done||i<0?0:i;};
// Crossing a section keeps which animal the learner used there; all sections crossed completes the challenge.
export function relayCross(s,sectionId,animal){
 if(!relayOpen(s)||!relayAnimals(s).includes(animal)||!relayCheck(sectionId,animal).ok)return {ok:false};
 s.relay??=freshRelay();s.relay.picks[sectionId]=animal;
 const all=RELAY_SECTIONS.every(x=>s.relay.picks[x.id]),fresh=all&&!s.relay.done;if(all)s.relay.done=true;
 return {ok:true,done:all,fresh};
}
// Saved picks are checked again against the records; a save from before this challenge simply has none.
export function normalizeRelay(raw,s){
 const out=freshRelay(),x=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},picks=x.picks&&typeof x.picks==='object'?x.picks:{};
 if(!relayOpen(s))return out;
 const found=relayAnimals(s);
 for(const section of RELAY_SECTIONS){const animal=picks[section.id];if(typeof animal==='string'&&found.includes(animal)&&relayCheck(section.id,animal).ok)out.picks[section.id]=animal;}
 out.done=x.done===true&&RELAY_SECTIONS.every(section=>out.picks[section.id]);
 return out;
}
