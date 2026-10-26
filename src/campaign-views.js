import {COMMISSIONS,SORT_KEYS,RETEST,commission,campaignDraft,campaignDone,campaignOpen,missionRows,designProblem,restoredPlaces,requestCount,requestParts,requestCards,cardDone,cardProgress,firstOpenCard} from './campaign.js';
import {STAGES,ANIMALS,OBSERVATIONS,CRITERIA,HABITATS,DISCOVERIES,reportDesigns,PROBLEMS,isStageOpen} from './expedition.js';
import {animal,art,mori,icon,btn,esc,villageURL,withParticle} from './presentation.js';
import {experimentDiagram} from './inquiry-views.js';
import {studioArtwork} from './studio-views.js';
import {conceptButton} from './concept-video.js';
import {normalizeMotionPhoto,MOTIONS} from './inquiry.js';

export const npcPortrait=(c,cls='')=>`<img class="commission-npc ${cls}" data-npc="${c.portrait}" src="${new URL('../assets/residents/'+c.portrait+'-v2.webp',import.meta.url).href}" alt="${c.npc}" decoding="async" draggable="false">`;
const choiceButton=(r,o,d)=>btn('<i class="choice-mark" aria-hidden="true">'+(d.answers[r.key]===o[0]?icon('check'):'')+'</i>'+(ANIMALS[o[0]]&&!r.animal?animal(o[0]):'')+'<span>'+esc(o[1])+'</span>','commission-choice',`choice commission-choice ${d.answers[r.key]===o[0]?'selected':''}`,`data-key="${r.key}" data-value="${o[0]}" aria-pressed="${d.answers[r.key]===o[0]}"`);
// The learner's own sorting rule lives in request 2-1; saves from the older four-step garden kept it in sorts[1].
export function ownSortSummary(s){const d=s.campaign?.records?.['2-1'],split=(ids,pick)=>({yes:ids.filter(id=>pick(id)==='yes'),no:ids.filter(id=>pick(id)==='no')});
 if(d&&SORT_KEYS[d.answers.criterion])return {label:SORT_KEYS[d.answers.criterion],...split(missionRows(s,2,1,d).map(r=>r.key),id=>d.answers[id])};
 if(CRITERIA[s.criteria?.[1]]&&Object.keys(s.sorts?.[1]||{}).length)return {label:CRITERIA[s.criteria[1]],...split(Object.keys(s.sorts[1]),id=>s.sorts[1][id])};
 return null;}
export function commissionTabs(s,stage,index){return `<nav class="commission-tabs" aria-label="이 장소의 탐험 순서">${btn(`탐험 · 별 ${STAGES[stage-1].tasks.length}개`,'replay-stage','quiet',`data-id="${stage}"`)}${btn('주민의 부탁'+(campaignDone(s,stage,0)&&campaignDone(s,stage,1)?' ✓':''),'commission-part',index<2?'selected':'quiet',`data-value="0" aria-current="${index<2?'step':'false'}"`)}${btn('마지막 도전'+(campaignDone(s,stage,2)?' ✓':''),'commission-open',index===2?'selected':'quiet',`data-id="${stage}" data-value="2" ${!campaignOpen(s,stage,2)?'disabled':''} aria-current="${index===2?'step':'false'}"`)}</nav>`;}
export function commissionLetter(s,id){if(id===5&&s.studioRecord)return studioLetter(s);const c=COMMISSIONS[id-1],paragraphs=id===5?[
 '방금 완성한 '+(PROBLEMS[designProblem(s,1)]?.product||'발명품')+' 잘 봤어. 공방 손님에게 맞게 다듬어 줄래? 동물에게서 빌린 구조를 바꿔 보고, 서로 다른 모양을 시험해 더 알맞은 것을 골라 줘.',
 '먼저 만들었던 '+(PROBLEMS[designProblem(s,0)]?.product||'발명품')+'도 부탁해. 시험 결과를 비교해서 손님에게 알맞은 모양과 그 까닭을 알려 주면 좋겠어.',
 ]:c.letter;return `<article class="resident-letter">
  <div class="letter-sender">${npcPortrait(c)}<div><small>보낸 사람</small><b>${c.npc}</b></div></div>
  <h3>${c.title}</h3><p class="letter-greeting">하루, 모리, 그리고 탐험대에게.</p>
  <div class="letter-body" tabindex="0" role="region" aria-label="${c.npc}의 편지 본문">
  ${paragraphs.map(text=>`<p>${esc(text)}</p>`).join('')}
  <p>부탁을 해결해 주면 고마운 마음을 담아 ${withParticle(STAGES[id-1].reward,'과/와')} ${c.badge} 배지를 줄게.</p>
  </div>
  <p class="letter-signature">답장을 기다릴게.<br><b>${c.npc} 보냄</b></p>
  <div class="dialog-actions">${btn('잠깐 뒤에','close-dialog','quiet')}${btn('부탁 도와주기 '+icon('arrow'),'commission-accept','primary',`data-id="${id}"`)}</div>
 </article>`;}
