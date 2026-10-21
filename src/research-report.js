import {withParticle} from './korean.js';
import {STAGES,DOME_ZONES,ANIMALS,OBSERVATIONS,DISCOVERIES,CASES,PROBLEMS,FEATURES,STRUCTURES,PRODUCTS,countStage,reportDesigns,designTrials,revisions,discoveryCaption,observeTry,observeSummary} from './expedition.js';
import {EXPERIMENTS,MOTIONS,REFLECTIONS,experimentResult} from './inquiry.js';
import {restoredPlaces,campaignReport} from './campaign.js';

// How each observation was recorded; saves from before this was kept say so instead of guessing.
const TRY_NOTE={first:' (처음 고른 설명이 맞았어)',helped:' (다시 살펴보고 고쳐 골랐어)',unknown:' (이전 기록이라 처음 맞혔는지 알 수 없어)'};
const observeNote=s=>{const n=observeSummary(s);return `처음 고른 설명이 맞은 곳 ${n.first}곳, 다시 살펴보고 고친 곳 ${n.helped}곳${n.unknown?`, 이전 기록이라 알 수 없는 곳 ${n.unknown}곳`:''}이야.`;};
function workLines(d,status){
 const c=EXPERIMENTS[d.problem],tests=designTrials(d),feature=FEATURES.find(x=>x[0]===d.feature)?.[1],part=STRUCTURES.find(x=>x[0]===d.structure)?.[1],spot=PRODUCTS[d.problem]?.spots.find(x=>x[0]===d.spot)?.[1];
 return [`[${status}] ${d.name||'아직 이름을 짓지 않은 발명'}`,
  `내가 해결하고 싶은 문제는 “${PROBLEMS[d.problem]?.name||'아직 고르지 않았어'}”야.`,
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
  '','[발견한 환경]',...DISCOVERIES.filter(d=>s.discovered.includes(d.id)).map(d=>`${ANIMALS[d.animal].name}: ${discoveryCaption(s,d)}`),'','[더 살펴본 움직임]',...Object.values(DOME_ZONES).filter(d=>s.inquiry.motion[d.animal]!==undefined).map(d=>`${d.animalName} · ${MOTIONS[d.animal].part}: ${d.text}`),'','[동물 안내 카드]',...CASES.filter((_,i)=>s.records.cases[i]).map(c=>c.sentence),
  '','[완성해 보관한 발명]',...completed.flatMap(d=>workLines(d,'완성품')),
  ...(drafts.length?['[아직 만들고 있는 발명]',...drafts.flatMap(d=>workLines(d,'초안'))]:[]),
  ...studioLines(s),
  '[내가 도와준 일]',...campaignReport(s,true),'[친구와 나눠 볼 이야기]','어디에서 발명 아이디어를 얻었어?','누구를 도와주고 싶어?','친구의 발명과 내 발명은 어떻게 다를까?'];
}
function studioLines(s){const record=s.studioRecord||s.studio;if(!record)return [];return ['[내가 상상하고 그린 발명 — '+(s.studioRecord?'완성했어':'만들고 있어')+']',`내 작품 이름은 “${record.title||'아직 생각 중'}”야.`,...(record.audience?[`이 발명으로 도와주고 싶은 사람: ${record.audience}`]:[]),...(record.purpose?[`이렇게 쓰면 돼: ${record.purpose}`]:[]),...(record.inspiration?[`아이디어는 여기서 얻었어: ${record.inspiration}`]:[]),s.studioRecord?'내가 그린 그림과 소개 글을 전시했어.':'그림과 소개 글을 더 다듬고 있어.',''];}
