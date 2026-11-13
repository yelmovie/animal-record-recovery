import {createDirectionalWalker,bindMapDirections,availableDirections} from './map-walk.js';
import {COMMISSIONS} from './campaign.js';
import {mountVillageEncounters} from './village-encounters.js';
// Main map: a top-down pixel village (screen 01). Same contract as createTrailMap: {move(id), destroy()}.
// Layout (map size, building rects and doors, walk nodes/edges, sprite cells) comes from assets/village/village.json.
const BASE=new URL('../assets/village/',import.meta.url).href;
export function markerSafeOffset(q,b,visible=b){
 if(q.right<=visible.left||q.left>=visible.right||q.bottom<=visible.top||q.top>=visible.bottom)return [0,0];
 return [Math.max(b.left-q.left,Math.min(0,b.right-q.right)),Math.max(b.top-q.top,Math.min(0,b.bottom-q.bottom))];
}
let loading=null;
export function villageReady(){
  if(!loading){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    loading=typeof fetch==='function'?fetch(BASE+'village.json',{signal:controller.signal}).then(r=>r.ok?r.json():null).catch(()=>null).then(j=>{if(!j)loading=null;return j;}).finally(()=>clearTimeout(timer)):Promise.resolve(null);
    if(typeof fetch!=='function')clearTimeout(timer);
  }
  return loading;
}

// Story NPCs stand by a building; their line changes once that place is restored.
export const NPCS=COMMISSIONS.map(c=>({id:c.portrait,name:c.npc,near:String(c.id),before:c.title,after:c.thanks}));
export const npcLine=(npc,completed)=>completed.length===5?'다섯 기록이 모두 돌아왔어! 크리스털이 다시 빛나.':completed.includes(Number(npc.near))?npc.after:npc.before;

// Shortest walk between two nodes of the village graph.
export function villagePath(graph,from,to){
  if(!graph.nodes[from]||!graph.nodes[to])return [];
  const queue=[[from]],seen=new Set([from]);
  while(queue.length){const path=queue.shift(),node=path.at(-1);if(node===to)return path;
    for(const [a,b] of graph.edges){const next=a===node?b:b===node?a:null;if(next!=null&&!seen.has(next)){seen.add(next);queue.push([...path,next]);}}}
  return [];
}
export const nearestNode=(graph,[x,y])=>Object.entries(graph.nodes).reduce((best,[id,[nx,ny]])=>{const d=(nx-x)**2+(ny-y)**2;return d<best.d?{id,d}:best;},{id:null,d:Infinity}).id;
// Direct controls choose a connected path segment, never a line through a building.
export function directionalNode(graph,from,direction){
  const vector={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[direction],origin=graph.nodes[from];if(!vector||!origin)return null;
  return graph.edges.flatMap(([a,b])=>a===from?[b]:b===from?[a]:[]).reduce((best,id)=>{const p=graph.nodes[id];if(!p)return best;const dx=p[0]-origin[0],dy=p[1]-origin[1],score=(dx*vector[0]+dy*vector[1])/(Math.hypot(dx,dy)||1);return score>best.score?{id,score}:best;},{id:null,score:.3}).id;
}
// Interactive building (not the core, whose square overlaps the ring path) under a map point.
export const buildingAt=(buildings,[x,y])=>Object.entries(buildings).find(([id,{rect:r}={}])=>id!=='core'&&r&&x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3])?.[0]||null;
// The village json may give nodes as an array or an object; edges as index or id pairs.
function graphOf(j){const nodes=Array.isArray(j.nodes)?Object.fromEntries(j.nodes.map((n,i)=>[String(i),Array.isArray(n)?n:[n.x,n.y]])):Object.fromEntries(Object.entries(j.nodes||{}).map(([k,n])=>[k,Array.isArray(n)?n:[n.x,n.y]]));return {nodes,turnDistance:j.turnDistance,edges:(j.edges||[]).map(([a,b])=>[String(a),String(b)])};}

