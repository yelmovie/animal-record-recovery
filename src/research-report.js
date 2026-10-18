import {STAGES,DOME_ZONES,ANIMALS,OBSERVATIONS,DISCOVERIES,CASES,PROBLEMS,FEATURES,STRUCTURES,PRODUCTS,countStage,reportDesigns,designTrials,revisions} from './expedition.js';
import {EXPERIMENTS,MOTIONS,REFLECTIONS,experimentResult} from './inquiry.js';
import {restoredPlaces,campaignReport} from './campaign.js';

function workLines(d,status){
 const c=EXPERIMENTS[d.problem],tests=designTrials(d);
 return [`[${status}] ${d.name||PROBLEMS[d.problem]?.product||'이름 없는 초안'}`,
  `문제: ${PROBLEMS[d.problem]?.name||'선택 전'}`,
  `동물 특징: ${FEATURES.find(x=>x[0]===d.feature)?.[1]||'선택 전'}`,
  `구조: ${STRUCTURES.find(x=>x[0]===d.structure)?.[1]||'선택 전'}`,
  `부품 위치: ${PRODUCTS[d.problem]?.spots.find(x=>x[0]===d.spot)?.[1]||'배치 전'}`,
  `시험 ${tests.length}회 · 수정이 필요했던 시험 ${revisions(d)}회 · 설계선 ${d.strokes.length}개`,
  ...tests.map((t,i)=>`설계 시험 ${i+1}: ${STRUCTURES.find(x=>x[0]===t.structure)?.[1]||'부품 없음'} / ${PRODUCTS[t.problem]?.spots.find(x=>x[0]===t.spot)?.[1]||'배치 전'} → ${t.passed?'특징·구조·위치 연결됨':'조건을 다시 확인하고 수정 필요'}`),
  `비교 시험 조건: ${c?.condition||'선택 전'}`,
  ...d.experiment.trials.filter(t=>t.problem===d.problem).map((t,i)=>`비교 시험 ${i+1}: ${c.levels[t.level-1]} · 예상: ${c.predictions.find(x=>x[0]===t.prediction)?.[1]||''} · 모형 결과: ${experimentResult(d.problem,t.level)}`),
  `예상과 비교: ${REFLECTIONS.find(([value])=>value===d.experiment.reflection)?.[1]||'아직 정리하지 않음'}`,
  `알게 된 점: ${d.experiment.note||'작성 전'}`,
  `발명 이유: ${d.explanation==='match'?c?.reason||'':'아직 설명하지 않음'}`,
  `친구 의견(선택): ${d.experiment.peer||'입력하지 않음 — 협력 활동의 증거로 판정하지 않음'}`,''];
}
export function researchLines(s){
 const completed=reportDesigns(s),drafts=[0,1].flatMap(i=>{
  const bank={...s.designDrafts?.[i]};if(s.designs[i].problem)bank[s.designs[i].problem]=s.designs[i];
  return Object.values(bank).filter(d=>!completed.some(c=>JSON.stringify(c)===JSON.stringify(d)));
 });
 return ['동물기록 복구작전 — 하루와 모리의 탐험 기록','이 기기 브라우저에 저장된 기록의 사본',`탐험 별 ${s.activities.length}/${STAGES.flatMap(t=>t.tasks).length} · 복구 장소 ${restoredPlaces(s).length}/5`,'',
  ...STAGES.map(t=>`${t.name}: ${countStage(s,t.id)}/${t.tasks.length} 활동`),'','[관찰한 특징]',
  ...Object.entries(OBSERVATIONS).flatMap(([id,items])=>items.filter(o=>s.observed.includes(o.id)).map(o=>`${ANIMALS[id].name} · ${o.label}: ${o.text}`)),
  '','[발견한 환경]',...DISCOVERIES.filter(d=>s.discovered.includes(d.id)).map(d=>`${ANIMALS[d.animal].name}: ${d.text}`),'','[더 살펴본 움직임]',...Object.values(DOME_ZONES).filter(d=>s.inquiry.motion[d.animal]!==undefined).map(d=>`${d.animalName} · ${MOTIONS[d.animal].part}: ${d.text}`),'','[동물 안내 카드]',...CASES.filter((_,i)=>s.records.cases[i]).map(c=>c.sentence),
  '','[완성해 보관한 발명]',...completed.flatMap(d=>workLines(d,'완성품')),
  ...(drafts.length?['[작업 중인 초안 — 완성품 인증에 포함되지 않음]',...drafts.flatMap(d=>workLines(d,'초안'))]:[]),
  '[내 전시관 의뢰 기록]',...campaignReport(s),'[소개하기 — 선택 활동]','어떤 동물의 특징을 빌렸어?','첫 시험에서 무엇을 고쳤어?','친구의 발명과 내 발명은 어떻게 다를까?'];
}
