// Course shapes and movement for the relay stage. No three.js here, so node can test it.
// Walking skeleton after the three.js games_fps example: clamp a frame to 0.05 s, split it into 5 steps, gravity only
// in the air, jump only from the ground, and a fall returns to the last checkpoint. Every surface is a box or a flat
// lane, so box checks replace the example's octree.
// Sizes and speeds are diagram values tuned for small hands, not measured animal performance; every kind of movement
// uses a similar pace on purpose, and nothing is timed.
export const LANE=3,RADIUS=.45,WATER_Y=-.14;
const SPEED={jump:4.4,fly:3.8,swim:3.4,walk:3.2},GRAVITY=22,JUMP=8,RISE=3.4,SINK=-1.9,CEILING=5.4,FALL_LINE=-1.7;
export const JUMP_REACH=SPEED.jump*2*JUMP/GRAVITY;
// Rest pads (checkpoints) sit between the four sections; x runs to the right of the screen, z toward the viewer.
export const PADS=[[-4,2],[36,42],[76,82],[116,122],[156,162]];
// A row is a line of round obstacles across a lane with one open passage at z=pass.
const row=(x,pass,blocks,r)=>({x,pass,blocks,r});
export const TRACK={
 forest:{x0:2,x1:36,ground:[[2,9.5],[11.5,18],[20.2,27.5],[29.8,36]],steps:[{x0:23,x1:24.4,top:.75}],checkpoints:[12.4,21,30.6],
  pieces:[[10.5,1.5,0],[19.1,1.6,0],[23.7,2.1,0],[28.6,1.6,0],[33.4,1,0]]},
 pond:{x0:42,x1:76,lanes:{swim:[-LANE,LANE]},rows:[row(48,1.6,[-2.2,-.6],.8),row(54,-1.6,[.6,2.2],.8),row(60,0,[-2.3,2.3],.8),row(66,-1.8,[.2,1.8],.8),row(71.5,1.6,[-2.2,-.6],.8)],
  pieces:[[48,.5,1.6],[54,.5,-1.6],[60,.5,0],[66,.5,-1.8],[71.5,.5,1.6]]},
 // min/max: the heights left open at each barrier (a tall flower hedge below, or a branch above).
 sky:{x0:82,x1:116,floor:-1.3,barriers:[{x:89,min:2.4,max:9},{x:96.5,min:-9,max:1.9},{x:104,min:2.9,max:9},{x:110.5,min:-9,max:2.2}],
  pieces:[[85.5,1.6,0],[89,3.3,0],[96.5,.9,0],[104,3.8,0],[110.5,1.2,0]]},
 coast:{x0:122,x1:156,lanes:{walk:[-LANE,-.2],swim:[.2,LANE]},
  rows:[row(128,-2.2,[-.8],.6),row(134,-1,[-2.4],.6),row(140,-2.2,[-.8],.6),row(146,-1,[-2.4],.6),row(151.5,-2.2,[-.8],.6),
        row(128,1,[2.4],.6),row(134,2.2,[.8],.6),row(140,1,[2.4],.6),row(146,2.2,[.8],.6),row(151.5,1,[2.4],.6)],
  pieces:[[131,.6,-1.5],[137,.6,-1.5],[143,.6,-1.5],[131,.5,1.5],[137,.5,1.5],[143,.5,1.5]]},
};
export const ORDER=['forest','pond','sky','coast'];
// Painted art shipped in assets/relay (generated 2026-11-17, see docs/RUN-STAGE-3D-PLAN-20261117.md). The stage is complete without any of it.
export const RELAY_ART=['backdrop-forest','backdrop-pond','prop-arch','prop-bush','prop-oak','prop-pine','tile-grass','tile-hedge','tile-mud','tile-sand'];
export const blockersOf=id=>(TRACK[id].rows||[]).flatMap(g=>g.blocks.map(z=>({x:g.x,z,r:g.r})));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),inside=(x,[a,b])=>x>=a&&x<=b;
// Height of the surface under a point: pads and forest ground are 0, the rock ledge is higher, a gap has none.
export function groundTop(x){
 for(const s of TRACK.forest.steps)if(x>=s.x0&&x<=s.x1)return s.top;
 if(PADS.some(p=>inside(x,p))||TRACK.forest.ground.some(g=>inside(x,g)))return 0;
 return -Infinity;
}
// Where an animal starts a section, by its kind of movement (a swimmer starts in the water, never on the bank).
export function spawnPoint(id,kind){
 const t=TRACK[id],lane=t.lanes?.[kind];
 if(kind==='swim'||kind==='walk')return {x:t.x0+1.2,y:kind==='swim'?WATER_Y:0,z:lane?(lane[0]+lane[1])/2:0};
 return {x:t.x0-2.2,y:kind==='fly'?1.2:0,z:0};
}
export function createRunner(){return {x:-2,y:0,z:0,vx:0,vy:0,vz:0,ground:true,section:'forest',kind:'jump',spawn:{x:-2,y:0,z:0},falls:0,face:1,moving:false,acting:false,ended:false,pieces:[]};}
export function beginSection(r,id,kind){
 const p=spawnPoint(id,kind);Object.assign(r,p,{vx:0,vy:0,vz:0,ground:kind!=='fly',section:id,kind,spawn:{...p},falls:0,moving:false,acting:false,ended:false,pieces:[]});return r;
}
const approach=(v,target,amount)=>v+clamp(target-v,-amount,amount);
function planar(r,t,dt,input){
 const lane=t.lanes[r.kind],speed=SPEED[r.kind],grip=(r.kind==='swim'?9:18)*dt;
 r.vx=approach(r.vx,input.x*speed,grip);r.vz=approach(r.vz,input.z*speed,grip);
 let x=clamp(r.x+r.vx*dt,t.x0+RADIUS,t.x1),z=clamp(r.z+r.vz*dt,lane[0]+RADIUS,lane[1]-RADIUS);
 for(const b of blockersOf(r.section)){const dx=x-b.x,dz=z-b.z,d=Math.hypot(dx,dz),min=b.r+RADIUS;if(d<min){const k=min/(d||1);x=b.x+(d?dx:-1)*k;z=b.z+dz*k;}}
 r.x=clamp(x,t.x0+RADIUS,t.x1);r.z=clamp(z,lane[0]+RADIUS,lane[1]-RADIUS);r.y=r.kind==='swim'?WATER_Y:0;r.ground=true;
}
function jumping(r,dt,input){
 const grip=(r.ground?40:14)*dt;r.vx=approach(r.vx,input.x*SPEED.jump,grip);r.vz=approach(r.vz,input.z*SPEED.jump,grip);
 if(input.act&&r.ground){r.vy=JUMP;r.ground=false;}
 if(!r.ground)r.vy-=GRAVITY*dt;
 let x=clamp(r.x+r.vx*dt,PADS[0][0]+RADIUS,PADS[1][1]-RADIUS);const z=clamp(r.z+r.vz*dt,-LANE+RADIUS,LANE-RADIUS);
 // A side taller than a small step is a wall.
 if(groundTop(x)>r.y+.3){x=r.x;r.vx=0;}
 const top=groundTop(x),y=r.y+r.vy*dt;
 if(r.vy<=0&&y<=top&&r.y>=top-.02){r.y=top;r.vy=0;r.ground=true;}else{r.y=y;r.ground=false;}
 r.x=x;r.z=z;
 if(r.ground){const passed=TRACK.forest.checkpoints.filter(c=>c<=r.x).at(-1);if(passed!==undefined&&passed>r.spawn.x){r.spawn={x:passed,y:0,z:0};r.falls=0;}}
}
const blockedAt=(t,x,y)=>(t.barriers||[]).some(b=>Math.abs(x-b.x)<.9&&(y<=b.min||y>=b.max));
function flying(r,t,dt,input){
 const grip=20*dt,base=r.section==='sky'?t.floor:-.3;r.vx=approach(r.vx,input.x*SPEED.fly,grip);r.vz=approach(r.vz,input.z*SPEED.fly,grip);
 r.vy+=((input.act?RISE:SINK)-r.vy)*Math.min(1,6*dt);
 let x=clamp(r.x+r.vx*dt,t.x0-3.5,t.x1+5.5),y=r.y+r.vy*dt;const z=clamp(r.z+r.vz*dt,-LANE+RADIUS,LANE-RADIUS);
 if(blockedAt(t,x,y)){if(blockedAt(t,r.x,y)){y=r.y;r.vy=0;}else{x=r.x;r.vx=0;}}
 const floor=Math.max(groundTop(x),base)+.35;
 if(y<=floor){y=floor;r.vy=Math.max(0,r.vy);r.ground=true;}else r.ground=false;
 if(y>=CEILING){y=CEILING;r.vy=Math.min(0,r.vy);}
 r.x=x;r.y=y;r.z=z;
}
// One frame. input: {x,z} in -1..1 (x to the right, z toward the viewer) and act (button held).
// Returns what happened: fell (returned to the checkpoint), pieces picked up, end (section crossed).
export function stepRunner(r,frame,input){
 const out={fell:false,pieces:[],end:false};if(r.ended)return out;
 const t=TRACK[r.section],dt=Math.min(.05,Math.max(0,frame))/5,len=Math.hypot(input.x,input.z),move=len>1?{x:input.x/len,z:input.z/len,act:input.act}:input;
 for(let i=0;i<5;i++){
  if(r.kind==='jump')jumping(r,dt,move);else if(r.kind==='fly')flying(r,t,dt,move);else planar(r,t,dt,move);
  if(r.y<FALL_LINE){Object.assign(r,r.spawn,{vx:0,vy:0,vz:0,ground:true});r.falls++;out.fell=true;}
 }
 if(move.x)r.face=move.x>0?1:-1;r.moving=Math.hypot(r.vx,r.vz)>.4;r.acting=!!input.act;
 t.pieces.forEach((p,i)=>{if(!r.pieces.includes(i)&&Math.hypot(r.x-p[0],r.y+.6-p[1],r.z-p[2])<1.15){r.pieces.push(i);out.pieces.push(i);}});
 const line=r.kind==='jump'||r.kind==='fly'?t.x1+.7:t.x1-.6;
 if(r.x>=line&&(r.kind!=='jump'||r.ground)){r.ended=true;out.end=true;}
 return out;
}
