import {CASES,ANIMALS,HABITATS,clueOf} from './expedition.js';
import {animal,icon,btn,esc,sprite,choice,actionGuide} from './presentation.js';

// Neutral field positions never outline the hidden animal.
export const CLUE_SPOTS=Object.fromEntries(CASES.map(c=>[c.id,[[18,30],[50,26],[82,34],[30,66],[70,68]]]));
const marked=(v,key)=>v.feedback?.wrong?.includes(key)?'retry':'';
const hiddenAnimal=id=>animal(id).replace(/alt="[^"]*"/,'alt="어둠 속에서 조사할 동물"');
export function flashlightCaseView(s,v){
 const c=CASES[v.round],a=s.cases[v.round];
 if(v.step%2)return habitatJourney(c,a,v);
 const progress=a.opened.length;
 const next=progress<2?'반짝이는 단서를 눌러 봐. 수첩에 바로 기록돼.':'수첩의 단서를 보고 맞는 동물을 골라 봐.';
 const clues=c.clues.filter(k=>a.opened.includes(k.id)).map(k=>`<div class="flashlight-note"><span class="clue-pin">${icon('book')}</span><span><small>${k.kind}</small><b>${esc(k.text)}</b></span></div>`).join('');
 return `<section class="flashlight-field">
  <header class="flashlight-heading"><span>${icon('search')} 숲속 동물 탐정</span><h2>${c.title}</h2><p>단서를 찾아 어떤 동물인지 맞혀 봐.</p></header>
  <div class="flashlight-surface" data-flashlight="${c.id}" style="--beam-x:50%;--beam-y:50%" aria-label="손전등 조사 화면. 반짝이는 곳을 누르거나 탭 키로 이동해 단서를 찾아봐.">
   <div class="flashlight-mystery" aria-hidden="true"><span>?</span><p>동물을 맞히면 몸 전체가 공개돼</p></div><div class="flashlight-beam" aria-hidden="true"></div>
   ${c.clues.map((k,i)=>{const [x,y]=CLUE_SPOTS[c.id][i],found=a.opened.includes(k.id);return btn('<span class="flashlight-spark">'+(found?icon('check'):'✦')+'</span><span class="flashlight-spot-label">'+k.kind+(found?' · 다시 보기':'')+'</span>','flashlight-clue','flashlight-hotspot '+(found?'found':''),`data-value="${i}" data-x="${x}" data-y="${y}" style="left:${x}%;top:${y}%" aria-label="${k.kind} ${found?'다시 보기':'발견하기'}"`);}).join('')}
   <div class="flashlight-tip" aria-hidden="true">${icon('search')} 빛을 비추고 반짝이는 곳을 톡!</div>
  </div><p class="flashlight-next" role="status">${icon('arrow')} ${next}</p>
 </section><aside class="flashlight-notebook">
  <header><h2>발견 수첩</h2></header>
  <div class="flashlight-find-progress" aria-label="${c.clues.length}개 중 ${progress}개 발견">${c.clues.map(k=>'<i class="'+(a.opened.includes(k.id)?'found':'')+'">'+icon(a.opened.includes(k.id)?'check':'search')+'</i>').join('')}<span>${progress}/${c.clues.length} 발견</span></div>
  <section class="grounds-pick ${marked(v,'case:clues')}"><h3>발견한 단서</h3><div class="flashlight-clue-list">${clues}</div></section>
  <section class="flashlight-guess case-selection ${marked(v,'case:candidate')}">${progress>=2?flashlightGuessView(c,a):'<p>서로 다른 단서 2개를 찾아 줘.</p>'}</section>
 </aside>`;
}
function habitatJourney(c,a,v){
 const knownPlace=a.grounds.includes('place')&&a.habitat===c.habitat,pickPlace=a.habitat!==c.habitat,pickMove=!pickPlace&&a.reason!==c.reason;
 const h=HABITATS[c.habitat],movement=a.reason===c.reason?({dig:'dig',paddle:'swim',jump:'jump',burrow:'jump',fin:'swim',fly:'swim'}[a.reason]||''):'';
 return `<section class="animal-journey"><header><span>탐정 수첩 · 생활 이어 보기</span><h2>${ANIMALS[c.animal].name}의 집으로 안내해 줘!</h2><p>발견한 풍경과 몸의 특징을 떠올려 봐.</p></header><div class="journey-stage"><div class="journey-destinations ${marked(v,'case:habitat')}" aria-label="동물이 살 곳 고르기"><p class="journey-choice-title">${pickPlace?actionGuide(a.habitat?'사는 곳 다시 고르기':'먼저 사는 곳 고르기'):knownPlace?'✓ 발견 수첩에서 돌려보낼 곳을 찾았어':'✓ 사는 곳을 골랐어'}</p>${knownPlace?'<p class="journey-known-place">'+esc(h.name)+'</p>':Object.entries(HABITATS).map(([id,x])=>btn(sprite('biomes',x.sheet[0],x.sheet[1],'journey-place-art','')+'<span>'+x.name+'</span>','case-habitat','journey-portal '+(a.habitat===id?'selected':''),`data-value="${id}" aria-pressed="${a.habitat===id}"`)).join('')}</div><div class="journey-scene ${movement}" data-journey-habitat="${a.habitat||''}">${a.habitat?sprite('biomes',HABITATS[a.habitat].sheet[0],HABITATS[a.habitat].sheet[1],'journey-ground',''):''}<div class="journey-animal">${animal(c.animal)}</div><span class="journey-name">${ANIMALS[c.animal].name}</span>${a.reason?'<span class="journey-motion-note">'+esc(c.reasons.find(([id])=>id===a.reason)?.[1])+'</span>':''}</div></div></section><aside class="journey-journal"><header><span>내가 찾은 증거</span><h2>어떻게 살아갈까?</h2></header><div class="journey-evidence-summary"><figure class="journey-evidence-photo">${sprite('biomes',h.sheet[0],h.sheet[1],'biome-photo','발견 장소의 풍경')}<figcaption>탐험할 때 만난 곳의 풍경이야.</figcaption></figure><p class="journey-evidence-text">${a.grounds.map(id=>clueOf(c,id)?.text).filter(Boolean).map(t=>esc(t)).join(' ')}</p></div><div class="journey-movement ${marked(v,'case:reason')}"><h3>${pickMove?actionGuide('움직이는 방법을 골라 줘'):'움직이는 방법'}</h3><p>${pickPlace?'사는 곳을 고르면 여기서 움직임을 고를 수 있어.':'동물이 네가 고른 방법으로 움직여.'}</p>${c.reasons.map(([id,label])=>choice(label,'case-reason',id,a.reason===id,pickPlace?'disabled':'')).join('')}${c.aha&&a.reason===c.reason?'<p class="aha-note"><b>알고 보니!</b> '+esc(c.aha)+'</p>':''}</div><p class="journey-check-note">사는 곳과 움직임이 맞으면 다음 기록으로 이어져.</p></aside>`;
}
export function clueFoundView(c,index,opened=false){
 const k=c.clues[index];if(!k)return '';
 const visual=k.place?sprite('biomes',HABITATS[k.place].sheet[0],HABITATS[k.place].sheet[1],'biome-photo','발견 장소의 풍경'):!k.crop?'<div class="flashlight-observation" aria-hidden="true">'+icon(k.icon)+'</div>':'<div class="flashlight-found-photo '+(k.crop?'closeup':'')+'" style="--clue-x:'+(k.crop?.[0]||50)+'%;--clue-y:'+(k.crop?.[1]||50)+'%">'+hiddenAnimal(c.animal)+'</div>';
 return '<article class="flashlight-discovery"><span class="discovery-sticker">'+icon(opened?'book':'star')+' '+(opened?'수첩 속 단서 다시 보기':'반짝! 새로운 단서를 찾았어')+'</span><h3>'+k.kind+'</h3>'+visual+'<p>'+esc(k.text)+'</p>'+((k.id==='life'||k.id==='move')?'<small>탐험대의 생활 관찰 기록에서 찾은 단서야.</small>':'')+'<div class="dialog-actions">'+btn(opened?'계속 조사하기':'발견 수첩에 붙이기 '+icon('arrow'),opened?'close-dialog':'flashlight-collect','primary',`data-value="${index}" autofocus`)+'</div></article>';
}
export function flashlightGuessView(c,a){return '<div class="flashlight-guess-dialog"><p>모은 단서에 모두 맞는 동물을 골라 줘.</p><div class="flashlight-candidates">'+c.candidates.map(id=>btn(animal(id)+'<b>'+ANIMALS[id].name+'</b>','case-animal','flashlight-candidate '+(a.candidate===id?'selected':''),`data-id="${id}" aria-pressed="${a.candidate===id}"`)).join('')+'</div></div>';}

