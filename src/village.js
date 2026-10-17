// Main map: a top-down pixel village (screen 01). Same contract as createTrailMap: {move(id), destroy()}.
// Layout (map size, building rects and doors, walk nodes/edges, sprite cells) comes from assets/village/village.json.
const BASE=new URL('../assets/village/',import.meta.url).href;
let data=null;
const ready=typeof fetch==='function'?fetch(BASE+'village.json').then(r=>r.ok?r.json():null).then(j=>{data=j;return j;}).catch(()=>null):Promise.resolve(null);
export const villageReady=()=>ready;

// Story NPCs stand by a building; their line changes once that place is restored.
export const NPCS=[
  {id:'researcher',name:'연구원 소라',near:'2',before:'박물관 표지판이 뒤죽박죽이야. 누가 봐도 같은 답이 나오는 기준이 필요해!',after:'표지판이 다시 정리됐어. 기준을 잘 세워 줘서 고마워!'},
  {id:'ranger',name:'레인저 하늘',near:'3',before:'생태 돔에서 동물들이 사는 곳 기록이 사라졌어. 같이 찾아 줄래?',after:'돔에 동물들이 돌아왔어! 숲과 연못과 바다 기록이 다 모였어.'},
  {id:'engineer',name:'기술자 도윤',near:'5',before:'동물의 몸에서 아이디어를 빌리면 멋진 물건을 만들 수 있어. 공방에서 기다릴게!',after:'네 발명품이 전시회에서 인기 최고야!'},
];
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
// Stage building (not the core, whose square overlaps the ring path) under a map point.
export const buildingAt=(buildings,[x,y])=>Object.entries(buildings).find(([id,{rect:r}={}])=>id!=='core'&&r&&x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3])?.[0]||null;
// The village json may give nodes as an array or an object; edges as index or id pairs.
function graphOf(j){const nodes=Array.isArray(j.nodes)?Object.fromEntries(j.nodes.map((n,i)=>[String(i),Array.isArray(n)?n:[n.x,n.y]])):Object.fromEntries(Object.entries(j.nodes||{}).map(([k,n])=>[k,Array.isArray(n)?n:[n.x,n.y]]));return {nodes,edges:(j.edges||[]).map(([a,b])=>[String(a),String(b)])};}

