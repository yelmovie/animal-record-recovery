import {normalizeStudio} from './studio.js';
import {studioArtwork} from './studio-views.js';
import {strokeMarkup,drawStudioStroke,hsvToHex,hexToHsv} from './studio-brush.js';

const clamp=(n,max)=>Math.max(0,Math.min(max,n));
export function mountStudio(root,{getStudio,onChange,onDownload}={}){
 const host=root.querySelector('[data-studio]');if(!host)return ()=>{};
 const surface=host.querySelector('[data-studio-surface]'),live=host.querySelector('[data-studio-live]'),wheel=host.querySelector('[data-studio-wheel]');
 let settings={...normalizeStudio(getStudio()).tools},hsv=hexToHsv(settings.color),current=null,pointer=null,wheelPointer=null,redo=[],disposed=false;
 const state=()=>normalizeStudio(getStudio());
 const status=message=>{const el=host.querySelector('[data-studio-status]');if(el)el.textContent=message;};
 const buttons=()=>{host.querySelector('[data-studio-action="undo"]')?.toggleAttribute('disabled',!state().strokes.length);host.querySelector('[data-studio-action="redo"]')?.toggleAttribute('disabled',!redo.length);};
 const refresh=()=>{const s=state(),preview=host.querySelector('[data-studio-preview]');if(preview)preview.innerHTML=studioArtwork(s);const empty=host.querySelector('[data-studio-empty]');if(empty)empty.hidden=!!s.strokes.length;const title=host.querySelector('[data-studio-title]');if(title)title.textContent=s.title||'아직 이름 없는 발명';const purpose=host.querySelector('[data-studio-purpose]');if(purpose)purpose.textContent=s.purpose||'어떻게 쓰는지 소개해 줘.';buttons();};
 const save=next=>{onChange(normalizeStudio(next));refresh();};
 const controls=()=>{
  host.querySelectorAll('[data-studio-tool]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.studioTool===settings.tool)));
  host.querySelectorAll('[data-studio-current-color]').forEach(el=>el.style.background=settings.color);
  host.querySelectorAll('[data-studio-color-label]').forEach(el=>el.textContent=settings.color.toUpperCase());
  const custom=host.querySelector('[data-studio-custom-color]');if(custom)custom.value=settings.color;
  const size=host.querySelector('[data-studio-width]');if(size)size.value=settings.width;
  const sizeLabel=host.querySelector('[data-studio-width-label]');if(sizeLabel)sizeLabel.textContent=settings.width;
  const brightness=host.querySelector('[data-studio-brightness]');if(brightness)brightness.value=Math.round(hsv.v);
  const brightnessLabel=host.querySelector('[data-studio-brightness-label]');if(brightnessLabel)brightnessLabel.textContent=Math.round(hsv.v)+'%';
  const marker=host.querySelector('[data-studio-wheel-marker]'),angle=hsv.h*Math.PI/180;
  if(marker){marker.style.left=(50+Math.sin(angle)*hsv.s/2)+'%';marker.style.top=(50-Math.cos(angle)*hsv.s/2)+'%';marker.style.background=settings.color;}
  if(wheel){wheel.style.setProperty('--wheel-value',hsv.v/100);wheel.setAttribute('aria-valuenow',String(Math.round(hsv.h)));wheel.setAttribute('aria-valuetext',settings.color+' · 선명함 '+Math.round(hsv.s)+'%');}
  const sample=host.querySelector('[data-studio-brush-preview]');if(sample)sample.innerHTML=strokeMarkup({...settings,points:[{x:12,y:39},{x:35,y:23},{x:60,y:40},{x:87,y:24},{x:108,y:35}]});
  if(surface){surface.classList.toggle('is-eraser',settings.tool==='eraser');surface.style.setProperty('--pen-color',settings.color);}
 };
 const saveTools=()=>{const s=state();s.tools={...settings};onChange(normalizeStudio(s));controls();};
 const changeColor=()=>{settings.color=hsvToHex(hsv.h,hsv.s,hsv.v);if(settings.tool==='eraser')settings.tool='pen';saveTools();};
 const point=e=>{const box=surface.getBoundingClientRect();return {x:Math.round(clamp((e.clientX-box.left)/box.width*1000,1000)),y:Math.round(clamp((e.clientY-box.top)/box.height*650,650))};};
 const paint=()=>{if(current&&live)live.innerHTML=strokeMarkup(current);};
 const finish=e=>{if(pointer===null||e?.pointerId!==undefined&&e.pointerId!==pointer)return;const id=pointer;pointer=null;const stroke=current;current=null;if(surface.hasPointerCapture?.(id))surface.releasePointerCapture(id);if(live)live.innerHTML='';if(stroke?.points.length){const s=state();s.strokes.push(stroke);redo=[];save(s);status('그림을 보관했어. 계속 그려도 좋아.');}};
 const down=e=>{if(pointer!==null||e.button!==0||e.isPrimary===false)return;e.preventDefault();if(state().strokes.length>=160){status('도화지가 꽉 찼어. 작품을 저장하거나 마지막 선을 되돌려 봐.');return;}pointer=e.pointerId;current={...settings,color:settings.tool==='eraser'?'#ffffff':settings.color,points:[point(e)]};surface.setPointerCapture(pointer);host.querySelector('[data-studio-empty]')?.setAttribute('hidden','');paint();};
 const move=e=>{if(e.pointerId!==pointer||!current)return;e.preventDefault();const coalesced=e.getCoalescedEvents?.(),samples=coalesced?.length?coalesced:[e];for(const sample of samples){const p=point(sample),last=current.points.at(-1);if(Math.hypot(p.x-last.x,p.y-last.y)<1.5)continue;if(current.points.length>=248)current.points=current.points.filter((_,i)=>i%2===0);current.points.push(p);}paint();};
 const pickWheel=e=>{const r=wheel.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2);hsv.h=(Math.atan2(x,-y)*180/Math.PI+360)%360;hsv.s=Math.min(100,Math.hypot(x,y)*100);changeColor();};
 const wheelDown=e=>{if(e.button!==0||e.isPrimary===false||wheelPointer!==null)return;e.preventDefault();wheelPointer=e.pointerId;wheel.setPointerCapture(e.pointerId);pickWheel(e);};
 const wheelMove=e=>{if(e.pointerId===wheelPointer){e.preventDefault();pickWheel(e);}};
 const wheelEnd=e=>{if(e?.pointerId!==undefined&&e.pointerId!==wheelPointer)return;const id=wheelPointer;wheelPointer=null;if(id!==null&&wheel?.hasPointerCapture?.(id))wheel.releasePointerCapture(id);};
 const undo=()=>{const s=state();if(s.strokes.length){redo.push(s.strokes.pop());save(s);status('마지막 선을 되돌렸어.');}};
 const again=()=>{const s=state();if(redo.length){s.strokes.push(redo.pop());save(s);status('선을 다시 그렸어.');}};
 const click=async e=>{const b=e.target.closest('[data-studio-action]');if(!b||!host.contains(b))return;const a=b.dataset.studioAction;finish();
  if(a==='palette'){const popup=host.querySelector('#studio-color-picker'),r=b.getBoundingClientRect();if(popup){popup.style.left=Math.max(8,Math.min(r.left,window.innerWidth-288))+'px';popup.style.top=Math.max(8,Math.min(r.bottom+8,window.innerHeight-440))+'px';}}
  else if(a==='tool'){settings.tool=b.dataset.studioTool;saveTools();}
  else if(a==='undo')undo();else if(a==='redo')again();
  else if(a==='download'){b.disabled=true;status('그림과 소개를 한 장에 담고 있어…');try{await(onDownload||downloadStudioArtwork)(state());if(!disposed)status('작품 이미지 다운로드를 시작했어!');}catch(error){if(!disposed)status('이미지를 저장하지 못했어. 잠시 뒤 다시 눌러 줘.');console.error('Studio artwork download failed',error);}finally{if(!disposed)b.disabled=false;}}controls();
 };
 const input=e=>{const field=e.target.dataset.studioField;if(field&&['title','audience','purpose','inspiration'].includes(field)){const s=state();s[field]=e.target.value;save(s);}
  if(e.target.matches('[data-studio-width]')){settings.width=Math.max(1,Math.min(60,Number(e.target.value)||1));saveTools();}
  if(e.target.matches('[data-studio-brightness]')){hsv.v=clamp(Number(e.target.value),100);changeColor();}
  if(e.target.matches('[data-studio-custom-color]')){settings.color=e.target.value;hsv=hexToHsv(settings.color);if(settings.tool==='eraser')settings.tool='pen';saveTools();}
 };
 const keyboard=e=>{if(e.target===wheel&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft'||e.key==='ArrowRight')hsv.h=(hsv.h+(e.key==='ArrowLeft'?-3:3)+360)%360;if(e.key==='ArrowUp'||e.key==='ArrowDown')hsv.s=clamp(hsv.s+(e.key==='ArrowUp'?3:-3),100);if(e.key==='Home')hsv.s=0;if(e.key==='End')hsv.s=100;changeColor();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.target.closest('input,textarea,select')){e.preventDefault();finish();if(e.shiftKey)again();else undo();}};
 const resize=()=>host.querySelector('#studio-color-picker')?.hidePopover?.();
 host.addEventListener('click',click);host.addEventListener('input',input);host.addEventListener('keydown',keyboard);
 surface?.addEventListener('pointerdown',down);surface?.addEventListener('pointermove',move);surface?.addEventListener('pointerup',finish);surface?.addEventListener('pointercancel',finish);surface?.addEventListener('lostpointercapture',finish);
 wheel?.addEventListener('pointerdown',wheelDown);wheel?.addEventListener('pointermove',wheelMove);wheel?.addEventListener('pointerup',wheelEnd);wheel?.addEventListener('pointercancel',wheelEnd);wheel?.addEventListener('lostpointercapture',wheelEnd);
 window.addEventListener('blur',finish);window.addEventListener('resize',resize);controls();buttons();
 return ()=>{finish();wheelEnd();disposed=true;host.removeEventListener('click',click);host.removeEventListener('input',input);host.removeEventListener('keydown',keyboard);surface?.removeEventListener('pointerdown',down);surface?.removeEventListener('pointermove',move);surface?.removeEventListener('pointerup',finish);surface?.removeEventListener('pointercancel',finish);surface?.removeEventListener('lostpointercapture',finish);wheel?.removeEventListener('pointerdown',wheelDown);wheel?.removeEventListener('pointermove',wheelMove);wheel?.removeEventListener('pointerup',wheelEnd);wheel?.removeEventListener('pointercancel',wheelEnd);wheel?.removeEventListener('lostpointercapture',wheelEnd);window.removeEventListener('blur',finish);window.removeEventListener('resize',resize);};
}

function wrap(ctx,text,maxWidth){const lines=[];for(const paragraph of String(text).split('\n')){let line='';for(const letter of paragraph){if(line&&ctx.measureText(line+letter).width>maxWidth){lines.push(line);line=letter;}else line+=letter;}lines.push(line);}return lines;}
export async function downloadStudioArtwork(value){
 const s=normalizeStudio(value);if(document.fonts?.ready)await document.fonts.ready;
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
 canvas.width=1440;const fields=[['누구를 위한 발명?',s.audience||'아직 적지 않았어요.'],['어떻게 사용하나요?',s.purpose||'그림에 담긴 쓰임을 상상해 보세요.'],['어디에서 아이디어를 얻었나요?',s.inspiration||'나의 상상에서 시작했어요.']];
 ctx.font='26px "Malgun Gothic",sans-serif';const sections=fields.map(([label,text])=>({label,lines:wrap(ctx,text,1224)}));canvas.height=1110+sections.reduce((sum,item)=>sum+88+item.lines.length*38,0);
 ctx.fillStyle='#f5f0de';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#2d5542';ctx.fillRect(0,0,1440,16);
 ctx.font='bold 22px "Malgun Gothic",sans-serif';ctx.fillText('동물기록 복구작전  ·  어린이 발명 전시회',64,69);
 ctx.font='bold 44px "Malgun Gothic",sans-serif';let fontSize=44;while(ctx.measureText(s.title||'나의 새로운 발명').width>1300&&fontSize>24){fontSize-=2;ctx.font=`bold ${fontSize}px "Malgun Gothic",sans-serif`;}ctx.fillText(s.title||'나의 새로운 발명',64,134);
 ctx.fillStyle='#fff';ctx.fillRect(64,170,1312,853);ctx.save();ctx.translate(64,170);ctx.scale(1.312,1.312);ctx.beginPath();ctx.rect(0,0,1000,650);ctx.clip();
 for(const stroke of s.strokes)drawStudioStroke(ctx,stroke);ctx.restore();
 let y=1070;for(const section of sections){ctx.fillStyle='#64794e';ctx.font='bold 25px "Malgun Gothic",sans-serif';ctx.fillText(section.label,80,y);ctx.fillStyle='#294638';ctx.font='26px "Malgun Gothic",sans-serif';section.lines.forEach((line,i)=>ctx.fillText(line,80,y+43+i*38));y+=88+section.lines.length*38;}
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('PNG export failed')),'image/png'));const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=(s.title||'나의 발명').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').slice(0,40)+'-작품.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
