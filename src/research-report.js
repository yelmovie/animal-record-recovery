import {withParticle} from './korean.js';
import {STAGES,DOME_ZONES,ANIMALS,OBSERVATIONS,DISCOVERIES,CASES,PROBLEMS,FEATURES,STRUCTURES,PRODUCTS,countStage,reportDesigns,designTrials,revisions,discoveryCaption,observeTry,observeSummary} from './expedition.js';
import {EXPERIMENTS,MOTIONS,REFLECTIONS,experimentResult} from './inquiry.js';
import {restoredPlaces,campaignReport,COMMISSIONS,campaignDone} from './campaign.js';
import {art,esc,icon} from './presentation.js';
import {normalizeMotionPhoto} from './inquiry.js';
import {studioArtwork} from './studio-views.js';

// How each observation was recorded; saves from before this was kept are only counted in the summary line, never guessed.
const TRY_NOTE={first:' (처음 고른 설명이 맞았어)',helped:' (다시 살펴보고 고쳐 골랐어)',unknown:''};
const observeNote=s=>{const n=observeSummary(s);return `처음 고른 설명이 맞은 곳 ${n.first}곳, 다시 살펴보고 고친 곳 ${n.helped}곳${n.unknown?`, 이전 기록이라 알 수 없는 곳 ${n.unknown}곳`:''}이야.`;};
function workLines(d,status){
 const c=EXPERIMENTS[d.problem],tests=designTrials(d),feature=FEATURES.find(x=>x[0]===d.feature)?.[1],part=STRUCTURES.find(x=>x[0]===d.structure)?.[1],spot=PRODUCTS[d.problem]?.spots.find(x=>x[0]===d.spot)?.[1];
 return [`[${status}] ${d.name||'아직 이름을 짓지 않은 발명'}`,
  `내가 해결하고 싶은 문제는 ${withParticle(`“${PROBLEMS[d.problem]?.name||'아직 고르지 않았어'}”`,'이야/야')}.`,
  feature?`나는 동물의 “${feature}” 특징에서 아이디어를 얻었어.`:'어떤 동물의 특징을 빌릴지 더 생각하고 있어.',
  part&&spot?`“${part}” 부품을 ${spot}에 붙여 봤어.`:'어떤 부품을 어디에 붙일지 더 생각하고 있어.',
  ...(tests.length?[`잘 작동하는지 ${tests.length}번 시험했어.`,...(revisions(d)?[`처음에는 잘 맞지 않는 부분이 있어서 ${revisions(d)}번 다시 살펴봤어.`]:[])]:['아직 시험해 보지는 않았어.']),
  ...tests.map((t,i)=>`${i+1}번째 설계 시험: ${STRUCTURES.find(x=>x[0]===t.structure)?.[1]||'부품을 아직 고르지 않았어'} / ${PRODUCTS[t.problem]?.spots.find(x=>x[0]===t.spot)?.[1]||'자리를 아직 고르지 않았어'}. ${t.passed?'이 특징과 부품을 함께 쓸 수 있었어.':'어떤 부분을 고치면 좋을지 다시 생각했어.'}`),
  ...(d.experiment.trials.some(t=>t.problem===d.problem)?[({swim:'공평하게 비교하려고 길이와 재료, 미는 빠르기는 그대로 두고 폭만 바꿨어.',protect:'같은 재료와 두께로 만들고, 덮개가 머리를 감싸는 곳만 바꿨어.',warm:'같은 재료와 같은 온도에서, 공기를 머금는 겹의 수만 바꿨어.'})[d.problem]]:[]),
  ...d.experiment.trials.filter(t=>t.problem===d.problem).map((t,i)=>`${i+1}번째 모양 비교: ${c.levels[t.level-1]}. 나는 “${c.predictions.find(x=>x[0]===t.prediction)?.[1]||''}”라고 예상했어. 설명 그림에서는 ${experimentResult(d.problem,t.level)}을 볼 수 있었어.`),
  ...(d.experiment.reflection?[`결과를 보고 든 생각: ${REFLECTIONS.find(([value])=>value===d.experiment.reflection)?.[1]||''}`]:[]),
  ...(d.experiment.note?[`내가 알게 된 점: ${d.experiment.note}`]:[]),
  ...(d.explanation==='match'?[`이 특징을 빌린 까닭: ${c.reason}`]:[]),
  ...(d.experiment.peer?[`친구와 나눈 이야기: ${d.experiment.peer}`]:[]),''];
}
export function researchLines(s){
 const completed=reportDesigns(s),drafts=[0,1].flatMap(i=>{
  const bank={...s.designDrafts?.[i]};if(s.designs[i].problem)bank[s.designs[i].problem]=s.designs[i];
  return Object.values(bank).filter(d=>!completed.some(c=>JSON.stringify(c)===JSON.stringify(d)));
 });
 return ['나의 동물 탐험 연구 기록','하루, 모리와 함께 동물의 특징을 찾아보았어.',`지금까지 탐험 별을 ${s.activities.length}개 모았고, 마을의 장소 ${restoredPlaces(s).length}곳에 기록을 되찾아 주었어.`,'',
  ...STAGES.map(t=>`${t.name}에서 활동 ${t.tasks.length}개 중 ${countStage(s,t.id)}개를 해 보았어.`),'','[내가 관찰한 동물의 모습]',
  ...Object.entries(OBSERVATIONS).flatMap(([id,items])=>items.filter(o=>s.observed.includes(o.id)).map(o=>`${ANIMALS[id].name}의 ${withParticle(o.label)} 살펴봤어. ${o.text}${TRY_NOTE[observeTry(s,o.id)]}`)),
  ...(s.observed.length?[observeNote(s)]:[]),
  '','[발견한 환경]',...DISCOVERIES.filter(d=>s.discovered.includes(d.id)).map(d=>`${ANIMALS[d.animal].name}: ${discoveryCaption(s,d)}`),'','[내가 찍은 전시 사진]',...Object.entries(s.inquiry.motionPhotos||{}).map(([id,p])=>`${ANIMALS[id]?.name||({camel:'낙타',penguin:'펭귄'}[id])}: ${p.time.toFixed(1)}초의 순간 · 이 브라우저에 사진 보관`),'','[더 살펴본 움직임]',...Object.values(DOME_ZONES).filter(d=>s.inquiry.motion[d.animal]!==undefined).map(d=>`${d.animalName} · ${MOTIONS[d.animal].part}: ${d.text}`),'','[동물 안내 카드]',...CASES.filter((_,i)=>s.records.cases[i]).map(c=>c.sentence),
  '','[완성해 보관한 발명]',...completed.flatMap(d=>workLines(d,'완성품')),
  ...(drafts.length?['[아직 만들고 있는 발명]',...drafts.flatMap(d=>workLines(d,'초안'))]:[]),
  ...studioLines(s),
  '[내가 도와준 일]',...campaignReport(s,true),'[친구와 나눠 볼 이야기]','어디에서 발명 아이디어를 얻었어?','누구를 도와주고 싶어?','친구의 발명과 내 발명은 어떻게 다를까?'];
}
function studioLines(s){const record=s.studioRecord||s.studio;if(!record)return [];return ['[내가 상상하고 그린 발명 — '+(s.studioRecord?'완성했어':'만들고 있어')+']',`내 작품 이름은 ${withParticle(`“${record.title||'아직 생각 중'}”`,'이야/야')}.`,...(record.audience?[`이 발명으로 도와주고 싶은 사람: ${record.audience}`]:[]),...(record.purpose?[`이렇게 쓰면 돼: ${record.purpose}`]:[]),...(record.inspiration?[`아이디어는 여기서 얻었어: ${record.inspiration}`]:[]),s.studioRecord?'내가 그린 그림과 소개 글을 전시했어.':'그림과 소개 글을 더 다듬고 있어.',''];}

