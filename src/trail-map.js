// Measured waypoints follow the trail painted in assets/adventure/trail-map.webp.
// A graph avoids cutting across trees, buildings and the pond.
export const MAP_NODES={
  entrance:[11,82],gate:[9,81],bend:[12,68],fork:[20,57],one:[19,48],gardenFork:[24,43],two:[32,31],
  bridge:[28,63],campLeft:[40,73],camp:[55,80],campRight:[65,74],eastBend:[75,65],eastFork:[80,55],four:[78,49],
  pondFork:[68,44],three:[63,32],five:[82,79],
};
const edges=[['entrance','gate'],['gate','bend'],['bend','fork'],['fork','one'],['fork','gardenFork'],['gardenFork','two'],['fork','bridge'],['bridge','campLeft'],['campLeft','camp'],['camp','campRight'],['campRight','eastBend'],['eastBend','eastFork'],['eastFork','four'],['four','pondFork'],['pondFork','three'],['eastBend','five']];
export const STAGE_NODE={1:'one',2:'two',3:'three',4:'four',5:'five'};
export function routeBetween(from,to){
  if(!Object.hasOwn(MAP_NODES,from)||!Object.hasOwn(MAP_NODES,to))return [];
  const queue=[[from]],seen=new Set([from]);
  while(queue.length){const path=queue.shift(),node=path.at(-1);if(node===to)return path;for(const [a,b]of edges){const next=a===node?b:b===node?a:null;if(next&&!seen.has(next)){seen.add(next);queue.push([...path,next]);}}}
  return [];
}
export function createTrailMap(root,{position='entrance',onArrive,onMove}={}){
  const person=root.querySelector('.map-explorer'),mori=root.querySelector('.map-mori');
  const routeLayer=document.createElementNS('http://www.w3.org/2000/svg','svg');
  routeLayer.setAttribute('viewBox','0 0 100 100');routeLayer.setAttribute('preserveAspectRatio','none');routeLayer.setAttribute('aria-hidden','true');routeLayer.classList.add('world-path');
  const routeLine=document.createElementNS('http://www.w3.org/2000/svg','polyline');routeLayer.append(routeLine);root.insertBefore(routeLayer,person);
  let current=Object.hasOwn(STAGE_NODE,position)?STAGE_NODE[position]:Object.hasOwn(MAP_NODES,position)?position:'entrance';
  let frame=0,active=true,point=[...MAP_NODES[current]];
  function place([x,y],walking=false,dx=1){
    person.style.left=x+'%';person.style.top=y+'%';person.classList.toggle('walking',walking);person.classList.toggle('facing-left',dx<0);
    mori.style.left=(x-(dx<0?-3.7:3.7))+'%';mori.style.top=(y+1.6)+'%';mori.classList.toggle('walking',walking);mori.classList.toggle('facing-left',dx<0);
  }
  place(point);
  return {move(stage){
    const target=STAGE_NODE[stage];if(!target||!active)return;
    cancelAnimationFrame(frame);root.classList.add('travelling');onMove?.(stage);
    // Finish interrupted travel on its last reached waypoint, then take a valid trail.
    const path=routeBetween(current,target).map(n=>({id:n,point:MAP_NODES[n]}));
    routeLine.setAttribute('points',path.map(n=>n.point.join(',')).join(' '));
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce||path.length<2){current=target;point=[...MAP_NODES[target]];place(point);root.classList.remove('travelling');onArrive?.(stage);return;}
    let index=1,start=0,origin=[...point];
    const total=path.slice(1).reduce((n,v,i)=>n+Math.hypot(v.point[0]-path[i].point[0],v.point[1]-path[i].point[1]),0);
    const speed=Math.max(.028,total/2600);
    function tick(t){
      if(!active)return;if(!start)start=t;
      const dest=path[index],dx=dest.point[0]-origin[0],dy=dest.point[1]-origin[1],distance=Math.max(.01,Math.hypot(dx,dy));
      const progress=Math.min(1,(t-start)*speed/distance);
      point=[origin[0]+dx*progress,origin[1]+dy*progress];place(point,true,dx);
      if(progress===1){current=dest.id;origin=[...point];start=t;index++;if(index===path.length){place(point);root.classList.remove('travelling');onArrive?.(stage);return;}}
      frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
  },destroy(){active=false;cancelAnimationFrame(frame);routeLayer.remove();}};
}
