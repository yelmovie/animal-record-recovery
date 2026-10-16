import { STAGES } from './model.js';
// Low-resolution orthographic scene: only the hub uses the pixel-art world.
export function createHub(canvas, onArrive){
 const ctx=canvas.getContext('2d'); canvas.width=640;canvas.height=380;
 const landscape=document.createElement('canvas');landscape.width=640;landscape.height=380;
 const c=landscape.getContext('2d');let seed=73;
 const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const polygon=(pts,color)=>{c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 rect(0,0,640,380,'#608653');
 for(let i=0;i<2600;i++){const x=random()*640,y=random()*380;rect(x,y,random()>0.6?4:2,2,random()>.5?'#70935a':'#567c4c');}
 // A gently winding river with pixel edges and small reflections.
 for(let y=0;y<380;y+=4){const x=306+Math.sin(y/75)*23;rect(x-18,y,65,4,'#3b7068');rect(x-12,y,53,4,'#659c99');rect(x-5,y,37,4,'#82b8ae');if(y%16===0)rect(x+5,y,14,2,'#b4d0b8');}
 // Sandy footpaths connect every destination through the research clearing.
 c.lineJoin='round';c.lineCap='round';
 const routes=[[[70,330],[135,258],[155,178],[142,126]],[[155,178],[230,161],[282,88]],[[230,161],[359,168],[447,132]],[[359,168],[409,208],[435,258]],[[135,258],[218,270],[288,270],[359,168]]];
 for(const route of routes){c.beginPath();route.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle='#486744';c.lineWidth=22;c.stroke();c.strokeStyle='#c5b68b';c.lineWidth=16;c.stroke();c.strokeStyle='#ddcc9f';c.lineWidth=10;c.stroke();}
 // Timber bridge.
 rect(307,154,63,25,'#684b32');for(let x=310;x<368;x+=7)rect(x,154,5,25,'#b89a65');rect(305,153,67,3,'#e0bc81');rect(305,177,67,3,'#715234');
 const tree=(x,y,size=1)=>{c.save();c.translate(Math.floor(x),Math.floor(y));c.scale(size,size);rect(-12,0,26,7,'#496d43');rect(-2,-13,5,18,'#725734');polygon([[-17,-12],[-12,-25],[-8,-25],[-5,-34],[7,-34],[12,-24],[17,-24],[20,-12],[11,-7],[-9,-7]],'#345d42');polygon([[-15,-17],[-10,-27],[-3,-35],[6,-35],[12,-26],[15,-17],[4,-12]],'#4b7850');rect(-5,-30,9,4,'#77924f');rect(4,-20,7,4,'#678b4b');c.restore();};
 for(let i=0;i<125;i++){const x=random()*640,y=random()*380;const near=STAGES.some(s=>Math.hypot(x-s.x*6.4,y-s.y*3.8)<65);const center=x>100&&x<490&&y>75&&y<305;if(!near&&(!center||random()<.10)&&!(x>280&&x<374))tree(x,y,.7+random()*.65);}
 const house=(x,y,color,kind)=>{
  rect(x-28,y+8,63,10,'#436440');rect(x-27,y-21,54,33,'#d5cda3');rect(x+18,y-21,9,33,'#a99c76');rect(x-22,y-17,4,28,'#806d48');rect(x+13,y-17,4,28,'#806d48');
  polygon([[x-34,y-23],[x,y-45],[x+34,y-23],[x+34,y-17],[x-34,y-17]],'#324d3b');polygon([[x-32,y-25],[x,y-46],[x+32,y-25]],color);
  rect(x-7,y-9,14,21,'#675a41');rect(x-5,y-7,10,18,'#877951');rect(x-19,y-13,9,9,'#89b9b0');rect(x+10,y-13,9,9,'#89b9b0');rect(x-21,y+12,43,4,'#b0a078');
  if(kind===2){rect(x-26,y+21,15,8,'#94734a');rect(x+12,y+21,15,8,'#94734a');for(let j=0;j<4;j++){rect(x-25+j*4,y+17,3,5,'#d9d18e');rect(x+13+j*4,y+17,3,5,'#e2b081');}}
  if(kind===3){rect(x+23,y-39,8,18,'#788779');rect(x+24,y-42,6,3,'#a9b9a4');}
 };
 for(const s of STAGES){const x=s.x*6.4,y=s.y*3.8;house(x,y-8,['','#7d975b','#a79659','#669d90','#807d96','#b68561'][s.id],s.id);}
 // Shore rocks, flowers and signposts.
 for(let i=0;i<38;i++){const x=random()*640,y=random()*380;if(x>285&&x<380)continue;rect(x,y,3,4,'#486f46');rect(x-1,y-2,5,3,i%3===0?'#e4ce8d':'#a0b76b');}
 rect(68,312,3,17,'#705a3c');rect(59,310,25,9,'#e3cc94');rect(63,313,14,2,'#8c774d');
 let player={x:70,y:329}, destination=null,points=[], frame, last=0,active=true;
 function paint(t){if(!active)return;const dt=Math.min((t-last)||16,40);last=t;ctx.clearRect(0,0,640,380);ctx.drawImage(landscape,0,0);
  if(points.length){const p=points[0],dx=p.x-player.x,dy=p.y-player.y,d=Math.hypot(dx,dy),v=dt*.17;if(d<v){player={...p};points.shift();if(!points.length&&destination){onArrive(destination);destination=null;}}else{player.x+=dx/d*v;player.y+=dy/d*v;}}
  const x=Math.round(player.x),y=Math.round(player.y),bob=points.length?Math.round(Math.sin(t/85)):0;
  const r=(dx,dy,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x+dx,y+dy+bob,w,h);};
  r(-6,3,13,3,'#375b3c');r(-4,-2,3,6,'#513e2c');r(2,-2,3,6,'#513e2c');r(-5,-11,11,11,'#d5b579');r(-7,-10,3,7,'#94724d');r(5,-10,3,7,'#94724d');r(-5,-20,11,10,'#b2a187');r(-7,-20,4,4,'#695c49');r(4,-20,4,4,'#695c49');r(-5,-16,11,4,'#534d42');r(-3,-16,2,2,'#f6edd3');r(2,-16,2,2,'#f6edd3');r(-3,-12,7,3,'#ddd3b9');r(-8,-22,17,3,'#d4bd80');r(-4,-26,9,5,'#d4bd80');r(1,-25,3,3,'#627e46');
  frame=points.length?requestAnimationFrame(paint):null;
 }
 frame=requestAnimationFrame(paint);
 return {move(id){const s=STAGES[id-1];destination=id;const target={x:s.x*6.4,y:s.y*3.8+18};if(matchMedia('(prefers-reduced-motion: reduce)').matches){player=target;points=[];destination=null;onArrive(id);cancelAnimationFrame(frame);paint(performance.now());return;}points=[target];if(!frame){last=performance.now();frame=requestAnimationFrame(paint);}},destroy(){active=false;cancelAnimationFrame(frame);}};
}