export function commissionPreview(s,id){const c=COMMISSIONS[id-1],n=[0,1].filter(i=>campaignDone(s,id,i)).length;return `<section class="commission-preview">${npcPortrait(c)}<div><small>${c.npc}의 부탁</small><h3>${id===5&&s.studioRecord?'네 상상을 전시해 줄래?':c.title}</h3><p>탐험하고 · 부탁을 해결하고 · 전시관 열기</p><span>${n===2?'답장 보냄':'부탁 해결 중'} · ${c.exhibit}</span></div></section>`;}
function studioIntroduction(record){return `<div class="studio-introduction"><h2>${esc(record.title)}</h2><dl><dt>누구를 위한 발명이야?</dt><dd>${esc(record.audience)}</dd><dt>어떻게 쓰면 될까?</dt><dd>${esc(record.purpose)}</dd><dt>어디에서 아이디어를 얻었어?</dt><dd>${esc(record.inspiration)}</dd></dl></div>`;}
function studioLetter(s){const c=COMMISSIONS[4];return `<article class="resident-letter">
 <div class="letter-sender">${npcPortrait(c)}<div><small>보낸 사람</small><b>${c.npc}</b></div></div>
 <h3>네 상상을 전시해 줄래?</h3><p class="letter-greeting">하루, 모리, 그리고 탐험대에게.</p>
 <div class="letter-body" tabindex="0" role="region" aria-label="${c.npc}의 편지 본문">
 <p>네가 직접 그린 ‘${esc(s.studioRecord.title)}’을 봤어. 공방에 찾아오는 친구들도 네 아이디어를 만나면 좋겠어!</p>
 <p>네 그림과 소개를 전시관에 걸고 싶어. 어떤 생각을 담았는지 다시 살펴보고, 준비가 되면 나에게 답장을 보내 줄래?</p>
 <p>아직 만들어 보지 못한 상상도 괜찮아. 네 생각이 담긴 그림이면 충분해.</p></div><p class="letter-signature">새로운 발명가의 작품을 기다리며,<br><b>${c.npc} 보냄</b></p>
 <div class="dialog-actions">${btn('잠깐 뒤에','close-dialog','quiet')}${btn('내 작품 살펴보기 '+icon('arrow'),'commission-accept','primary','data-id="5"')}</div></article>`;}
function studioExhibitionView(s,v){const c=COMMISSIONS[4],done=[0,1].every(i=>campaignDone(s,5,i)),record=s.studioRecord;return `<main id="main" tabindex="-1" class="commission-page unified-request stage-5 studio-exhibition-page">
 <div class="commission-layout"><aside class="client-card">${npcPortrait(c)}<div><small>${c.npc}의 부탁</small><h1>네 상상을 전시해 줄래?</h1></div><p>네 그림과 네 목소리로 공방 전시를 완성해 줘.</p>${btn('편지 다시 읽기','commission-letter','quiet','data-id="5"')}${commissionTabs(s,5,0)}</aside>
 <section class="commission-work"><div class="request-parts single-part"><section class="request-part" data-request-part="0"><header class="request-part-heading"><h2>내 작품 전시 준비</h2><span>${done?'전시 중':'그림과 소개를 함께 보내요'}</span></header><p class="request-part-intro">동물에게 얻은 아이디어가 너만의 발명이 되었어. 친구에게 보여 주고 싶은 부분을 떠올리며 살펴봐.</p><div class="studio-exhibition"><div class="studio-exhibition-preview">${studioArtwork(record)}</div>${studioIntroduction(record)}</div>${btn(icon('download')+' 작품 카드 저장','studio-download','secondary')}</section></div>
 <div class="commission-feedback ${v.feedback?.good?'good':''} ${v.feedback?'has-feedback':''}" role="status"><button type="button" class="buddy-toggle" aria-label="모리에게 할 일 물어보기">${mori(7)}</button><p>${esc(v.feedback?.text||(done?'네 작품이 전시관에 걸렸어. 그림과 소개를 언제든 다시 볼 수 있어.':'준비됐다면 아래 버튼을 눌러 도윤에게 네 작품을 보내 줘.'))}</p></div>
 <footer class="commission-footer">${btn('지도 보기','map','quiet')}${done?btn('복구된 공방 보기 '+icon('arrow'),'commission-next','primary'):btn('내 작품 전시하기 '+icon('arrow'),'commission-submit','primary')}</footer></section></div></main>`;}
