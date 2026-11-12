import {bindDirectionPad,mapKeyDirection} from './map-controls.js';
// Manual walking follows connected paths; a tap takes a few steps, a hold keeps walking.
const vectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
export const WALK_TAP_DISTANCE=48;
export const WALK_TURN_DISTANCE=48;
function nearbyTurn(graph,point,vector,node,segment){
 const limit=graph.turnDistance??WALK_TURN_DISTANCE,queue=[],seen=new Map();
 if(node)queue.push({id:node[0],distance:0,first:null,previous:null});
 else for(const id of [segment.a,segment.b])queue.push({id,distance:Math.hypot(graph.nodes[id][0]-point[0],graph.nodes[id][1]-point[1]),first:graph.nodes[id],previous:id===segment.a?segment.b:segment.a});
 while(queue.length){
  queue.sort((a,b)=>a.distance-b.distance);const current=queue.shift();if(current.distance>limit+.000001||current.distance>=(seen.get(current.id)??Infinity)||(current.first&&((current.first[0]-point[0])*vector[0]+(current.first[1]-point[1])*vector[1]<-.001)))continue;seen.set(current.id,current.distance);
  const origin=graph.nodes[current.id],exits=graph.edges.flatMap(([a,b])=>a===current.id?[b]:b===current.id?[a]:[]).filter(id=>id!==current.previous);
  if(current.first&&exits.some(id=>{const q=graph.nodes[id],dx=q[0]-origin[0],dy=q[1]-origin[1];return (dx*vector[0]+dy*vector[1])/(Math.hypot(dx,dy)||1)>.55;}))return current.first;
  for(const id of exits){const q=graph.nodes[id],distance=current.distance+Math.hypot(q[0]-origin[0],q[1]-origin[1]);if(distance<=limit+.000001&&(q[0]-origin[0])*vector[0]+(q[1]-origin[1])*vector[1]>=-.001)queue.push({id,distance,first:current.first||q,previous:current.id});}
 }
 return null;
}
export function directionalAdvance(graph,point,direction,distance){
 const vector=vectors[direction];let p=[...point],left=Math.max(0,distance),travelled=0;
 if(!vector)return {point:p,distance:0};
 for(let guard=0;left>1e-6&&guard<graph.edges.length*2+1;guard++){
  const node=Object.entries(graph.nodes).find(([,q])=>Math.hypot(q[0]-p[0],q[1]-p[1])<.001);
  let candidates=[],segment=null;
  if(node)candidates=graph.edges.flatMap(([a,b])=>a===node[0]?[graph.nodes[b]]:b===node[0]?[graph.nodes[a]]:[]);
  else{
   // A stopped walk may be anywhere on a segment. Continue from that point, never snap back to a node.
   let nearest=null;
   for(const [a,b]of graph.edges){const A=graph.nodes[a],B=graph.nodes[b];if(!A||!B)continue;
    const dx=B[0]-A[0],dy=B[1]-A[1],length=dx*dx+dy*dy;if(!length)continue;
    const t=Math.max(0,Math.min(1,((p[0]-A[0])*dx+(p[1]-A[1])*dy)/length)),q=[A[0]+t*dx,A[1]+t*dy],gap=Math.hypot(q[0]-p[0],q[1]-p[1]);
    if(!nearest||gap<nearest.gap)nearest={a,b,A,B,gap};
   }
   if(nearest?.gap<.01){candidates=[nearest.A,nearest.B];segment=nearest;}
  }
  let target=null,score=.3;
  for(const q of candidates){if(!q)continue;const dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy);if(length<1e-6)continue;
   const s=(dx*vector[0]+dy*vector[1])/length;if(s>score){score=s;target=q;}}
  // Approach only a nearby connected turn, including when standing exactly on a node.
  // The approach consumes the same distance budget as ordinary walking.
  if(!target&&(node||segment))target=nearbyTurn(graph,p,vector,node,segment);
  if(!target)break;
  const dx=target[0]-p[0],dy=target[1]-p[1],length=Math.hypot(dx,dy),step=Math.min(left,length);
  p=step===length?[...target]:[p[0]+dx/length*step,p[1]+dy/length*step];left-=step;travelled+=step;
 }
 return {point:p,distance:travelled};
}
export function createDirectionalWalker(graph,point,direction,{held=false}={}){
 let position=[...point],remaining=WALK_TAP_DISTANCE,holding=held,done=false;
 return {release(){holding=false;if(remaining<=0)done=true;},
  step(distance){if(done)return {point:[...position],distance:0,done:true};
   const moved=directionalAdvance(graph,position,direction,holding?distance:Math.min(distance,remaining));
   position=moved.point;remaining=Math.max(0,remaining-moved.distance);done=moved.distance<1e-6||(!holding&&remaining<=0);
   return {...moved,done};
  },get done(){return done;}};
}
export const availableDirections=(graph,point)=>Object.keys(vectors).filter(direction=>directionalAdvance(graph,point,direction,1).distance>0);
export function bindMapDirections(page,{walk,release,stop,blocked=()=>false}){
 const doc=page.ownerDocument,win=doc.defaultView,abort=new AbortController(),{signal}=abort,keys=new Map();let activeKey=null,pointerActive=false;
 const pad=bindDirectionPad(page,'[data-action="map-walk"]',b=>b.dataset.id,{signal,blocked,
  press:dir=>{pointerActive=true;keys.clear();activeKey=null;walk(dir,{held:true});},
  release:(_dir,{cancelled=false}={})=>{pointerActive=false;if(cancelled)stop();else release();},tap:dir=>walk(dir)});
 function cancel(){pad.clear();keys.clear();activeKey=null;stop();}
 doc.addEventListener('keydown',e=>{
  if(blocked()||pointerActive||e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;
  const direction=mapKeyDirection(e),key=e.code||e.key;if(!direction)return;e.preventDefault();if(e.repeat||keys.has(key))return;
  keys.set(key,direction);activeKey=key;walk(direction,{held:true});
 },{signal});
 doc.addEventListener('keyup',e=>{const key=e.code||e.key;if(!keys.delete(key))return;e.preventDefault();if(key!==activeKey)return;activeKey=[...keys.keys()].at(-1)||null;if(activeKey)walk(keys.get(activeKey),{held:true});else release();},{signal});
 win.addEventListener('blur',cancel,{signal});doc.addEventListener('visibilitychange',cancel,{signal});
 return {cancel,destroy(){cancel();abort.abort();}};
}