// Diary prose is made only from this learner's actual observations and saved work.
export function researchDiaryEntries(s){
 const entries=[],add=(title,paragraphs,animals=[],photos=[])=>{if(paragraphs.length)entries.push({title,paragraphs,animals,photos});};
 const observed=Object.entries(OBSERVATIONS).filter(([,items])=>items.some(o=>s.observed.includes(o.id)));
 add('가까이 보니 서로 달랐어',observed.map(([id,items])=>withParticle(ANIMALS[id].name)+' 가까이에서 살펴보았어. '+items.filter(o=>s.observed.includes(o.id)).map(o=>o.text).join(' ') +(items.some(o=>observeTry(s,o.id)==='helped')?' 처음에는 놓친 부분도 다시 보고 고쳐 골랐어.':'')),observed.slice(0,2).map(([id])=>id));
 if(s.activities.some(a=>a.startsWith('2-')))add('내 기준으로 모아 보았어',['동물의 몸에서 확인할 수 있는 특징을 기준으로 나누어 보았어.'+(s.activities.includes('2-3')?' 기준이 달라지면 같은 동물도 다른 무리에 놓일 수 있다는 것을 살펴보았어.':'')]);
 const discovered=DISCOVERIES.filter(d=>s.discovered.includes(d.id)),photos=Object.entries(s.inquiry.motionPhotos||{}).filter(([,p])=>normalizeMotionPhoto(p));
 add('동물이 살아가는 모습을 보았어',discovered.map(d=>discoveryCaption(s,d)),discovered.slice(0,2).map(d=>d.animal),photos);
 if(!discovered.length&&photos.length)add('내가 고른 순간을 사진에 담았어',['동물이 움직이는 영상을 보고, 내가 더 살펴보고 싶은 순간을 사진으로 남겼어.'],[],photos);
 const solved=CASES.filter((_,i)=>s.records.cases[i]);
 add('탐정처럼 단서를 이어 보았어',solved.map(c=>'몸의 특징과 사는 곳의 단서를 함께 생각하며 '+withParticle(ANIMALS[c.animal].name)+' 찾아냈어. '+c.sentence),solved.map(c=>c.animal));
 const completed=reportDesigns(s),designs=[...completed,...s.designs.filter(d=>(d.name||d.feature)&&!completed.some(c=>JSON.stringify(c)===JSON.stringify(d)))];
 for(const d of designs){const done=completed.includes(d),feature=FEATURES.find(x=>x[0]===d.feature)?.[1],part=STRUCTURES.find(x=>x[0]===d.structure)?.[1];add(done?'동물에게 아이디어를 빌렸어':'만들고 있는 아이디어도 남겨 두었어',[`내가 ${done?'만든':'만들고 있는'} 발명의 이름은 ${withParticle('“'+(d.name||'아직 생각 중인 발명')+'”','이야/야')}.`,...(feature?[feature+'에서 아이디어를 얻었어. '+(part?withParticle(part)+' 만들어 문제를 해결해 '+(done?'보았어.':'보려고 해.'):'' )]:[]),...(d.experiment.note?['시험을 하고 이렇게 생각했어. “'+d.experiment.note+'”']:[])]);}
 const studio=s.studioRecord||s.studio;
 if(studio&&(studio.title||studio.strokes?.length)){add('내 상상을 그림으로 남겼어',[`내 작품 이름은 ${withParticle('“'+(studio.title||'아직 생각 중')+'”','이야/야')}.`,...(studio.audience?['이 발명으로 '+withParticle(studio.audience)+' 도와주고 싶어.']:[]),...(studio.purpose?[studio.purpose]:[]),...(studio.inspiration?['아이디어는 이렇게 떠올렸어. '+studio.inspiration]:[])]);entries.at(-1).artwork=studio;}
 const helpStories=['관찰한 몸의 특징을 다시 살펴보고, 동물에게 맞는 설명으로 전시대를 준비해 주었어.','동물의 특징을 기준으로 묶어 보고, 그 기준에 맞는 전시 자리를 찾아 주었어.','어디에 살고 어떤 몸 부분으로 움직이는지, 내가 만난 동물들을 방송 원고로 소개했어.','이름표가 떨어진 기록의 주인을 찾아 주었어. 비슷해 보여도 서로 다른 특징을 함께 살펴보는 게 도움이 됐어.',s.studioRecord?'내 그림과 소개를 전시관에 보냈어. 친구들도 내 아이디어를 만나면 좋겠어.':'손님에게 필요한 발명품을 다시 시험해 보고, 알맞은 모양과 그 까닭을 알려 주었어.'];
 const helped=COMMISSIONS.filter(c=>[0,1].some(i=>campaignDone(s,c.id,i))).map(c=>c.npc+'에게서 온 부탁도 도와주었어. '+helpStories[c.id-1]);if(helped.length)add('내 기록이 누군가에게 도움이 되었어',helped);
 if(!entries.length)add('첫 장을 펼치며',['이 노트에 내가 만난 동물 이야기를 남기고 싶어. 하루, 모리와 함께 어떤 동물을 만나게 될까?','동물을 자세히 살펴보고 발견한 것이 생기면, 이곳에 나의 탐험 이야기가 이어질 거야.']);
 return entries;
}
// Key result and next step before the long story; each diary chapter opens on request.
const diarySummary=s=>{const art=s.studioRecord;return '<div class="diary-summary"><p><b>'+icon('star')+' 탐험 별 '+s.activities.length+'/'+STAGES.flatMap(t=>t.tasks).length+' · 되찾은 장소 '+restoredPlaces(s).length+'/5</b>'+(art?' · 내 작품 “'+esc(art.title)+'”':'')+'</p><p class="diary-next">다음 할 일: 제목을 눌러 장을 펼쳐 읽고, 가장 기억에 남는 발견 하나를 친구에게 소개해 봐.</p></div>';};
export function researchDiaryView(s){
 return '<article class="research-diary"><header class="diary-cover"><span>'+icon('leaf')+' 나의 자연 탐험 노트</span><h3>작은 발견을 모아 쓴 이야기</h3><p>하루, 모리와 함께 살펴보고 생각한 것을 남겼어.</p></header>'+diarySummary(s)+'<div class="diary-pages" tabindex="0" role="region" aria-label="나의 탐험 일기 본문">'+researchDiaryEntries(s).map(e=>'<details class="diary-entry"><summary><h3>'+esc(e.title)+'</h3></summary>'+(e.animals.length?'<div class="diary-stickers" aria-hidden="true">'+e.animals.map(id=>art(id,'diary-animal',true)).join('')+'</div>':'')+e.paragraphs.map(p=>'<p>'+esc(p)+'</p>').join('')+(e.photos.length?'<div class="diary-photo-strip">'+e.photos.map(([id,p])=>'<figure><img src="'+p.dataURL+'" width="'+p.width+'" height="'+p.height+'" alt="내가 찍은 '+esc(ANIMALS[id]?.name||({camel:'낙타',penguin:'펭귄'}[id]))+' 사진"><figcaption>'+esc(ANIMALS[id]?.name||({camel:'낙타',penguin:'펭귄'}[id]))+'의 순간을 담았어</figcaption></figure>').join('')+'</div>':'')+(e.artwork?'<div class="diary-artwork">'+studioArtwork(e.artwork)+'</div>':'')+'</details>').join('')+'<footer class="diary-signoff">다음에는 어떤 동물의 특징을 더 살펴볼까?<br><b>나의 탐험은 계속!</b></footer></div></article>';
}
