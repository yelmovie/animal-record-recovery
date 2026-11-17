// Stage 3 「개구리의 생활」·「게의 생활」 as a 3D path: the animal walks through one of three gates in each of three rows
// (사는 곳 → 몸의 특징 → 움직이는 방법). The options are the existing LINKS cards and the answer is checked by the
// existing rule (taskReady / taskMistake); this file only lays out the path and moves the animal. No three.js here.
// Sizes and speeds are diagram values for small hands, not measured animal performance.
import {LINKS} from './expedition.js';

export const KEYS=['environment','body','life'],KEY_NAMES=['사는 곳','몸의 특징','움직이는 방법'];
// The path runs to the right of the screen (x); the three lanes are side by side across it (z, far to near).
export const LANES=[-2.4,0,2.4],HALF=3.6,RADIUS=.45,OPEN=1.05,START=-2.5,ROWS=[8,19,30],FINISH=38;
const SPEED=3.4;
// Each animal's answer sits in a different lane in each row, so the right gate is never the same place twice.
const ROTATE={frog:[1,0,2],crab:[2,1,0]};
export function rowOptions(animal,row){
 const list=LINKS[animal]?.[KEYS[row]]||[],k=ROTATE[animal]?.[row]||0;
 return [...list.slice(k),...list.slice(0,k)].map(([value,label])=>({value,label}));
}
export const answerLane=(animal,row)=>rowOptions(animal,row).findIndex(o=>o.value===LINKS[animal].answer[row]);
// Which lane's gate a point is in; -1 between gates (that part of the row is a hedge or a fence).
export const laneOf=z=>LANES.findIndex(c=>Math.abs(z-c)<=OPEN-RADIUS);
// Rows already answered correctly, in order: the animal starts after the last of them.
export function passedRows(animal,links={}){let n=0;while(n<KEYS.length&&links[KEYS[n]]===LINKS[animal]?.answer[n])n++;return n;}
export function createRunner(passed=0){const x=passed?ROWS[passed-1]+1.6:START;return {x,z:0,vx:0,vz:0,face:1,moving:false,passed,ended:passed>=KEYS.length,back:x};}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),approach=(v,t,a)=>v+clamp(t-v,-a,a);
// One frame. input: {x,z} in -1..1 (x to the right, z toward the viewer).
// choose(row,lane) is asked when the animal walks into an unanswered gate and returns true for the right gate.
// Returns what happened: chose ([{row,lane,ok}]) and end (the finish line was reached).
export function stepRunner(r,frame,input,choose){
 const out={chose:[],end:false};if(r.ended)return out;
 const dt=Math.min(.05,Math.max(0,frame))/5,len=Math.hypot(input.x,input.z),ix=len>1?input.x/len:input.x,iz=len>1?input.z/len:input.z;
 for(let i=0;i<5&&!r.ended;i++){
  r.vx=approach(r.vx,ix*SPEED,18*dt);r.vz=approach(r.vz,iz*SPEED,18*dt);
  let x=r.x+r.vx*dt;const z=clamp(r.z+r.vz*dt,-HALF+RADIUS,HALF-RADIUS);
  // No going back through a row already passed; the path ends a little after the finish.
  x=clamp(x,r.back,FINISH+.5);
  const row=r.passed<ROWS.length?ROWS[r.passed]:null;
  if(row!==null&&r.x+RADIUS<=row&&x+RADIUS>row){
   const lane=laneOf(z);
   if(lane<0){x=row-RADIUS;r.vx=0;}
   else{const index=r.passed,ok=!!choose(index,lane);out.chose.push({row:index,lane,ok});
    // A wrong gate is shut: the animal steps back to think again. The right one stays open.
    // (choose may already have moved the runner on through a re-render, so this only ever moves forward.)
    if(ok){r.passed=Math.max(r.passed,index+1);r.back=Math.max(r.back,row+.6);}else{x=row-2.2;r.vx=0;}}
  }
  r.x=x;r.z=z;
  if(r.passed>=KEYS.length&&r.x>=FINISH){r.ended=true;out.end=true;}
 }
 if(ix)r.face=ix>0?1:-1;r.moving=Math.hypot(r.vx,r.vz)>.4;
 return out;
}
// Painted art shipped in assets/relay (generated 2026-11-17). The path is complete without any of it.
export const RUN_ART=['backdrop-coast','backdrop-forest','backdrop-pond','prop-arch','prop-boulder','prop-bush','prop-kelp','prop-oak','prop-pine','prop-searock','tile-grass','tile-hedge','tile-mud','tile-sand'];
