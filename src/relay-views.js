// Screen for the optional relay stage: the 3D path sits behind, and everything a learner reads or presses is DOM.
import {ANIMALS,HABITATS,motionOpen} from './expedition.js';
import {MOTIONS,normalizeMotionPhoto} from './inquiry.js';
import {RELAY_SECTIONS,RELAY_CONTROLS,relayAnimals,relayKind} from './relay.js';
import {animal,mori,icon,btn,esc,withParticle} from './presentation.js';

export const RELAY_TITLE='세 곳 이어달리기';
const part=(s,id)=>motionOpen(s,id)||s.adminUnlocked?MOTIONS[id].part:'';
function card(s,id,v){
 const photo=normalizeMotionPhoto(s.inquiry?.motionPhotos?.[id]),name=ANIMALS[id].name;
 return `<button type="button" class="relay-card ${v.wrong===id?'retry':''}" data-action="relay-pick" data-id="${id}"><span class="relay-card-photo">${photo?`<img src="${photo.dataURL}" alt="내가 찍은 ${name} 사진" draggable="false">`:animal(id)}</span><b>${name}</b>${photo?'<small>내가 찍은 사진</small>':''}</button>`;
}
function steps(s,v){
 return `<ol class="relay-steps" aria-label="이어달리기 구간">${RELAY_SECTIONS.map((x,i)=>{const done=v.phase==='done'||i<v.section,now=i===v.section&&v.phase!=='done',used=done?v.used?.[x.id]||s.relay?.picks?.[x.id]:'';
  return `<li class="${done?'done':now?'current':''}" ${now?'aria-current="step"':''}><i>${done?icon('check'):i+1}</i><span>${x.title}</span>${used?`<small>${ANIMALS[used].name}</small>`:''}</li>`;}).join('')}</ol>`;
}
const pad=()=>`<div class="relay-pad" role="group" aria-label="방향 버튼">${[['up','▲','위쪽으로'],['left','◀','왼쪽으로'],['right','▶','오른쪽으로'],['down','▼','아래쪽으로']].map(([d,g,l])=>`<button type="button" class="relay-dir relay-dir-${d}" data-relay-dir="${d}" aria-label="${l} 움직이기"><span aria-hidden="true">${g}</span></button>`).join('')}</div>`;
// Stage 3's last activity: the found animals cross four places one after another. use3d=false (no WebGL, ?2d):
// the same picks are made, and a picked animal crosses its place without the 3D path.
export function relayView(s,view){
 const v=view.relay||{section:0,phase:'pick'},section=RELAY_SECTIONS[v.section]||RELAY_SECTIONS[0],id=v.animal,kind=relayKind(id),control=RELAY_CONTROLS[kind],flat=!view.use3d;
 let panel='';
 if(v.phase==='pick'){
  panel=`<section class="relay-panel relay-pick" aria-labelledby="relay-title"><p class="overline">${v.section+1}/${RELAY_SECTIONS.length} 구간 · ${HABITATS[section.habitat].name}</p><h2 id="relay-title">${section.title}</h2><p>${section.scene} 이 길을 지나갈 동물을 골라 줘.</p><p class="relay-recall">${icon('search')} 그 동물은 어떤 몸 부분으로 움직였는지 떠올려 봐.</p><div class="relay-cards">${relayAnimals(s).map(a=>card(s,a,v)).join('')}</div>${v.note?`<div class="relay-note" role="status">${mori(3)}<p>${esc(v.note)}</p></div>`:''}</section>`;
 }else if(v.phase==='ready'){
  panel=`<section class="relay-panel relay-ready" aria-labelledby="relay-title"><p class="overline">${v.section+1}/${RELAY_SECTIONS.length} 구간 · ${section.title}</p><div class="relay-ready-animal">${animal(id)}<div><h2 id="relay-title">${ANIMALS[id].name}, 준비됐어!</h2><p>${esc(v.note)}</p></div></div>${flat?'':`<p class="relay-how">${icon('arrow')} ${control.help}</p>`}<div class="relay-actions">${btn('다른 동물 고르기','relay-repick','quiet')}${btn(`${flat?'이 길 지나가기':'출발'} ${icon('arrow')}`,'relay-go','primary action-cue','autofocus')}</div></section>`;
 }else if(v.phase==='done'){
  panel=`<section class="relay-panel relay-done" aria-labelledby="relay-title"><p class="overline">네 곳을 모두 지났어</p><h2 id="relay-title">${RELAY_TITLE} 완주!</h2><ul class="relay-result">${RELAY_SECTIONS.map(x=>{const a=v.used?.[x.id]||s.relay?.picks?.[x.id];return a?`<li>${animal(a)}<span><b>${x.title}</b>${ANIMALS[a].name}${part(s,a)?` · ${part(s,a)}`:''}</span></li>`:'';}).join('')}</ul><p>사는 곳마다 만난 동물이 다르고, 움직일 때 쓰는 몸 부분도 달랐어.</p><div class="relay-actions">${btn('다른 동물로 다시 하기','relay-again','secondary')}${btn(`다음으로 ${icon('arrow')}`,'advance','primary action-cue')}</div></section>`;
 }
 const run=v.phase==='run'&&!flat;
 const now=run?`<aside class="relay-now" role="status">${animal(id)}<div><b>${ANIMALS[id].name}</b>${part(s,id)?`<span>움직이는 몸 부분 <strong>${part(s,id)}</strong></span>`:''}</div></aside>${v.hint?`<div class="relay-hint" role="status">${mori(2)}<p>${control.hint}</p></div>`:`<p class="relay-help">${control.help}</p>`}`:'';
 const controls=run?`${pad()}${control.act?`<button type="button" class="relay-act" data-relay-act aria-label="${withParticle(part(s,id)||ANIMALS[id].name,'으로/로')} ${control.act}"><span>${control.act}</span></button>`:''}`:'';
 return `<div class="relay-run relay-${v.phase}">${flat?'<div class="relay-stage relay-flat"></div>':'<div class="relay-stage" data-3d="relay"><p class="scan-loading">달리기 길을 준비하고 있어…</p></div>'}<header class="relay-top">${steps(s,v)}</header>${now}${panel}${controls}</div>`;
}