// The light follows pointer/touch and keyboard focus; only an explicit tap finds a clue.
export function mountFlashlight(host,{onSelect=()=>{}}={}){
 if(!host)return ()=>{};
 const buttons=[...host.querySelectorAll('.flashlight-hotspot')],listeners=[];let pointer=null;
 const listen=(name,fn)=>{host.addEventListener(name,fn);listeners.push([name,fn]);};
 const light=(x,y)=>{host.style.setProperty('--beam-x',x+'%');host.style.setProperty('--beam-y',y+'%');for(const b of buttons)b.classList.toggle('in-light',Math.hypot(Number(b.dataset.x)-x,Number(b.dataset.y)-y)<15);};
 const position=e=>{const r=host.getBoundingClientRect();return [Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))];};
 listen('pointermove',e=>{if(e.isPrimary!==false)light(...position(e));});
 listen('pointerdown',e=>{if(e.isPrimary===false)return;light(...position(e));if(e.target.closest?.('.flashlight-hotspot'))return;e.preventDefault();pointer=e.pointerId;host.setPointerCapture?.(pointer);});
 listen('pointerup',e=>{if(pointer!==e.pointerId)return;const p=position(e);pointer=null;host.releasePointerCapture?.(e.pointerId);const b=buttons.find(b=>Math.hypot(Number(b.dataset.x)-p[0],Number(b.dataset.y)-p[1])<10);if(b)onSelect(Number(b.dataset.value));});
 listen('pointercancel',()=>{pointer=null;});
 listen('focusin',e=>{const b=e.target.closest?.('.flashlight-hotspot');if(b)light(Number(b.dataset.x),Number(b.dataset.y));});
 light(50,50);
 return ()=>{for(const [name,fn]of listeners)host.removeEventListener(name,fn);if(pointer!==null&&host.hasPointerCapture?.(pointer))host.releasePointerCapture?.(pointer);pointer=null;};
}