export function createVillage(root,{position='entrance',completed=[],flash=null,overview=false,pan=false,onArrive,onTalk,onStep,onWalk,onInteract,onError,encounterProgress,encounterPreview=false,onEncounterSave,onEncounterTone,isBlocked=()=>false}={}){
  overview=overview&&[1,2,3,4,5].every(id=>completed.includes(id));
  let active=true,built=false,paused=false,away=false,frame=null,manual=null,directions=null,panning=!!pan,api={move(){},destroy(){active=false;}};
  const pending=[];
  const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  villageReady().then(j=>{if(!active)return;if(!j?.map?.w||!j?.map?.h||!j.buildings||!j.nodes){loading=null;onError?.();return;}if(!root?.ownerDocument)return;build(j);while(pending.length)api.move(pending.shift());}).catch(()=>{loading=null;if(active)onError?.();});
  function build(j){
    const W=j.map.w,H=j.map.h,pct=(v,t)=>v/t*100+'%',graph=graphOf(j),doc=root.ownerDocument;
    const layer=doc.createElement('div');layer.className='village-layer';root.append(layer);
    // The terrain and façade are distinct: old clear results remain visible after reloading.
    const ground=root.querySelector('.village-map');
    ground?.style.setProperty('--settled-warmth',String(1-completed.length/5));
    const accent=document.createElementNS('http://www.w3.org/2000/svg','svg');
    accent.setAttribute('viewBox',`0 0 ${W} ${H}`);accent.setAttribute('preserveAspectRatio','none');
    accent.classList.add('village-restored-details');accent.setAttribute('aria-hidden','true');
    // These are drawn on the door's path, as scenery, and never receive pointer events.
    const sign=[
      '<path d="M-13 2h26m-20-1v-5m6 5v-8m6 8v-6" stroke="#486b45" stroke-width="4"/><path d="M-8 -6q-7-14 5-13q2 7-5 13m8-3q5-12 11-9q1 8-11 9" fill="#92c36d"/>',
      '<path d="M-14 3v-17L0-20l14 6V3Z" fill="#e0bd81" stroke="#694b38" stroke-width="3"/><path d="M0-16V0m-10-12v10m20-10v10" stroke="#fff0b5" stroke-width="2"/>',
      '<path d="M-13 2h26v-12h-26Z" fill="#67a989" stroke="#304c43" stroke-width="3"/><path d="M-9-4h18m-6-6v9" stroke="#e5f3b5" stroke-width="3"/>',
      '<path d="M-13 2h26v-20h-26Z" fill="#8b6849" stroke="#443931" stroke-width="3"/><circle r="7" cy="-9" fill="#ffd887"/><circle r="4" cy="-9" fill="#668684"/>',
      '<path d="M-15 3h30v-8h-30Z" fill="#b7774d" stroke="#513c2d" stroke-width="3"/><path d="m-9-5 8-13 6 6 7-3" fill="none" stroke="#fddea0" stroke-width="4"/>',
    ];
    accent.innerHTML=completed.map(id=>{const point=j.buildings[id]?.door;if(!point||!sign[id-1])return '';
      const [x,y]=point;return `<g transform="translate(${x+26} ${y-14})"><ellipse cy="3" rx="18" ry="5" fill="#24352e" opacity=".3"/>${sign[id-1]}</g>`;}).join('');
    layer.append(accent);
    // Restored buildings replace their withered look; the core lights up when all five are back.
    for(const [id,b] of Object.entries(j.buildings)){
      const done=id==='gallery'||(id==='core'?completed.length===5:completed.includes(Number(id)));if(!done||!b.rect)continue;
      const img=doc.createElement('img');img.className='village-restore'+(String(flash)===id||(id==='core'&&flash&&completed.length===5)?' just-restored':'');img.alt='';img.decoding='async';img.src=BASE+`restore-${id}.webp`;
      Object.assign(img.style,{left:pct(b.rect[0],W),top:pct(b.rect[1],H),width:pct(b.rect[2],W),height:pct(b.rect[3],H)});layer.insertBefore(img,accent);
      if(id==='core'){
        const light=doc.createElement('div');light.className='village-core-light'+(flash?' just-lit':'');light.setAttribute('role','img');light.setAttribute('aria-label','중앙 코어 점등 · 다섯 장소 복구 완료');
        Object.assign(light.style,{left:pct(b.rect[0],W),top:pct(b.rect[1],H),width:pct(b.rect[2],W),height:pct(b.rect[3],H)});layer.append(light);
      }
    }
    // Stage markers already rendered by the page move onto their building. A marker on a top-row building slides
    // down its roof just enough to clear the corner icons (--hud-top) while the camera rests at the map's top edge.
    const placeMarkers=()=>{const fh=root.offsetHeight,safe=parseFloat(doc.defaultView?.getComputedStyle(root).getPropertyValue('--hud-top'))||0;
      root.querySelectorAll('.map-marker[data-id]').forEach(m=>{const b=j.buildings[m.dataset.id];if(!b?.rect)return;const base=b.rect[1]+b.rect[3]*.3;m.style.setProperty('--x',(b.rect[0]+b.rect[2]/2)/W*100);m.style.setProperty('--y',base/H*100);
        if(overview||!fh||!m.offsetHeight)return;const top=m.getBoundingClientRect().top-root.getBoundingClientRect().top,lift=(safe+6-top)/fh*H;
        if(lift>0)m.style.setProperty('--y',Math.min(base+lift,b.rect[1]+b.rect[3]*.7)/H*100);});};
    const sprite=(key,cls,label,talk=false)=>{const c=j.characters?.[key];if(!c)return null;const el=doc.createElement(talk?'button':'div');el.className='village-sprite '+cls;if(talk){el.type='button';const cue=doc.createElement('span');cue.className='talk-cue';cue.setAttribute('aria-hidden','true');el.append(cue);}else el.setAttribute('role','img');el.setAttribute('aria-label',label);
      const rows=Object.keys(c.rows),cols=Math.max(...Object.values(c.rows));Object.assign(el.style,{width:pct(c.cell[0],W),aspectRatio:`${c.cell[0]}/${c.cell[1]}`,backgroundImage:`url('${BASE+c.src}')`,backgroundSize:`${cols*100}% ${rows.length*100}%`});
      // The anchor (feet point inside the cell) sits on the sprite's map position.
      const [ax,ay]=c.anchor||[c.cell[0]/2,c.cell[1]];el.style.setProperty('--ax',ax/c.cell[0]*100+'%');el.style.setProperty('--ay',ay/c.cell[1]*100+'%');
      layer.append(el);return {el,c,rows,cols,x:0,y:0,dir:'down',f:0};};
    const draw=(sp)=>{if(!sp)return;const row=sp.dir==='right'&&!sp.c.rows.right?'left':sp.dir,ri=Math.max(0,sp.rows.indexOf(row)),[a,b]=sp.c.walk?.[row]||[0,0],f=sp.moving&&b>a?a+Math.floor(sp.f)%(b-a+1):(sp.c.idle||0);
      sp.el.style.backgroundPosition=`${sp.cols>1?f/(sp.cols-1)*100:0}% ${sp.rows.length>1?ri/(sp.rows.length-1)*100:0}%`;
      sp.el.style.left=pct(sp.x,W);sp.el.style.top=pct(sp.y,H);sp.el.style.zIndex=String(10+Math.round(sp.y));sp.el.classList.toggle('flip',sp.dir==='right'&&!sp.c.rows.right&&sp.c.flipRight!==false);};
    // Camera: the world frame is larger than its scene; slide it so Haru stays near the middle, clamped at the map edges.
    // A view the learner slid by hand (free) stays put until the next walk or a hand-mode exit.
    const scene=root.parentElement;let cam=null,free=false,fitView=false,zoom=1,saved=null,smooth=0,camAt=0,freePoint=null;
    const listeners=new AbortController(),touches=new Map();let pinch=null;
    const range=(a,b,c)=>Math.max(a,Math.min(b,c));
    const positionIn=(x,y)=>[range(scene.clientWidth-root.offsetWidth,0,x),range(scene.clientHeight-root.offsetHeight,0,y)];
    const homeWidth=()=>Math.max(scene.clientWidth,scene.clientHeight*16/9)*(parseFloat(getComputedStyle(root).getPropertyValue('--map-zoom'))||1.35);
    const panUI=on=>{panning=on;const page=root.closest('.map-page');page?.classList.toggle('map-pan',on);page?.querySelector('[data-action="map-pan"]')?.setAttribute('aria-pressed',String(on));};
    const fitUI=()=>{const page=root.closest('.map-page');page?.classList.toggle('map-camera-fit',fitView);const button=page?.querySelector('[data-action="map-fit"]');button?.setAttribute('aria-pressed',String(fitView));button?.setAttribute('aria-label',fitView?'이전 지도 보기':'지도 전체 보기');};
    const widthFor=()=>{root.style.width=fitView?'min(100cqw, 100cqh * 16/9)':zoom===1?'':homeWidth()*zoom+'px';};
    const pointAt=(x,y)=>[(x-cam[0])/root.offsetWidth,(y-cam[1])/root.offsetHeight];
    const placeFree=(x,y,point)=>{place(...positionIn(x-point[0]*root.offsetWidth,y-point[1]*root.offsetHeight));freePoint=pointAt(scene.clientWidth/2,scene.clientHeight/2);};
    const restoreFree=()=>{if(freePoint)placeFree(scene.clientWidth/2,scene.clientHeight/2,freePoint);};
    const leaveFit=()=>{fitView=false;overview=false;root.closest('.map-page')?.classList.remove('map-overview');fitUI();};
    const place=(x,y)=>{cam=[x,y];root.style.transform=`translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;clearControls();};
    const follow=(snap=false)=>{if((free&&!fitView)||!haru||!scene)return;const sw=scene.clientWidth,sh=scene.clientHeight,fw=root.offsetWidth,fh=root.offsetHeight;if(!fw||!fh)return;
      const x=overview||fitView?(sw-fw)/2:Math.min(0,Math.max(sw-fw,sw/2-haru.x/W*fw)),y=overview||fitView?(sh-fh)/2:Math.min(0,Math.max(sh-fh,sh*.55-haru.y/H*fh));
      cancelAnimationFrame(smooth);
      const now=performance.now(),blend=snap||!cam||!camAt||reduced()||overview||fitView?1:1-Math.exp(-Math.min(40,now-camAt)/74);
      camAt=now;
      const dx=cam?x-cam[0]:0,dy=cam?y-cam[1]:0;
      if(!cam||Math.hypot(dx,dy)<.6||blend===1){place(x,y);return;}
      place(cam[0]+dx*blend,cam[1]+dy*blend);smooth=requestAnimationFrame(()=>follow());};
    // Hand mode: dragging slides the view, clamped to the map edges like the walking camera.
    let drag=null,dragged=false;
    const local=e=>{const r=scene.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};
    const mid=()=>{const [a,b]=[...touches.values()];return {x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,d:Math.hypot(a[0]-b[0],a[1]-b[1])};};
    const zoomAt=(ratio,x,y,point)=>{cancelAnimationFrame(smooth);leaveFit();saved=null;zoom=range(1,2,ratio);free=true;panUI(true);widthFor();placeFree(x,y,point);syncResidentTalk();};
    const onDown=e=>{
      if(isBlocked()||(e.button??0)>0||e.target.closest?.('button'))return;
      if(e.pointerType==='touch'){
        if(!touches.size)dragged=false;
        touches.set(e.pointerId,local(e));scene.setPointerCapture?.(e.pointerId);
        if(touches.size===2){api.stop?.();onWalk?.();drag=null;dragged=true;const p=mid();pinch={...p,k:root.offsetWidth/homeWidth(),point:pointAt(p.x,p.y)};return;}
      }
      if(overview||fitView||drag||pinch)return;dragged=false;cancelAnimationFrame(smooth);
      if(root.classList.contains('travelling')){api.stop?.();onWalk?.();}
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,cam:cam||[0,0]};
    };
    const onMove=e=>{
      if(isBlocked())return;
      if(touches.has(e.pointerId))touches.set(e.pointerId,local(e));
      if(pinch&&touches.size>=2){const p=mid();zoomAt(pinch.k*p.d/Math.max(8,pinch.d),p.x,p.y,pinch.point);return;}
      if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(!dragged&&Math.hypot(dx,dy)<8)return;
      if(!dragged){dragged=true;api.stop?.();onWalk?.();if(e.pointerType==='mouse')scene.setPointerCapture?.(e.pointerId);scene.classList.add('dragging');}
      free=true;panUI(true);place(...positionIn(drag.cam[0]+dx,drag.cam[1]+dy));freePoint=pointAt(scene.clientWidth/2,scene.clientHeight/2);
    };
    const onUp=e=>{touches.delete(e.pointerId);if(touches.size<2)pinch=null;if(!drag||e.pointerId!==drag.id)return;drag=null;scene.classList.remove('dragging');};
    const onDragClick=e=>{if(!dragged)return;dragged=false;e.stopPropagation();e.preventDefault();};
    const onNativeDrag=e=>e.preventDefault();
    if(scene){scene.addEventListener('pointerdown',onDown);scene.addEventListener('pointermove',onMove);scene.addEventListener('pointerup',onUp);scene.addEventListener('pointercancel',onUp);scene.addEventListener('click',onDragClick,true);scene.addEventListener('dragstart',onNativeDrag);}
    scene?.addEventListener('wheel',e=>{if(isBlocked()||e.target.closest?.('button'))return;e.preventDefault();api.stop?.();onWalk?.();const [x,y]=local(e);zoomAt(root.offsetWidth/homeWidth()*Math.exp(-e.deltaY*.0015),x,y,pointAt(x,y));},{passive:false,signal:listeners.signal});
    const resumeFollow=()=>{
      touches.clear();pinch=null;drag=null;scene?.classList.remove('dragging');
      if(!fitView&&!overview&&!free&&!panning&&zoom===1)return;
      free=false;freePoint=null;saved=null;zoom=1;leaveFit();widthFor();panUI(false);follow(true);
    };
    api.fit=()=>{
      api.stop?.();cancelAnimationFrame(smooth);
      if(!fitView){saved={zoom,point:free||panning?pointAt(scene.clientWidth/2,scene.clientHeight/2):null};fitView=true;panUI(false);fitUI();widthFor();follow(true);}
      else{leaveFit();zoom=saved?.zoom??1;freePoint=saved?.point??null;free=!!freePoint;panUI(free);widthFor();free?restoreFree():follow(true);saved=null;}
      syncResidentTalk();
    };
    api.pan=on=>{
      if(!on){resumeFollow();syncResidentTalk();return;}
      cancelAnimationFrame(smooth);
      if(fitView||overview){leaveFit();saved=null;widthFor();follow(true);}
      panUI(true);free=true;freePoint=pointAt(scene.clientWidth/2,scene.clientHeight/2);syncResidentTalk();
    };
    // While the camera slides, a marker that would sit under a corner icon or floating button fades out until it is clear.
    let controls=null;
    const clearControls=()=>{controls??=[...doc.querySelectorAll('.screen-hud>nav,.map-direction,.map-next,.map-camera-tools')].map(e=>e.getBoundingClientRect()).filter(r=>r.width);
      const bounds=scene.getBoundingClientRect(),safe=parseFloat(doc.defaultView?.getComputedStyle(root).getPropertyValue('--hud-top'))||76;
      root.querySelectorAll('.map-marker[data-id]').forEach(m=>{m.style.translate='0px 0px';const initial=m.getBoundingClientRect(),[dx,dy]=markerSafeOffset(initial,{left:bounds.left+8,right:bounds.right-8,top:bounds.top+safe+6,bottom:bounds.bottom-8},bounds);m.style.translate=`${dx}px ${dy}px`;const q=m.getBoundingClientRect();m.classList.toggle('under-control',q.width>0&&controls.some(r=>q.left<r.right&&q.right>r.left&&q.top<r.bottom&&q.bottom>r.top));});};
    const onResize=()=>{controls=null;widthFor();if(free&&!fitView)restoreFree();else follow(true);placeMarkers();clearControls();};doc.defaultView?.addEventListener('resize',onResize);
    const doorOf=id=>j.buildings[id]?.door;
    const start=doorOf(position)||j.spawn||j.entrance||graph.nodes[Object.keys(graph.nodes)[0]]||[W/2,H*.85];
    const haru=sprite('haru','haru','하루 탐험가'),mori=sprite('mori','mori-follow',overview?'모리':'모리에게 길 물어보기',!overview);
    const trail=[];
    if(haru){haru.x=start[0];haru.y=start[1];draw(haru);follow();placeMarkers();clearControls();}
    if(mori){mori.x=start[0]-40;mori.y=start[1]+6;draw(mori);mori.el.dataset.npc='mori';}
    // Position by feet in the existing village coordinate space; the camera projects to the scene.
    const encounters=haru&&!encounterPreview?mountVillageEncounters({host:scene,
      stages:COMMISSIONS.map((commission,i)=>{
        const building=j.buildings[i+1],door=building?.door;if(!completed.includes(i+1)||!door)return null;
        const node=building.node??nearestNode(graph,door);
        const path=graph.edges.find(edge=>edge.includes(node));
        const neighbor=graph.nodes[path?.find(id=>id!==node)];
        if(!neighbor)return null;
        // The encounter must sit on a reachable path so both actors can touch it.
        const [dx,dy]=[neighbor[0]-door[0],neighbor[1]-door[1]];
        const step=Math.min(.72,36/Math.max(1,Math.hypot(dx,dy)));
        return {name:building.name,x:door[0]+dx*step,y:door[1]+dy*step};
      }),progress:encounterProgress,onSave:onEncounterSave,blocked:()=>paused||overview||fitView||isBlocked(),
      reduced,tone:onEncounterTone,actors:[haru.el,mori?.el],
    }):null;
    let encounterFrame=0;
    const drawEncounters=now=>{
      if(!active||!encounters)return;
      const sx=root.offsetWidth/W,sy=root.offsetHeight/H;
      encounters.update({hero:haru,ally:mori,now,scale:sx,
        project:({x,y})=>({x:(cam?.[0]||0)+x*sx,y:(cam?.[1]||0)+y*sy})});
      encounterFrame=requestAnimationFrame(drawEncounters);
    };
    if(encounters)drawEncounters(performance.now());
    // The artwork stays in the village; only a nearby resident offers a talk label.
    const residentTalk=[];
    const syncResidentTalk=()=>{if(haru)for(const {el,name,d} of residentTalk){const near=!overview&&!fitView&&!panning&&Math.hypot(haru.x-d[0],haru.y-d[1])<=190;el.classList.toggle('near-talk',near);el.tabIndex=near?0:-1;el.setAttribute('aria-label',near?name+'에게 말 걸기':name);el.toggleAttribute('aria-hidden',!near);}};
    for(const npc of NPCS){const b=j.buildings[npc.near],d=b?.npc||(b?.door&&[b.door[0]+70,b.door[1]+10]);if(!d)continue;
      const el=doc.createElement('button');el.type='button';el.className='village-resident';el.dataset.npc=npc.id;el.setAttribute('aria-label',npc.name+'에게 말 걸기');
      const img=doc.createElement('img');img.alt='';img.src=BASE+'npc-'+npc.id+'.webp';img.draggable=false;el.append(img);
      const name=doc.createElement('span');name.textContent=npc.name;el.append(name);
      img.style.animationDelay=-(npc.near*.37)+'s';// staggered idle bob so the residents do not breathe in sync
      Object.assign(el.style,{left:pct(d[0],W),top:pct(d[1],H),zIndex:String(10+Math.round(d[1]))});layer.append(el);residentTalk.push({el,name:npc.name,d});
    }
    if(panning)api.pan(true);root.addEventListener('click',onTap);
    function onTap(e){
      if(overview||fitView||paused||isBlocked()||panning)return;
      const npcEl=e.target.closest?.('[data-npc]');
      if(npcEl){e.stopPropagation();if(npcEl.classList.contains('village-resident')&&!npcEl.classList.contains('near-talk'))return;api.stop?.();onWalk?.();const npc=NPCS.find(n=>n.id===npcEl.dataset.npc);const text=npc?npcLine(npc,completed):null;onTalk?.(npc||{id:'mori',name:'모리'},text,npcEl);return;}
      if(e.target.closest?.('button,[data-action],.world-top,.world-bottom'))return;
      const r=layer.getBoundingClientRect();if(!r.width)return;
      const p=[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];
      // Building taps activate the matching marker: stage travel or gallery entry.
      const hit=buildingAt(j.buildings,p),marker=hit&&root.querySelector(`.map-marker[data-id="${hit}"]`);if(marker){marker.click();return;}
      onWalk?.();walkTo(p,null);
    }
    function walkTo(point,arriveId){
      if(!haru){onWalk?.();onError?.();return;}
      api.stop?.();resumeFollow();if(help)help.textContent='문까지 안내하고 있어. 방향키를 누르면 직접 걸을 수 있어.';
      const from=nearestNode(graph,[haru.x,haru.y]),to=nearestNode(graph,point),ids=from&&to?villagePath(graph,from,to):[];
      if(!ids.length){onWalk?.();return;}
      const pts=[...ids.map(id=>graph.nodes[id]),...(arriveId!=null?[point]:[])];
      if(reduced()||!pts.length){const p=pts.at(-1)||point;haru.x=p[0];haru.y=p[1];draw(haru);follow();if(mori){mori.x=p[0]-40;mori.y=p[1]+6;draw(mori);}syncResidentTalk();if(arriveId!=null)onArrive?.(arriveId);else syncWalkUI();return;}
      cancelAnimationFrame(frame);let last=0;away=false;root.classList.add('travelling');haru.moving=true;if(mori)mori.moving=true;
      const step=t=>{if(!active)return;if(paused||away||isBlocked()){last=0;frame=requestAnimationFrame(step);return;}const dt=Math.min(last?t-last:16,100);last=t;const p=pts[0],dx=p[0]-haru.x,dy=p[1]-haru.y,d=Math.hypot(dx,dy),v=dt*.4;
        if(d<=v){haru.x=p[0];haru.y=p[1];pts.shift();}else{const was=Math.floor(haru.f/3);haru.x+=dx/d*v;haru.y+=dy/d*v;haru.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');haru.f+=v/14;if(Math.floor(haru.f/3)>was)onStep?.();}
        trail.push([haru.x,haru.y,haru.dir]);if(trail.length>40)trail.shift();
        if(mori&&trail.length>14){const [mx,my,md]=trail[trail.length-14];const mdx=mx-mori.x,mdy=my-mori.y;if(Math.hypot(mdx,mdy)>.5){mori.f+=Math.hypot(mdx,mdy)/14;mori.dir=md;}mori.x=mx;mori.y=my;}
        draw(haru);draw(mori);follow();syncResidentTalk();
        if(pts.length){frame=requestAnimationFrame(step);return;}
        haru.f=0;haru.moving=false;haru.dir='down';draw(haru);if(mori){mori.f=0;mori.moving=false;mori.dir='down';draw(mori);}frame=null;root.classList.remove('travelling');if(arriveId!=null)onArrive?.(arriveId);else syncWalkUI();};
      frame=requestAnimationFrame(step);
    }
    const page=root.closest('.map-page'),help=page.querySelector('#map-walk-help');
    const nextButton=page.querySelector('.map-next > [data-action="map-select"]');
    const nearbyDoor=(radius=60)=>!haru?null:Object.entries(j.buildings).filter(([id,b])=>id!=='core'&&b.door&&Math.hypot(b.door[0]-haru.x,b.door[1]-haru.y)<radius).sort(([,a],[,b])=>Math.hypot(a.door[0]-haru.x,a.door[1]-haru.y)-Math.hypot(b.door[0]-haru.x,b.door[1]-haru.y))[0];
    const syncWalkUI=(blockedDirection=null)=>{
      if(!haru||overview)return;const choices=availableDirections(graph,[haru.x,haru.y]),nearby=nearbyDoor();
      for(const b of page.querySelectorAll('[data-action="map-walk"]'))b.dataset.available=String(choices.includes(b.dataset.id));
      const nextAtDoor=nearby&&nearby[0]===nextButton?.dataset.id;
      if(help){const arrows={up:'↑',down:'↓',left:'←',right:'→'};help.textContent=nearby?(nextAtDoor?'문 앞에 도착했어. 오른쪽 아래 버튼이나 Enter를 눌러 봐.':'문 앞에 도착했어. 장소 이름이나 Enter를 눌러 봐.'):blockedDirection?'이쪽엔 길이 없어. '+choices.map(d=>arrows[d]).join(' ')+' 방향으로 걸어 봐.':'방향키를 꾹 눌러 걸어 봐. 건물을 누르면 문까지 안내해.';}
      controls=null;clearControls();syncResidentTalk();
    };
    api.stop=()=>{cancelAnimationFrame(frame);frame=null;manual=null;pending.length=0;root.classList.remove('travelling');for(const sp of [haru,mori])if(sp){sp.moving=false;sp.f=0;draw(sp);}syncWalkUI();};
    api.move=id=>{const d=doorOf(String(id));if(d)walkTo(d,id);else onWalk?.();};
    api.walk=(direction,options={})=>{
      if(paused||isBlocked()||!haru)return;
      api.stop();onWalk?.();resumeFollow();away=false;manual=createDirectionalWalker(graph,[haru.x,haru.y],direction,options);
      root.classList.add('travelling');haru.moving=true;if(mori)mori.moving=true;let last=0,walked=0;
      const step=t=>{if(!active||!manual)return;if(paused||away||isBlocked()){api.stop();return;}
        const dt=Math.min(last?t-last:16,50);last=t;const moved=manual.step(dt*.26),[x,y]=moved.point,dx=x-haru.x,dy=y-haru.y;
        if(moved.distance){walked+=moved.distance;const was=Math.floor(haru.f/3);haru.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');haru.f+=moved.distance/14;
          if(Math.floor(haru.f/3)>was)onStep?.();haru.x=x;haru.y=y;trail.push([x,y,haru.dir]);if(trail.length>40)trail.shift();
          if(mori&&trail.length>14){const [mx,my,md]=trail[trail.length-14];mori.f+=Math.hypot(mx-mori.x,my-mori.y)/14;mori.x=mx;mori.y=my;mori.dir=md;}
          draw(haru);draw(mori);follow();syncResidentTalk();}
        if(moved.done){api.stop();syncWalkUI(walked===0||moved.distance===0?direction:null);return;}frame=requestAnimationFrame(step);
      };frame=requestAnimationFrame(step);
    };
    api.release=()=>{manual?.release();if(manual?.done)api.stop();};
    directions=bindMapDirections(root.closest('.map-page'),{walk:(...args)=>api.walk(...args),release:()=>api.release(),stop:()=>{if(manual)api.stop();},blocked:()=>paused||isBlocked()});
    api.interact=(radius=60)=>{if(overview||paused||isBlocked()||!haru)return;const nearby=Object.entries(j.buildings).filter(([id,b])=>id!=='core'&&b.door&&Math.hypot(b.door[0]-haru.x,b.door[1]-haru.y)<radius).sort(([,a],[,b])=>Math.hypot(a.door[0]-haru.x,a.door[1]-haru.y)-Math.hypot(b.door[0]-haru.x,b.door[1]-haru.y))[0];if(nearby){api.stop();onInteract?.(nearby[0]);}};
    syncWalkUI();
    // Leaving the app holds a walk where it is; it carries on to the same door on return (a new tap also resumes).
    const onBlur=()=>{away=true;},onFocus=()=>{away=false;};doc.defaultView?.addEventListener('blur',onBlur);doc.defaultView?.addEventListener('focus',onFocus);
    api.destroy=()=>{directions.destroy();active=false;cancelAnimationFrame(encounterFrame);encounters?.destroy();cancelAnimationFrame(frame);cancelAnimationFrame(smooth);listeners.abort();doc.defaultView?.removeEventListener('blur',onBlur);doc.defaultView?.removeEventListener('focus',onFocus);doc.defaultView?.removeEventListener('resize',onResize);if(scene){scene.removeEventListener('pointerdown',onDown);scene.removeEventListener('pointermove',onMove);scene.removeEventListener('pointerup',onUp);scene.removeEventListener('pointercancel',onUp);scene.removeEventListener('click',onDragClick,true);scene.removeEventListener('dragstart',onNativeDrag);}root.style.transform='';root.removeEventListener('click',onTap);layer.remove();};
    built=true;
  }
  return {move(id){built?api.move(id):pending.push(id);},walk(direction,options){api.walk?.(direction,options);},release(){api.release?.();},fit(){api.fit?.();},pan(on){panning=!!on;api.pan?.(panning);},interact(){api.interact?.();},pause(){paused=true;directions?.cancel();},resume(){paused=false;},stop(){pending.length=0;api.stop?.();},destroy(){pending.length=0;api.destroy();active=false;}};
}