export function createVillage(root,{position='entrance',completed=[],flash=null,onArrive,onTalk}={}){
  let active=true,built=false,frame=null,api={move(){},destroy(){active=false;}};
  const pending=[];
  const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  ready.then(j=>{if(!active||!j||!root?.ownerDocument)return;build(j);while(pending.length)api.move(pending.shift());});
  function build(j){
    const W=j.map.w,H=j.map.h,pct=(v,t)=>v/t*100+'%',graph=graphOf(j),doc=root.ownerDocument;
    const layer=doc.createElement('div');layer.className='village-layer';root.append(layer);
    // Restored buildings replace their withered look; the core lights up when all five are back.
    for(const [id,b] of Object.entries(j.buildings)){
      const done=id==='core'?completed.length===5:completed.includes(Number(id));if(!done||!b.rect)continue;
      const img=doc.createElement('img');img.className='village-restore'+(String(flash)===id||(id==='core'&&flash&&completed.length===5)?' just-restored':'');img.alt='';img.decoding='async';img.src=BASE+`restore-${id}.webp`;
      Object.assign(img.style,{left:pct(b.rect[0],W),top:pct(b.rect[1],H),width:pct(b.rect[2],W),height:pct(b.rect[3],H)});layer.append(img);
    }
    // Stage markers already rendered by the page move onto their building.
    root.querySelectorAll('.map-marker[data-id]').forEach(m=>{const b=j.buildings[m.dataset.id];if(!b?.rect)return;m.style.setProperty('--x',(b.rect[0]+b.rect[2]/2)/W*100);m.style.setProperty('--y',(b.rect[1]+b.rect[3]*.3)/H*100);});
    const sprite=(key,cls,label)=>{const c=j.characters?.[key];if(!c)return null;const el=doc.createElement('div');el.className='village-sprite '+cls;el.setAttribute('role','img');el.setAttribute('aria-label',label);
      const rows=Object.keys(c.rows),cols=Math.max(...Object.values(c.rows));Object.assign(el.style,{width:pct(c.cell[0],W),aspectRatio:`${c.cell[0]}/${c.cell[1]}`,backgroundImage:`url('${BASE+c.src}')`,backgroundSize:`${cols*100}% ${rows.length*100}%`});
      // The anchor (feet point inside the cell) sits on the sprite's map position.
      const [ax,ay]=c.anchor||[c.cell[0]/2,c.cell[1]];el.style.setProperty('--ax',ax/c.cell[0]*100+'%');el.style.setProperty('--ay',ay/c.cell[1]*100+'%');
      layer.append(el);return {el,c,rows,cols,x:0,y:0,dir:'down',f:0};};
    const draw=(sp)=>{if(!sp)return;const row=sp.dir==='right'&&!sp.c.rows.right?'left':sp.dir,ri=Math.max(0,sp.rows.indexOf(row)),[a,b]=sp.c.walk?.[row]||[0,0],f=sp.moving&&b>a?a+Math.floor(sp.f)%(b-a+1):(sp.c.idle||0);
      sp.el.style.backgroundPosition=`${sp.cols>1?f/(sp.cols-1)*100:0}% ${sp.rows.length>1?ri/(sp.rows.length-1)*100:0}%`;
      sp.el.style.left=pct(sp.x,W);sp.el.style.top=pct(sp.y,H);sp.el.style.zIndex=String(10+Math.round(sp.y));sp.el.classList.toggle('flip',sp.dir==='right'&&!sp.c.rows.right&&sp.c.flipRight!==false);};
    const doorOf=id=>j.buildings[id]?.door;
    const start=doorOf(position)||j.spawn||j.entrance||graph.nodes[Object.keys(graph.nodes)[0]]||[W/2,H*.85];
    const haru=sprite('haru','haru','하루 탐험가'),mori=sprite('mori','mori-follow','하루를 따라가는 모리');
    const trail=[];
    if(haru){haru.x=start[0];haru.y=start[1];draw(haru);}
    if(mori){mori.x=start[0]-40;mori.y=start[1]+6;draw(mori);mori.el.dataset.npc='mori';}
    // NPCs face the player by their building; tapping one opens a speech bubble.
    for(const npc of NPCS){const b=j.buildings[npc.near],d=b?.npc||(b?.door&&[b.door[0]+70,b.door[1]+10]);const sp=sprite(npc.id,'npc',npc.name);if(!sp||!d)continue;sp.x=d[0];sp.y=d[1];draw(sp);sp.el.dataset.npc=npc.id;sp.el.tabIndex=0;sp.el.setAttribute('role','button');}
    root.addEventListener('click',onTap);
    function onTap(e){
      const npcEl=e.target.closest?.('[data-npc]');
      if(npcEl){e.stopPropagation();const npc=NPCS.find(n=>n.id===npcEl.dataset.npc);const text=npc?npcLine(npc,completed):null;onTalk?.(npc||{id:'mori',name:'모리'},text,npcEl);return;}
      if(e.target.closest?.('button,[data-action],.world-top,.world-bottom'))return;
      const r=layer.getBoundingClientRect();if(!r.width)return;
      const p=[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];
      // Tapping a stage building works like its marker: select it, then walk to its door.
      const hit=buildingAt(j.buildings,p),marker=hit&&root.querySelector(`.map-marker[data-id="${hit}"]`);if(marker){marker.click();return;}
      walkTo(p,null);
    }
    function walkTo(point,arriveId){
      if(!haru){if(arriveId!=null)onArrive?.(arriveId);return;}
      const from=nearestNode(graph,[haru.x,haru.y]),to=nearestNode(graph,point),ids=from&&to?villagePath(graph,from,to):[];
      const pts=[...ids.map(id=>graph.nodes[id]),...(arriveId!=null?[point]:[])];
      if(reduced()||!pts.length){const p=pts.at(-1)||point;haru.x=p[0];haru.y=p[1];draw(haru);if(mori){mori.x=p[0]-40;mori.y=p[1]+6;draw(mori);}if(arriveId!=null)onArrive?.(arriveId);return;}
      cancelAnimationFrame(frame);let last=0;root.classList.add('travelling');haru.moving=true;if(mori)mori.moving=true;
      const step=t=>{if(!active)return;const dt=Math.min(last?t-last:16,100);last=t;const p=pts[0],dx=p[0]-haru.x,dy=p[1]-haru.y,d=Math.hypot(dx,dy),v=dt*.24;
        if(d<=v){haru.x=p[0];haru.y=p[1];pts.shift();}else{haru.x+=dx/d*v;haru.y+=dy/d*v;haru.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');haru.f+=v/14;}
        trail.push([haru.x,haru.y,haru.dir]);if(trail.length>40)trail.shift();
        if(mori&&trail.length>14){const [mx,my,md]=trail[trail.length-14];const mdx=mx-mori.x,mdy=my-mori.y;if(Math.hypot(mdx,mdy)>.5){mori.f+=Math.hypot(mdx,mdy)/14;mori.dir=md;}mori.x=mx;mori.y=my;}
        draw(haru);draw(mori);
        if(pts.length){frame=requestAnimationFrame(step);return;}
        haru.f=0;haru.moving=false;haru.dir='down';draw(haru);if(mori){mori.f=0;mori.moving=false;mori.dir='down';draw(mori);}frame=null;root.classList.remove('travelling');if(arriveId!=null)onArrive?.(arriveId);};
      frame=requestAnimationFrame(step);
    }
    api.move=id=>{const d=doorOf(String(id));if(d)walkTo(d,id);else onArrive?.(id);};
    api.destroy=()=>{active=false;cancelAnimationFrame(frame);root.removeEventListener('click',onTap);layer.remove();};
    built=true;
  }
  return {move(id){built?api.move(id):pending.push(id);},destroy(){api.destroy();active=false;}};
}