function rowView(r,d,index,v={},label=r.label){const current=v.focusRow===r.key;return `<fieldset class="record-row ${d.answers[r.key]?'filled':''} ${v.feedback?.wrong?.includes('row:'+r.key)?'retry':''} ${current?'is-current':''}" data-row="${r.key}" ${v.subjectId?'aria-describedby="'+v.subjectId+'"':''}><legend><span>${index+1}</span> ${label}${v.subjectId?'<small class="broadcast-row-state">'+(current?'여기서 골라 봐':d.answers[r.key]?'선택했어':'이어서 골라 줘')+'</small>':''}</legend><div class="record-options">${r.options.map(o=>choiceButton(r,o,d)).join('')}</div></fieldset>`;}
function repairView(s,stage,index,d){const rows=missionRows(s,stage,index,d),groups=new Map();for(const r of rows){const a=r.animal||'common';if(!groups.has(a))groups.set(a,[]);groups.get(a).push(r);}return `<div class="repair-wall">${[...groups].map(([a,list])=>`<article class="repair-board">${a!=='common'?`<div class="board-specimen">${animal(a)}<b>${ANIMALS[a].name}</b></div>`:'<div class="board-specimen comparison-symbol">'+icon('search')+'<b>비교 안내판</b></div>'}<div>${list.map(r=>rowView(r,d,rows.indexOf(r))).join('')}</div></article>`).join('')}</div>`;}
function sortCard(r,d,v){return `<button class="arrival-card ${v.picked?.id===r.key?'picked':''}" data-action="pick" data-id="${r.key}" data-ref="arrival-${r.key}" data-drag="true" aria-pressed="${v.picked?.id===r.key}">${animal(r.animal)}<b>${r.label}</b><small>${ANIMALS[r.animal].fact}</small></button>`;}
function sortView(s,stage,index,d,v){const m=commission(stage,index),rows=missionRows(s,stage,index,d);return `<div class="arrival-sort">${m.kind==='own-sort'?`<fieldset class="criterion-chooser"><legend>내가 정하는 분류 기준</legend><div>${Object.entries(SORT_KEYS).map(([value,label])=>btn(label,'commission-choice',d.answers.criterion===value?'selected':'quiet',`data-key="criterion" data-value="${value}" aria-pressed="${d.answers.criterion===value}"`)).join('')}</div></fieldset>`:`<h2 class="sort-question">${m.criterion}</h2>`}<p class="interaction-note">${v.picked&&ANIMALS[v.picked.id]?`<b class="pick-status">${ANIMALS[v.picked.id].name} 카드를 골랐어 → O·X 칸을 눌러 줘</b>`:'동물 카드를 끌어 옮기거나, 카드를 누르고 O·X 칸을 눌러도 돼.'}</p><div class="arrival-pool" aria-label="아직 분류하지 않은 동물">${rows.filter(r=>!d.answers[r.key]).map(r=>sortCard(r,d,v)).join('')||'<span>네 동물이 모두 자리를 찾았어.</span>'}</div><div class="arrival-bins">${yesNoBins(rows,d,v)}</div></div>`;}
function yesNoBins(rows,d,v){return [['yes','O'],['no','X']].map(([value,label])=>`<section class="arrival-bin" data-action="place" data-drop-action="commission-sort" data-zone="${value}"><h3><button class="bin-place" data-action="place" data-drop-action="commission-sort" data-zone="${value}" aria-label="${label} 칸에 선택한 동물 놓기"><span class="sort-symbol">${label}</span> <small>여기에 놓기</small></button></h3><div>${rows.filter(r=>d.answers[r.key]===value).map(r=>sortCard(r,d,v)).join('')||'<span>이곳에 놓기</span>'}</div></section>`).join('');}
function broadcastView(s,stage,index,d){const rows=missionRows(s,stage,index,d);return `<div class="broadcast-desk"><div class="broadcast-label">${icon('sound')} 생태 탐방 방송국 <span>사는 곳 → 몸 → 생활</span></div>${[...new Set(rows.map(r=>r.animal||'extra'))].map(id=>`<article class="broadcast-strip">${id!=='extra'?`<div class="broadcast-animal">${animal(id)}<b>${ANIMALS[id].name}</b></div>`:''}<div class="broadcast-chain">${rows.filter(r=>(r.animal||'extra')===id).map(r=>rowView(r,d,rows.indexOf(r))).join('')}</div></article>`).join('')}<p class="interaction-note">완성된 방송 원고는 전시관에 남아. 친구에게 이어서 읽어 줘.</p></div>`;}
function returnView(s,stage,index,d){const rows=missionRows(s,stage,index,d);return `<div class="lost-records">${rows.map((r,i)=>`<article class="lost-paper"><small>${i%2?'근거 확인':'이름표가 떨어진 기록'}</small>${rowView(r,d,i)}${i%2===0&&index!==2?`<div class="record-candidates">${r.options.filter(o=>ANIMALS[o[0]]).map(o=>`<span class="${d.answers[r.key]===o[0]?'selected':''}">${animal(o[0])}<b>${o[1]}</b></span>`).join('')}</div>`:''}</article>`).join('')}</div>`;}
function retestDiagram(problem,level){return experimentDiagram(problem,level,false);}
function retestView(s,index,d){const p=designProblem(s,index),r=RETEST[p],tried=i=>d.trials.find(t=>t.problem===p&&t.level===i+1);if(!r)return '<p>먼저 탐색에서 두 발명품을 완성해 줘.</p>';return `<div class="request-lab"><blockquote><b>${esc(withParticle(PROBLEMS[p]?.product||r.name))} 쓸 손님의 부탁</b><p>${r.request}</p></blockquote><div class="request-lab-grid"><section class="retest-controls"><h2>${esc((s.records.designs[index]||s.designs[index]).name||r.name)}</h2><div class="retest-model">${retestDiagram(p,d.level)}</div><fieldset><legend>바꿀 모양</legend><div class="inline-options">${r.levels.map((label,i)=>btn(label,'commission-level',d.level===i+1?'selected':'quiet',`data-value="${i+1}" aria-pressed="${d.level===i+1}"`)).join('')}</div></fieldset><fieldset><legend>${r.metrics[0]}: 가장 작은 모양과 비교하면?</legend><div class="inline-options">${[['more','더 커질 것 같아'],['same','같을 것 같아'],['less','더 작아질 것 같아']].map(([value,label])=>btn(label,'commission-predict',d.prediction===value?'selected':'quiet',`data-value="${value}" aria-pressed="${d.prediction===value}"`)).join('')}</div></fieldset>${btn('이 모양 시험하기 '+icon('arrow'),'commission-trial','primary')}</section><section class="retest-results"><h3>같은 조건에서 모양만 바꿨어</h3><p>${r.note}</p><table class="retest-table"><caption>설명 모형의 상대 비교 · 1칸 적음 / 2칸 중간 / 3칸 많음</caption><thead><tr><th scope="col">손님에게 보낼 모양</th>${r.levels.map((label,i)=>`<th scope="col">${choiceButton({key:'choice'},[String(i+1),label],d)}</th>`).join('')}</tr></thead><tbody><tr><th scope="row">내 예상</th>${r.levels.map((_,i)=>`<td>${tried(i)?({more:'더 큼',same:'같음',less:'더 작음'})[tried(i).prediction]:'<small>시험 전</small>'}</td>`).join('')}</tr>${r.metrics.map((m,k)=>`<tr><th scope="row">${m}</th>${r.levels.map((_,i)=>{const n=r.values[i][k];return `<td>${tried(i)?`<span class="result-bars" aria-label="3칸 중 ${n}칸">${[1,2,3].map(j=>`<i class="${j<=n?'filled':''}"></i>`).join('')}</span>`:'<span class="untested" aria-label="아직 시험 전">?</span>'}</td>`;}).join('')}</tr>`).join('')}</tbody></table>${rowView({key:'reason',label:'이렇게 고른 이유',options:[['big','무조건 가장 큰 것이 좋아서'],['fit',r.reason],['looks','색깔이 마음에 들어서']]},d,0)}</section></div></div>`;}
// Every notebook is a set of pages with index tabs; adventure-app turns them in place (no re-render, no scrolling inside a page).
function noteBook(pages,cls){return `<div class="${cls} note-book"><nav class="note-tabs" aria-label="관찰 노트 장 넘기기">${pages.length>1?pages.map((p,i)=>btn(p.tab,'note-page',i?'':'on',`data-value="${i}" aria-pressed="${!i}"`)).join(''):''}</nav>${pages.map((p,i)=>`<article class="note-page${i?'':' on'}"${i?' hidden':''}>${p.html}</article>`).join('')}</div>`;}
const noteLines=lines=>'<ul class="note-lines">'+lines.map(t=>'<li>'+t+'</li>').join('')+'</ul>';
function evidenceView(s,stage,index){
 if(stage===1||stage===2){const ids=stage===1?(index===0?['frog','crab']:['duck','rabbit']):['hen','bat','bee','snail'];
  return noteBook(ids.map(id=>{const lines=stage===1?(OBSERVATIONS[id]||[]).filter(o=>s.observed.includes(o.id)).map(o=>o.text):[ANIMALS[id].fact];return {tab:ANIMALS[id].name,html:`${animal(id)}<b>${ANIMALS[id].name}</b>${noteLines((lines.length?lines:['탐색에서 몸의 특징을 먼저 기록해 줘.']).map(esc))}`};}),'evidence-photos');}
 if(stage===3||stage===4){const items=DISCOVERIES.filter(d=>s.discovered.includes(d.id)).map(d=>`<b>${HABITATS[d.habitat].name}</b> ${d.text}${s.inquiry.motion[d.animal]===1?' · 움직임 기록 있음':''}`);
  // ponytail: two findings per page fits the 4:3 sheet at the large hand font; a longer finding text would need one per page.
  const pages=[];for(let i=0;i<items.length;i+=2)pages.push({tab:(pages.length+1)+'쪽',html:noteLines(items.slice(i,i+2))});
  return noteBook(pages.length?pages:[{tab:'1쪽',html:noteLines(['탐색에서 동물을 발견하면 이곳에 기록이 남아.'])}],'evidence-list');}
 return noteBook([{tab:'1쪽',html:noteLines(['물갈퀴 → 물을 미는 넓은 면','등딱지 → 몸을 감싸는 덮개','촘촘한 털 → 공기를 머금는 겹'])}],'evidence-list');
}
export function requestMission(s,stage,index){
 const m=commission(stage,index);if(stage!==5||index===2)return m;
 const p=designProblem(s,index),product=PROBLEMS[p]?.product||'발명품',source={swim:'오리의 물갈퀴',protect:'거북의 등딱지',warm:'북극곰의 털'}[p]||'동물의 특징';
 return {...m,title:product+' 다시 시험하기',intro:(index===1?'방금 완성한 ':'먼저 만들었던 ')+product+'이야. '+source+'에서 빌린 구조를 손님의 부탁에 맞게 바꿔 봐.'};
}
function requestWork(s,stage,index,v){const m=commission(stage,index),d=campaignDraft(s,stage,index);
 if(m.kind==='sort'||m.kind==='own-sort')return sortView(s,stage,index,d,v);
 if(m.kind==='broadcast')return broadcastView(s,stage,index,d);
 if(m.kind==='return')return returnView(s,stage,index,d);
 if(m.kind==='retest')return retestView(s,index,d);
 return repairView(s,stage,index,d);
}
const short=label=>label.split(' · ').pop();
const RESULT_TITLES={repair:'전시 설명판',broadcast:'방송 원고',return:'안내 카드'};
// Read the learner's selected options, including incomplete or incorrect drafts.
// A broadcast must never fill an unanswered line with the expected answer.
export function broadcastScript(rows,d){
 const picked=r=>r?.options.find(o=>o[0]===d.answers[r.key])?.[1]||'';
 const blocks=[{cue:'오프닝',text:'탐방대 여러분, 안녕하세요! 레인저 하늘이에요.'}];
 const groups=new Map();for(const r of rows){const id=r.animal||r.key;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(r);}
 for(const [id,list]of groups){
  if(!list.some(r=>r.key.endsWith('-place'))){const r=list[0],choice=picked(r);blocks.push({cue:'현장 중계',text:withParticle(r.label)+' 보세요. '+(choice?choice+'요.':'〔설명을 골라 주세요〕')});continue;}
  const name=ANIMALS[id].name,place=picked(list.find(r=>r.key.endsWith('-place'))),body=picked(list.find(r=>r.key.endsWith('-body'))),life=picked(list.find(r=>r.key.endsWith('-life')));
  const scene='오늘은 '+(place||'〔사는 곳〕')+'에서 '+withParticle(name)+' 만났어요.';
  const action='자, '+withParticle(body||'〔몸의 부분〕')+' 보세요. '+withParticle(name,'은/는')+' '+(life?life+'요.':'〔움직임〕');
  blocks.push({cue:name+' 현장',text:scene+' '+action});
 }
 blocks.push({cue:'클로징',text:'몸의 특징과 움직임을 함께 관찰해 보세요. 다음 탐방에서 또 만나요!'});
 return blocks;
}
const broadcastCopy=(rows,d)=>'<div class="broadcast-copy">'+broadcastScript(rows,d).map(b=>'<p><span class="broadcast-cue">'+esc(b.cue)+'</span> '+esc(b.text)+'</p>').join('')+'</div>';
function broadcastResult(c,d,done){return `<aside class="card-result ${done?'complete':''} kind-broadcast" aria-live="polite"><header class="broadcast-heading"><div><small>${icon('sound')} 레인저 하늘의 생태 탐방</small><h3>${c.animal?esc(ANIMALS[c.animal].name)+' 현장 방송 원고':'특별 탐방 방송 원고'}</h3></div>${c.animal?animal(c.animal,'broadcast-thumbnail'):''}</header>${broadcastCopy(c.rows,d)}<p class="card-stamp">${done?icon('check')+' 다 골랐어 · 답장으로 확인해':'내가 고른 내용으로 원고를 채워 봐'}</p></aside>`;}
// What visitors will see, filled only with the learner's own picks (blank until chosen, never the answer).
function cardResult(c,d,challenge){const done=c.rows.every(r=>d.answers[r.key]);if(c.kind==='broadcast')return broadcastResult(c,d,done);return `<aside class="card-result ${done?'complete':''} kind-${c.kind}" aria-live="polite"><h3>${icon(c.kind==='broadcast'?'sound':'book')} ${challenge&&c.kind==='repair'?'고친 문장':RESULT_TITLES[c.kind]}</h3>${c.animal&&ANIMALS[c.animal]?`<div class="card-result-animal">${animal(c.animal)}<b>${ANIMALS[c.animal].name}</b></div>`:''}<ol>${c.rows.map(r=>{const o=r.options.find(o=>o[0]===d.answers[r.key]);return `<li class="${o?'filled':''}"><small>${esc(short(r.label))}</small>${o?(ANIMALS[o[0]]&&!r.animal?animal(o[0]):'')+'<b>'+esc(o[1])+'</b>':'<b class="blank">빈칸</b>'}</li>`;}).join('')}</ol><p class="card-stamp">${done?icon('check')+' 다 골랐어 · 답장으로 확인해':'고를 때마다 여기에 채워져'}</p></aside>`;}
function cardName(s,stage,cards,c){const same=cards.filter(x=>x.part===c.part);if(same.length===1)return requestMission(s,stage,c.part).title;if(c.animal&&ANIMALS[c.animal])return ANIMALS[c.animal].name;if(c.kind==='return')return '기록 '+(cards.filter(x=>x.kind==='return').indexOf(c)+1);return '같은 점';}
function broadcastCard(s,c,d,v){
 const name=ANIMALS[c.animal].name,photo=normalizeMotionPhoto(s.inquiry.motionPhotos?.[c.animal]);
 const chosen=c.rows.filter(r=>d.answers[r.key]).length,ready=chosen===c.rows.length;
 const retry=c.rows.find(r=>v.feedback?.wrong?.includes('row:'+r.key));
 const current=retry||c.rows.find(r=>!d.answers[r.key]),index=c.rows.indexOf(current);
 const questions=['사는 곳','몸의 부분','움직이는 방법'];
 const guide=current?[withParticle(name,'은/는')+' 어디에 살까?',withParticle(name,'은/는')+' 어떤 몸 부분을 쓸까?',withParticle(name,'은/는')+' 어떻게 움직일까?'][index]:name+' 소개를 모두 채웠어!';
 const visual=photo?'<img class="broadcast-focus-photo" src="'+photo.dataURL+'" width="'+photo.width+'" height="'+photo.height+'" alt="내가 찍은 '+name+' 관찰 사진">':animal(c.animal);
 const next=v.broadcastNext,action=v.broadcastSubmitted?'gallery':next?'request-card':'commission-submit',label=v.broadcastSubmitted?'전시관에서 보기':next?next.name+' 설명 고르기':'답장 보내기';
 return `<div class="card-body broadcast-workspace" data-broadcast-animal="${c.animal}">
  <aside class="broadcast-subject"><div class="broadcast-subject-heading"><span>지금 소개할 동물</span><h3 id="broadcast-subject-name">${name}</h3></div><div class="broadcast-subject-visual">${visual}</div><p>${photo?'내가 찍은 사진을 자세히 살펴봐.':'동물의 모습을 자세히 살펴봐.'}</p><div class="broadcast-subject-progress" aria-label="${name} 설명 ${chosen}/${c.rows.length}개 선택">${c.rows.map((r,i)=>'<span class="'+(d.answers[r.key]?'picked':'')+'">'+(d.answers[r.key]?icon('check'):i+1)+' '+questions[i]+'</span>').join('')}</div></aside>
  <section class="broadcast-selection" aria-labelledby="broadcast-selection-title"><header class="broadcast-selection-heading"><div><small>${name}의 설명만 골라 줘</small><h3 id="broadcast-selection-title">${(current?'<span>'+(index+1)+'</span> ':icon('check'))+guide}</h3></div><b>${chosen}/${c.rows.length}</b></header><div class="card-questions">${c.rows.map((r,i)=>rowView(r,d,i,{...v,focusRow:current?.key,subjectId:'broadcast-subject-name'},questions[i])).join('')}</div>
  <div class="broadcast-next-step"><p role="status">${ready?(next?'잘 골랐는지 살펴보고, 다음 동물을 소개해 봐.':'네가 고른 설명을 답장으로 보내 확인해 봐.'):'한 줄에 카드 한 장씩, 세 줄을 채워 줘.'}</p>${btn(label+' '+icon('arrow'),action,'primary broadcast-continue '+(ready?'action-cue':''),(next?'data-value="'+next.index+'" ':'')+(!ready?'disabled':''))}</div>
  <details class="broadcast-script-preview"><summary>${icon('sound')} 내가 만든 방송 원고 보기</summary>${broadcastResult(c,d,ready)}</details></section></div>`;
}
function cardWork(s,stage,c,d,v,challenge){
 if(c.kind==='own-sort'||c.kind==='sort')return sortView(s,stage,c.part,d,v);
 if(c.kind==='retest')return retestView(s,c.part,d);
 if(c.kind==='broadcast'&&c.animal)return broadcastCard(s,c,d,v);
 return `<div class="card-body"><div class="card-questions">${c.rows.map((r,i)=>rowView(r,d,i,v,c.animal?short(r.label):r.label)).join('')}</div>${cardResult(c,d,challenge)}</div>`;
}
function deckNav(s,stage,cards,k,v,progress,ready){
 const chip=(x,n)=>{const dx=campaignDraft(s,stage,x.part),got=x.kind==='retest'?'':` <small>${x.rows.filter(r=>dx.answers[r.key]).length}/${x.rows.length}</small>`,ok=cardDone(s,stage,x),miss=v.feedback?.wrong?.some(w=>x.rows.some(r=>'row:'+r.key===w));
  return `<li>${btn(`${ok?icon('check'):'<i>'+(n+1)+'</i>'}<span>${esc(cardName(s,stage,cards,x))}</span>${got}`,'request-card',`deck-chip ${n===k?'current':''} ${ok?'done':''} ${miss?'retry':''}`,`data-value="${n}" aria-current="${n===k?'step':'false'}"`)}</li>`;};
 return `<nav class="deck-nav" aria-label="부탁 카드 ${cards.length}장"><span class="deck-count"><b>${progress.answered}/${progress.total}</b> 골랐어</span>${btn('←','request-card','icon-btn quiet deck-prev',`data-value="${k-1}" aria-label="이전 카드" ${k?'':'disabled'}`)}<ol class="deck-chips">${cards.map(chip).join('')}</ol>${btn('다음 →','request-card',`quiet deck-next ${ready&&k<cards.length-1?'action-cue':''}`,`data-value="${k+1}" aria-label="다음 카드" ${k<cards.length-1?'':'disabled'}`)}</nav>`;
}
export function commissionView(s,v){
 if(v.stage===5&&s.studioRecord&&Number(v.commissionIndex||0)!==2)return studioExhibitionView(s,v);
 const stage=v.stage,index=v.commissionIndex||0,c=COMMISSIONS[stage-1],challenge=index===2,parts=requestParts(stage,index),done=parts.every(i=>campaignDone(s,stage,i));
 const cards=requestCards(s,stage,parts),k=Math.max(0,Math.min(cards.length-1,Number.isInteger(v.requestCard)?v.requestCard:firstOpenCard(s,stage,parts))),card=cards[k],m=requestMission(s,stage,card.part),d=campaignDraft(s,stage,card.part),progress=cardProgress(s,stage,cards);
 const remaining=[...cards.keys()].filter(n=>n!==k&&!cardDone(s,stage,cards[n])),nextIndex=remaining.find(n=>n>k)??remaining[0];
 const partView={...v,picked:Number(v.picked?.commissionIndex)===card.part?v.picked:null,broadcastSubmitted:done,broadcastNext:nextIndex===undefined?null:{index:nextIndex,name:cardName(s,stage,cards,cards[nextIndex])}};
 const work=cardWork(s,stage,card,d,partView,challenge).replaceAll('data-action=','data-commission-index="'+card.part+'" data-action=');
 const panel='<section class="request-part request-card" data-request-part="'+card.part+'" aria-label="'+esc(m.title)+'"><header class="request-part-heading"><h2>'+m.title+'</h2>'+(parts.length>1?'<span class="part-tag">부탁 '+(parts.indexOf(card.part)+1)+'/'+parts.length+'</span>':'')+(campaignDone(s,stage,card.part)?'<span>전시 기록 있음</span>':'')+'</header><p class="request-part-intro">'+m.intro+'</p><details class="commission-evidence"><summary data-action="commission-evidence" data-commission-index="'+card.part+'">'+icon('search')+'<span class="evidence-title">'+(stage===1?'내 관찰 기록':c.tool)+'</span><span class="evidence-verb"> 펼치기</span></summary>'+evidenceView(s,stage,card.part)+'</details>'+work+'</section>';
 const all=progress.answered===progress.total;
 return '<main id="main" tabindex="-1" class="commission-page unified-request stage-'+stage+(card.kind==='broadcast'&&card.animal?' broadcast-request-page':'')+'"><div class="commission-layout"><aside class="client-card">'+npcPortrait(c)+'<div><small>'+c.npc+'의 '+(challenge?'마지막 도전':'부탁')+'</small><h1>'+(challenge?c.challenge.title:c.title)+'</h1></div><p>'+c.exhibit+'에 필요한 기록을 완성해 줘.</p>'+(!challenge?btn('편지 다시 읽기','commission-letter','quiet','data-id="'+stage+'"'):'')+commissionTabs(s,stage,index)+'</aside><section class="commission-work request-deck">'+deckNav(s,stage,cards,k,v,progress,cardDone(s,stage,card))+'<div class="request-parts single-part">'+panel+'</div><div class="commission-feedback '+(v.feedback?.good?'good':'')+(v.feedback?' has-feedback':'')+'" role="status"><button type="button" class="buddy-toggle" aria-label="모리에게 할 일 물어보기">'+mori(v.feedback?.good?7:2)+'</button><p>'+esc(v.feedback?.text||(done?'보낸 답장은 전시관에 보관돼 있어.':all?'모두 골랐어! 답장을 보내 줘.':challenge?'관찰한 근거로 도전해 봐.':'카드를 하나씩 채우고, 모두 고르면 답장을 보내 줘.'))+'</p></div><footer class="commission-footer">'+btn('지도 보기','map','quiet')+(done&&challenge&&stage===3?conceptButton('habitat-life','정리 영상 보기'):'')+(done?btn(challenge?'전시관 보기 '+icon('arrow'):'복구된 장소 보기 '+icon('arrow'),'commission-next','primary'):btn(challenge?'도전 기록 확인':'답장 보내기 '+icon('arrow'),'commission-submit','primary '+(all?'action-cue':'')))+'</footer></section></div></main>';
}
export function commissionThanks(s,id){const c=COMMISSIONS[id-1],thanks=id===5&&s.studioRecord?'네 상상으로 공방에 새로운 작품이 생겼어! 친구들이 네 그림과 소개를 보며 또 다른 발명을 떠올릴 거야.':c.thanks;return `<section class="commission-thanks">${npcPortrait(c)}<div><small>${c.npc}의 답장</small><p>${thanks}</p><b>${c.badge} 배지 · ${c.exhibit}</b></div></section><div class="commission-reward-links">${btn('내 전시물 보기','gallery','secondary')}</div>`;}
function exhibitVisual(s,stage,index,d){
 if(stage===5)return '<div class="museum-model">'+retestDiagram(designProblem(s,index),Number(d.answers.choice)||1)+'</div>';
 const rows=missionRows(s,stage,index,d);
 if(stage===2&&index===1)return '<div class="museum-sort-groups">'+[['yes','O','기준에 맞는 동물'],['no','X','기준과 다른 동물']].map(([key,symbol,label])=>'<div class="museum-sort-group"><span class="museum-sort-symbol">'+symbol+'</span><div class="museum-specimens" aria-label="'+label+'">'+rows.filter(r=>d.answers[r.key]===key).map(r=>'<figure>'+animal(r.animal)+'<figcaption>'+ANIMALS[r.animal].name+'</figcaption></figure>').join('')+'</div></div>').join('')+'</div>';
 const ids=stage===2&&index===0?['hen','bat']:[...new Set(rows.flatMap(r=>r.animal?[r.animal]:ANIMALS[d.answers[r.key]]?[d.answers[r.key]]:[]))];
 return '<div class="museum-specimens">'+ids.map(id=>{const photo=stage===3?normalizeMotionPhoto(s.inquiry.motionPhotos?.[id]):null;return '<figure>'+(photo?'<img class="museum-captured-photo" src="'+photo.dataURL+'" alt="'+ANIMALS[id].name+'의 내가 찍은 전시 사진">':animal(id))+'<figcaption>'+ANIMALS[id].name+'</figcaption></figure>';}).join('')+'</div>';
}
const ROOM_THEMES=[
 {topic:'관찰과 비교',caption:'작은 차이를 찾아낸 눈으로, 첫 번째 전시를 열었어.',collection:'몸의 특징 수집품'},
 {topic:'기준과 분류',caption:'서로 다른 친구들이 너희의 기준으로 제자리를 찾았어.',collection:'분류 정원의 수집품'},
 {topic:'환경과 생활',caption:'사는 곳과 몸의 특징이 이어지는 생태 이야기를 만나 봐.',collection:'움직임의 기록'},
 {topic:'단서와 발견',caption:'흩어졌던 단서들이 모여 동물의 이름을 되찾았어.',collection:'이름을 되찾은 기록'},
 {topic:'자연에서 얻은 상상',caption:'동물에게서 시작된 아이디어가 너만의 작품이 되었어.',collection:'생활 속 발명품'},
];
// General museum-label facts shown beside the learner's restored sentence.
const MUSEUM_NOTES={
 frog:{habitat:'논, 연못, 냇가',notes:['올챙이 때는 물속, 자라면 물과 땅을 오가.','긴 뒷다리로 멀리 뛰어.']},
 crab:{habitat:'갯벌, 바닷가 바위틈',notes:['집게다리로 먹이를 집어.','주로 옆으로 걸어.']},
 duck:{habitat:'연못, 호수, 강',notes:['물갈퀴로 헤엄쳐.','깃털이 물에 잘 안 젖어.']},
 rabbit:{habitat:'풀밭, 숲 가장자리',notes:['긴 귀로 소리를 잘 들어.','앞니가 평생 자라.']},
};
function exhibitFacts(rows,d){
 const picked=r=>esc(r.options.find(o=>o[0]===d.answers[r.key])?.[1]||'아직 비어 있어');
 // Proof rows are practice steps, not exhibit copy.
 return '<div class="museum-facts">'+rows.filter(r=>!/proof/.test(r.key)).map(r=>{const info=MUSEUM_NOTES[r.animal];
  if(!info)return '<div class="museum-fact"><span>'+esc(r.label)+'</span><p>'+picked(r)+'</p></div>';
  const name=ANIMALS[r.animal].name,caption=r.label.replace(name+'의 ','');
  return '<div class="museum-fact museum-entry"><div class="museum-entry-id"><h4>'+name+'</h4><p class="museum-habitat"><b>사는 곳</b>'+esc(info.habitat)+'</p></div><div class="museum-entry-text"><p class="museum-restored">'+(caption==='설명'?'':'<b>'+esc(caption)+'</b>')+picked(r)+'</p><ul class="museum-notes">'+info.notes.map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul></div></div>';
 }).join('')+'</div>';
}
function displayCase(s,c,index,d,body,extra=''){
 const m=commission(c.id,index),theme=ROOM_THEMES[c.id-1];
 return `<section class="museum-display ${extra}"><div class="museum-case"><div class="museum-vitrine"><div class="museum-vitrine-content">${exhibitVisual(s,c.id,index,d)}</div><span class="museum-vitrine-tag">${theme.collection}</span></div><div class="museum-plinth"><span>소장번호 0${c.id} · 0${index+1}</span><span>${icon('check')} 복구한 기록</span></div></div><div class="museum-label"><div class="museum-label-heading"><span>${theme.topic}</span><span class="museum-label-mark" aria-hidden="true">${icon('leaf')}</span></div><h3>${esc(m.title)}</h3>${body}</div></section>`;
}
function galleryPhotoCollection(s){
 const photos=Object.entries(s.inquiry.motionPhotos||{}).filter(([id])=>Object.hasOwn(MOTIONS,id)).map(([id,p])=>[id,normalizeMotionPhoto(p)]).filter(([,p])=>p);
 if(!photos.length)return '';
 return '<details class="museum-motion-collection"><summary>내가 고른 관찰 사진 '+photos.length+'장 펼쳐 보기</summary><header><span>'+icon('camera')+' 탐험대의 사진벽</span><h3>내가 직접 고른 순간들</h3><p>영상을 보며 한 마리마다 한 장씩 찍은 관찰 사진이야.</p></header><div class="museum-photo-grid">'+photos.map(([id,p])=>'<figure>'+btn('<img src="'+p.dataURL+'" width="'+p.width+'" height="'+p.height+'" alt="'+(ANIMALS[id]?.name||({camel:'낙타',penguin:'펭귄'}[id]))+' 관찰 사진">','motion-photo','museum-photo-open','data-id="'+id+'" aria-label="관찰 사진 크게 보기"')+'<figcaption><b>'+(ANIMALS[id]?.name||({camel:'낙타',penguin:'펭귄'}[id]))+'</b><span>내가 고른 '+p.time.toFixed(1)+'초</span></figcaption></figure>').join('')+'</div></details>';
}
function galleryRecords(s,c,done){return galleryRecordDisplays(s,c,done)+(c.id===3?galleryPhotoCollection(s):'');}
function galleryRecordDisplays(s,c,done){
 if(c.id===5&&s.studioRecord){const record=s.studioRecord;return `<section class="museum-display museum-studio"><div class="museum-art-frame"><span class="museum-art-caption">${done.length===2?'내 상상이 전시된 작품':'전시를 기다리는 내 작품'}</span>${studioArtwork(record)}<span class="museum-art-nameplate">어린이 발명가의 소장 작품</span></div><div class="museum-label museum-art-label"><div class="museum-label-heading"><span>자연에서 얻은 상상</span>${icon('leaf')}</div><h3>${esc(record.title)}</h3>${studioIntroduction(record)}${btn(icon('download')+' 작품 카드 저장','studio-download','secondary')}</div></section>${s.records.designs[0]?`<details class="museum-first-invention"><summary>아이디어를 빌려 연습한 발명</summary><h3>${esc(s.records.designs[0].name||'첫 발명')}</h3><div class="museum-model">${retestDiagram(s.records.designs[0].problem,s.records.designs[0].experiment?.level||1)}</div><p>동물의 특징을 빌려 본 경험에서 새로운 상상이 시작됐어.</p></details>`:''}`;}
 if(!done.length){if(c.id===3&&Object.values(s.inquiry.motionPhotos||{}).some(p=>normalizeMotionPhoto(p)))return '<p class="museum-photo-preparing">관찰 사진이 모였어! 레인저 하늘의 부탁도 해결하면 탐방 방송을 함께 전시할 수 있어.</p>';return `<div class="museum-empty-display"><div class="museum-empty-dome" aria-hidden="true">${icon('leaf')}</div><span>전시 준비 중</span><h3>다음 발견이 머물 자리</h3><p>탐험하고 주민의 부탁을 해결하면<br>너희가 완성한 기록이 이곳에 전시돼.</p></div>`;}
 return done.map(i=>{const d=s.campaign.records[`${c.id}-${i}`],m=commission(c.id,i),rows=missionRows(s,c.id,i,d);
  if(m.kind==='broadcast')return displayCase(s,c,i,d,'<div class="museum-audio-caption">'+icon('sound')+' 우리가 완성한 탐방 방송 원고</div>'+broadcastCopy(rows,d),'museum-broadcast');
  if(m.kind==='own-sort')return displayCase(s,c,i,d,'<p class="museum-criterion">'+esc(SORT_KEYS[d.answers.criterion])+'</p><p class="museum-object-note">너희가 정한 기준으로 친구들의 전시 자리를 나눴어.</p>');
  if(m.kind==='retest'){const p=designProblem(s,i),r=RETEST[p];return displayCase(s,c,i,d,`<p class="museum-product-title">${esc((s.records.designs[i]||s.designs[i]).name)}</p><p class="museum-object-note">${esc(r?.reason||'')}</p><div class="museum-trial-tags" aria-label="비교한 모양">${d.trials.map(t=>`<span>${esc(RETEST[t.problem]?.levels[t.level-1]||'')}</span>`).join('')}</div>`);}
  return displayCase(s,c,i,d,exhibitFacts(rows,d));
 }).join('');
}
export function galleryView(s){return `<main id="main" tabindex="-1" class="museum-page"><header class="museum-heading"><span class="overline">하루와 모리의 자연 기록 전시관</span><h1>${restoredPlaces(s).length===5?'우리 전시관이 다시 열렸어!':'우리의 발견이 전시가 되는 곳'}</h1><p>주민의 부탁 ${requestCount(s)}/5 · 마지막 도전 ${COMMISSIONS.filter(c=>campaignDone(s,c.id,2)).length}/5</p>${btn('마을로 돌아가기','map','secondary')}${restoredPlaces(s).length===5?btn('발명과 탐험 인증서','ending','quiet'):''}</header><div class="museum-exhibits">${COMMISSIONS.map(c=>{const done=[0,1].filter(i=>campaignDone(s,c.id,i)),creative=c.id===5&&s.studioRecord,theme=ROOM_THEMES[c.id-1];return `<article class="museum-exhibit museum-room-${c.id} ${done.length===2?'complete':''}" data-room="${c.id}"><header class="museum-room-heading"><span class="museum-room-number" aria-hidden="true">0${c.id}</span><div><small>자연 기록 소장실 · ${theme.topic}</small><h2>${c.exhibit}</h2><p>${done.length?theme.caption:'너희의 발견으로 이 전시실을 채워 줘.'}</p></div><div class="museum-curator">${npcPortrait(c)}<span>${done.length===2?icon('check')+' '+c.badge+' 배지':creative?'내 작품 전시 준비':`${done.length}/2 전시 준비`}</span></div></header>${galleryRecords(s,c,done)}<div class="museum-room-footer">${done.length===2?`<blockquote><span>${c.npc}의 전시 후기</span><p>${creative?'네 그림과 소개가 친구들에게 새로운 상상을 선물할 거야!':c.thanks}</p></blockquote>`:''}${s.completed.includes(c.id)?btn(done.length===2?'마지막 도전'+(campaignDone(s,c.id,2)?' ✓':''):'부탁 이어 하기','commission-open','quiet',`data-id="${c.id}" data-value="${done.length===2?2:done.length}"`):''}</div></article>`;}).join('')}</div><footer>${btn(icon('book')+' 나의 탐험 일기','download','secondary')}${galleryNext(s)}</footer></main>`;}
// The gallery is a stop on the way: it always offers the next place (or the certificate once all five are restored).
function galleryNext(s){if(restoredPlaces(s).length===5)return btn('탐험 인증서 보기 '+icon('arrow'),'ending','primary');const next=STAGES.find(t=>!restoredPlaces(s).includes(t.id)&&isStageOpen(s,t.id));return next?btn('다음 탐험: '+next.name+' '+icon('arrow'),'map','primary'):'';}
