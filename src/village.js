import {COMMISSIONS} from './campaign.js';
// Main map: a top-down pixel village (screen 01). Same contract as createTrailMap: {move(id), destroy()}.
// Layout (map size, building rects and doors, walk nodes/edges, sprite cells) comes from assets/village/village.json.
const BASE=new URL('../assets/village/',import.meta.url).href;
let loading=null;
export function villageReady(){
  if(!loading)loading=typeof fetch==='function'?fetch(BASE+'village.json').then(r=>r.ok?r.json():null).catch(()=>null).then(j=>{if(!j)loading=null;return j;}):Promise.resolve(null);
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
function graphOf(j){const nodes=Array.isArray(j.nodes)?Object.fromEntries(j.nodes.map((n,i)=>[String(i),Array.isArray(n)?n:[n.x,n.y]])):Object.fromEntries(Object.entries(j.nodes||{}).map(([k,n])=>[k,Array.isArray(n)?n:[n.x,n.y]]));return {nodes,edges:(j.edges||[]).map(([a,b])=>[String(a),String(b)])};}

export function createVillage(root,{position='entrance',completed=[],flash=null,onArrive,onTalk,onStep,onWalk,onInteract,onError,isBlocked=()=>false}={}){
  let active=true,built=false,paused=false,frame=null,api={move(){},destroy(){active=false;}};
  const pending=[];
  const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  villageReady().then(j=>{if(!active)return;if(!j?.map?.w||!j?.map?.h||!j.buildings||!j.nodes){loading=null;onError?.();return;}if(!root?.ownerDocument)return;build(j);while(pending.length)api.move(pending.shift());}).catch(()=>{loading=null;if(active)onError?.();});
  function build(j){
    const W=j.map.w,H=j.map.h,pct=(v,t)=>v/t*100+'%',graph=graphOf(j),doc=root.ownerDocument;
    const layer=doc.createElement('div');layer.className='village-layer';root.append(layer);
    // Restored buildings replace their withered look; the core lights up when all five are back.
    for(const [id,b] of Object.entries(j.buildings)){
      const done=id==='gallery'||(id==='core'?completed.length===5:completed.includes(Number(id)));if(!done||!b.rect)continue;
      const img=doc.createElement('img');img.className='village-restore'+(String(flash)===id||(id==='core'&&flash&&completed.length===5)?' just-restored':'');img.alt='';img.decoding='async';img.src=BASE+`restore-${id}.webp`;
      Object.assign(img.style,{left:pct(b.rect[0],W),top:pct(b.rect[1],H),width:pct(b.rect[2],W),height:pct(b.rect[3],H)});layer.append(img);
    }
    // Stage markers already rendered by the page move onto their building. A marker on a top-row building slides
    // down its roof just enough to clear the corner icons (--hud-top) while the camera rests at the map's top edge.
    const placeMarkers=()=>{const fh=root.offsetHeight,safe=parseFloat(doc.defaultView?.getComputedStyle(root).getPropertyValue('--hud-top'))||0;
      root.querySelectorAll('.map-marker[data-id]').forEach(m=>{const b=j.buildings[m.dataset.id];if(!b?.rect)return;const base=b.rect[1]+b.rect[3]*.3;m.style.setProperty('--x',(b.rect[0]+b.rect[2]/2)/W*100);m.style.setProperty('--y',base/H*100);
        if(!fh||!m.offsetHeight)return;const top=m.getBoundingClientRect().top-root.getBoundingClientRect().top,lift=(safe+6-top)/fh*H;
        if(lift>0)m.style.setProperty('--y',Math.min(base+lift,b.rect[1]+b.rect[3]*.7)/H*100);});};
    placeMarkers();
    const sprite=(key,cls,label,talk=false)=>{const c=j.characters?.[key];if(!c)return null;const el=doc.createElement(talk?'button':'div');el.className='village-sprite '+cls;if(talk){el.type='button';const cue=doc.createElement('span');cue.className='talk-cue';cue.setAttribute('aria-hidden','true');el.append(cue);}else el.setAttribute('role','img');el.setAttribute('aria-label',label);
      const rows=Object.keys(c.rows),cols=Math.max(...Object.values(c.rows));Object.assign(el.style,{width:pct(c.cell[0],W),aspectRatio:`${c.cell[0]}/${c.cell[1]}`,backgroundImage:`url('${BASE+c.src}')`,backgroundSize:`${cols*100}% ${rows.length*100}%`});
      // The anchor (feet point inside the cell) sits on the sprite's map position.
      const [ax,ay]=c.anchor||[c.cell[0]/2,c.cell[1]];el.style.setProperty('--ax',ax/c.cell[0]*100+'%');el.style.setProperty('--ay',ay/c.cell[1]*100+'%');
      layer.append(el);return {el,c,rows,cols,x:0,y:0,dir:'down',f:0};};
    const draw=(sp)=>{if(!sp)return;const row=sp.dir==='right'&&!sp.c.rows.right?'left':sp.dir,ri=Math.max(0,sp.rows.indexOf(row)),[a,b]=sp.c.walk?.[row]||[0,0],f=sp.moving&&b>a?a+Math.floor(sp.f)%(b-a+1):(sp.c.idle||0);
      sp.el.style.backgroundPosition=`${sp.cols>1?f/(sp.cols-1)*100:0}% ${sp.rows.length>1?ri/(sp.rows.length-1)*100:0}%`;
      sp.el.style.left=pct(sp.x,W);sp.el.style.top=pct(sp.y,H);sp.el.style.zIndex=String(10+Math.round(sp.y));sp.el.classList.toggle('flip',sp.dir==='right'&&!sp.c.rows.right&&sp.c.flipRight!==false);};
    // Camera: the world frame is larger than its scene; slide it so Haru stays near the middle, clamped at the map edges.
    const scene=root.parentElement;let cam=null;
    const follow=()=>{if(!haru||!scene)return;const sw=scene.clientWidth,sh=scene.clientHeight,fw=root.offsetWidth,fh=root.offsetHeight;if(!fw||!fh)return;
      const x=Math.min(0,Math.max(sw-fw,sw/2-haru.x/W*fw)),y=Math.min(0,Math.max(sh-fh,sh*.55-haru.y/H*fh));
      if(cam&&Math.abs(cam[0]-x)<.5&&Math.abs(cam[1]-y)<.5)return;cam=[x,y];root.style.transform=`translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;clearControls();};
    // While the camera slides, a marker that would sit under a corner icon or floating button fades out until it is clear.
    let controls=null;
    const clearControls=()=>{controls??=[...doc.querySelectorAll('.screen-hud>nav,.map-direction,.map-next')].map(e=>e.getBoundingClientRect()).filter(r=>r.width);
      root.querySelectorAll('.map-marker[data-id]').forEach(m=>{const q=m.getBoundingClientRect();m.classList.toggle('under-control',q.width>0&&controls.some(r=>q.left<r.right&&q.right>r.left&&q.top<r.bottom&&q.bottom>r.top));});};
    const onResize=()=>{cam=null;controls=null;placeMarkers();follow();};doc.defaultView?.addEventListener('resize',onResize);
    const doorOf=id=>j.buildings[id]?.door;
    const start=doorOf(position)||j.spawn||j.entrance||graph.nodes[Object.keys(graph.nodes)[0]]||[W/2,H*.85];
    const haru=sprite('haru','haru','하루 탐험가'),mori=sprite('mori','mori-follow','모리에게 길 물어보기',true);
    const trail=[];
    if(haru){haru.x=start[0];haru.y=start[1];draw(haru);follow();}
    if(mori){mori.x=start[0]-40;mori.y=start[1]+6;draw(mori);mori.el.dataset.npc='mori';}
    // NPCs face the player by their building; tapping one opens a speech bubble.
    for(const npc of NPCS){const b=j.buildings[npc.near],d=b?.npc||(b?.door&&[b.door[0]+70,b.door[1]+10]);if(!d)continue;
      const el=doc.createElement('button');el.type='button';el.className='village-resident';el.dataset.npc=npc.id;el.setAttribute('aria-label',npc.name+'에게 말 걸기');
      const img=doc.createElement('img');img.alt='';img.src=BASE+'npc-'+npc.id+'.webp';img.draggable=false;el.append(img);
      const name=doc.createElement('span');name.textContent=npc.name;el.append(name);
      img.style.animationDelay=-(npc.near*.37)+'s';// staggered idle bob so the residents do not breathe in sync
      Object.assign(el.style,{left:pct(d[0],W),top:pct(d[1],H),zIndex:String(10+Math.round(d[1]))});layer.append(el);
    }
    root.addEventListener('click',onTap);
    function onTap(e){
      if(paused||isBlocked())return;
      const npcEl=e.target.closest?.('[data-npc]');
      if(npcEl){e.stopPropagation();const npc=NPCS.find(n=>n.id===npcEl.dataset.npc);const text=npc?npcLine(npc,completed):null;onTalk?.(npc||{id:'mori',name:'모리'},text,npcEl);return;}
      if(e.target.closest?.('button,[data-action],.world-top,.world-bottom'))return;
      const r=layer.getBoundingClientRect();if(!r.width)return;
      const p=[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];
      // Building taps activate the matching marker: stage travel or gallery entry.
      const hit=buildingAt(j.buildings,p),marker=hit&&root.querySelector(`.map-marker[data-id="${hit}"]`);if(marker){marker.click();return;}
      onWalk?.();walkTo(p,null);
    }
    function walkTo(point,arriveId){
      if(!haru){if(arriveId!=null)onArrive?.(arriveId);return;}
      api.stop?.();
      const from=nearestNode(graph,[haru.x,haru.y]),to=nearestNode(graph,point),ids=from&&to?villagePath(graph,from,to):[];
      const pts=[...ids.map(id=>graph.nodes[id]),...(arriveId!=null?[point]:[])];
      if(reduced()||!pts.length){const p=pts.at(-1)||point;haru.x=p[0];haru.y=p[1];draw(haru);follow();if(mori){mori.x=p[0]-40;mori.y=p[1]+6;draw(mori);}if(arriveId!=null)onArrive?.(arriveId);else api.interact?.(35);return;}
      cancelAnimationFrame(frame);let last=0;root.classList.add('travelling');haru.moving=true;if(mori)mori.moving=true;
      const step=t=>{if(!active)return;if(paused||isBlocked()){last=0;frame=requestAnimationFrame(step);return;}const dt=Math.min(last?t-last:16,100);last=t;const p=pts[0],dx=p[0]-haru.x,dy=p[1]-haru.y,d=Math.hypot(dx,dy),v=dt*.4;
        if(d<=v){haru.x=p[0];haru.y=p[1];pts.shift();}else{const was=Math.floor(haru.f/3);haru.x+=dx/d*v;haru.y+=dy/d*v;haru.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');haru.f+=v/14;if(Math.floor(haru.f/3)>was)onStep?.();}
        trail.push([haru.x,haru.y,haru.dir]);if(trail.length>40)trail.shift();
        if(mori&&trail.length>14){const [mx,my,md]=trail[trail.length-14];const mdx=mx-mori.x,mdy=my-mori.y;if(Math.hypot(mdx,mdy)>.5){mori.f+=Math.hypot(mdx,mdy)/14;mori.dir=md;}mori.x=mx;mori.y=my;}
        draw(haru);draw(mori);follow();
        if(pts.length){frame=requestAnimationFrame(step);return;}
        haru.f=0;haru.moving=false;haru.dir='down';draw(haru);if(mori){mori.f=0;mori.moving=false;mori.dir='down';draw(mori);}frame=null;root.classList.remove('travelling');if(arriveId!=null)onArrive?.(arriveId);else api.interact?.(35);};
      frame=requestAnimationFrame(step);
    }
    api.stop=()=>{cancelAnimationFrame(frame);frame=null;pending.length=0;root.classList.remove('travelling');for(const sp of [haru,mori])if(sp){sp.moving=false;sp.f=0;draw(sp);}};
    api.move=id=>{const d=doorOf(String(id));if(d)walkTo(d,id);else onArrive?.(id);};
    api.walk=direction=>{if(paused||isBlocked()||!haru)return;const from=nearestNode(graph,[haru.x,haru.y]),to=directionalNode(graph,from,direction);api.stop();onWalk?.();if(to)walkTo(graph.nodes[to],null);};
    api.interact=(radius=85)=>{if(paused||isBlocked()||!haru)return;const nearby=Object.entries(j.buildings).filter(([id,b])=>id!=='core'&&b.door&&Math.hypot(b.door[0]-haru.x,b.door[1]-haru.y)<radius).sort(([,a],[,b])=>Math.hypot(a.door[0]-haru.x,a.door[1]-haru.y)-Math.hypot(b.door[0]-haru.x,b.door[1]-haru.y))[0];if(nearby){api.stop();onInteract?.(nearby[0]);}};
    const onBlur=()=>api.stop();doc.defaultView?.addEventListener('blur',onBlur);
    api.destroy=()=>{active=false;cancelAnimationFrame(frame);doc.defaultView?.removeEventListener('blur',onBlur);doc.defaultView?.removeEventListener('resize',onResize);root.style.transform='';root.removeEventListener('click',onTap);layer.remove();};
    built=true;
  }
  return {move(id){built?api.move(id):pending.push(id);},walk(direction){api.walk?.(direction);},interact(){api.interact?.();},pause(){paused=true;},resume(){paused=false;},stop(){pending.length=0;api.stop?.();},destroy(){pending.length=0;api.destroy();active=false;}};
}
