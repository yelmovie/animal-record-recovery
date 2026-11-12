import test from 'node:test';
import assert from 'node:assert/strict';
import {directionalAdvance,createDirectionalWalker,bindMapDirections,WALK_TAP_DISTANCE,availableDirections} from '../src/map-walk.js';
const graph={nodes:{a:[0,0],b:[100,0],c:[200,0],d:[200,100]},edges:[['a','b'],['b','c'],['c','d']]};
test('a tap takes a few steps; holding crosses nodes; release stops at the current position',()=>{
 const tap=createDirectionalWalker(graph,[0,0],'right');assert.deepEqual(tap.step(1000),{point:[WALK_TAP_DISTANCE,0],distance:WALK_TAP_DISTANCE,done:true});
 const hold=createDirectionalWalker(graph,[0,0],'right',{held:true});assert.deepEqual(hold.step(150).point,[150,0]);assert.equal(hold.done,false);hold.release();assert.equal(hold.done,true);assert.deepEqual(hold.step(30).point,[150,0]);
 const quick=createDirectionalWalker(graph,[0,0],'right',{held:true});quick.step(4);quick.release();assert.deepEqual(quick.step(100).point,[WALK_TAP_DISTANCE,0]);
});
test('partial walks reverse without snapping back and never leave a connected path',()=>{
 assert.deepEqual(directionalAdvance(graph,[64,0],'left',20).point,[44,0]);
 assert.deepEqual(directionalAdvance(graph,[64,0],'right',60).point,[124,0]);
 assert.deepEqual(directionalAdvance(graph,[64,0],'down',60).point,[64,0]);
 assert.deepEqual(directionalAdvance(graph,[180,0],'right',60).point,[200,0]);
 assert.deepEqual(directionalAdvance(graph,[200,0],'down',60).point,[200,60]);
});
function harness(){
 class Events{listeners=new Map();addEventListener(n,fn,options={}){const list=this.listeners.get(n)||[];list.push(fn);this.listeners.set(n,list);options?.signal?.addEventListener('abort',()=>this.removeEventListener(n,fn),{once:true});}removeEventListener(n,fn){this.listeners.set(n,(this.listeners.get(n)||[]).filter(f=>f!==fn));}emit(n,props={}){const e={key:'',code:'',detail:1,button:0,pointerId:1,preventDefault(){this.prevented=true;},stopPropagation(){},stopImmediatePropagation(){this.stopped=true;},...props};for(const fn of this.listeners.get(n)||[])fn(e);return e;}}
 const doc=new Events(),win=new Events(),page=new Events();doc.defaultView=win;page.ownerDocument=doc;doc.hidden=false;win.clearInterval=()=>{};
 const classes=new Set(),b={dataset:{id:'right'},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},setAttribute(){},toggleAttribute:(c,on)=>on?classes.add(c):classes.delete(c),setPointerCapture(){},closest:s=>s.includes('data-action')?b:null};page.contains=x=>x===b;page.querySelectorAll=()=>[b];doc.elementFromPoint=()=>b;
 const calls=[];let blocked=false;const ui=bindMapDirections(page,{walk:(...args)=>calls.push(['walk',...args]),release:()=>calls.push(['release']),stop:()=>calls.push(['stop']),blocked:()=>blocked});
 return {doc,win,page,b,calls,ui,classes,setBlocked:v=>blocked=v};
}
test('pointer hold starts once, release avoids duplicate clicks, and cancellation stops movement',()=>{
 const h=harness();h.page.emit('pointerdown',{target:h.b});assert.deepEqual(h.calls,[['walk','right',{held:true}]]);h.doc.emit('pointerup');assert.deepEqual(h.calls.at(-1),['release']);
 h.page.emit('click',{target:h.b});assert.equal(h.calls.length,2);assert.equal(h.classes.size,0);
 h.page.emit('pointerdown',{target:h.b});h.doc.emit('pointercancel');assert.deepEqual(h.calls.at(-1),['stop']);
 h.ui.destroy();const n=h.calls.length;h.page.emit('pointerdown',{target:h.b});assert.equal(h.calls.length,n);
});
test('key repeat never restarts movement; key release, blur and blocking remain safe',()=>{
 const h=harness();h.doc.emit('keydown',{key:'ArrowRight'});h.doc.emit('keydown',{key:'ArrowRight',repeat:true});assert.equal(h.calls.length,1);
 h.doc.emit('keyup',{key:'ArrowRight'});assert.deepEqual(h.calls.at(-1),['release']);
 h.doc.emit('keydown',{key:'w'});h.win.emit('blur');assert.deepEqual(h.calls.at(-1),['stop']);
 const n=h.calls.length;h.setBlocked(true);h.doc.emit('keydown',{key:'d'});h.page.emit('pointerdown',{target:h.b});assert.equal(h.calls.length,n);h.ui.destroy();
});

test('early turns approach the junction without teleporting or cutting corners',()=>{
 assert.deepEqual(directionalAdvance(graph,[170,0],'down',20).point,[190,0]);
 assert.deepEqual(directionalAdvance(graph,[190,0],'down',20).point,[200,10]);
 assert.deepEqual(directionalAdvance(graph,[140,0],'down',20).point,[140,0]);
 assert.ok(availableDirections(graph,[170,0]).includes('down'));
 assert.ok(!availableDirections(graph,[140,0]).includes('down'));
 const w=createDirectionalWalker(graph,[170,0],'down',{held:true});
 for(let i=0;i<10;i++)w.step(10);
 assert.deepEqual(w.step(0).point,[200,70]);
});
test('keyboard lights the actual arrow, not the focused arrow, and restores a held direction',()=>{
 const h=harness();h.ui.destroy();
 const pad=direction=>{const classes=new Set();const b={dataset:{id:direction},classes,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)},setAttribute(){},toggleAttribute:(c,on)=>on?classes.add(c):classes.delete(c),closest:s=>s.includes('data-action')?b:null};return b;};
 const left=pad('left'),right=pad('right');h.page.querySelectorAll=()=>[left,right];h.page.contains=b=>[left,right].includes(b);
 const ui=bindMapDirections(h.page,{walk:(...args)=>h.calls.push(['walk',...args]),release(){},stop(){}});
 h.doc.emit('keydown',{key:'ArrowRight',target:left});assert.ok(right.classes.has('data-map-held'));assert.equal(left.classes.size,0);
 h.doc.emit('keydown',{key:'ArrowLeft',target:left});assert.ok(left.classes.has('data-map-held'));assert.equal(right.classes.size,0);
 h.doc.emit('keyup',{key:'ArrowRight',target:left});assert.ok(left.classes.has('data-map-held'));
 h.doc.emit('keyup',{key:'ArrowLeft',target:left});assert.equal(left.classes.size,0);assert.equal(right.classes.size,0);
 h.page.emit('pointerdown',{target:right});h.doc.elementFromPoint=()=>left;h.doc.emit('pointermove',{clientX:0,clientY:0});assert.equal(h.calls.at(-1)[1],'left');assert.ok(left.classes.has('data-map-held'));
 h.doc.emit('pointerup');assert.equal(left.classes.size,0);ui.destroy();
});

test('leaving the direction pad stops immediately, then sliding back resumes once',()=>{
 const h=harness();h.page.emit('pointerdown',{target:h.b});h.doc.elementFromPoint=()=>null;h.doc.emit('pointermove');assert.deepEqual(h.calls.at(-1),['stop']);assert.equal(h.classes.size,0);
 h.doc.elementFromPoint=()=>h.b;h.doc.emit('pointermove');assert.deepEqual(h.calls.at(-1),['walk','right',{held:true}]);h.doc.emit('pointercancel');assert.deepEqual(h.calls.at(-1),['stop']);h.ui.destroy();
});
test('physical WASD keys work with Korean layout while input fields keep their keys',()=>{
 const h=harness();h.doc.emit('keydown',{key:'ㅈ',code:'KeyW'});assert.deepEqual(h.calls.at(-1),['walk','up',{held:true}]);h.doc.emit('keyup',{key:'ㅈ',code:'KeyW'});assert.deepEqual(h.calls.at(-1),['release']);
 const n=h.calls.length;h.doc.emit('keydown',{key:'ArrowRight',target:{closest:()=>({})}});assert.equal(h.calls.length,n);h.ui.destroy();
});

const village=JSON.parse((await import('node:fs')).readFileSync(new URL('../assets/village/village.json',import.meta.url),'utf8'));
const onRoad=p=>village.edges.some(([a,b])=>{const A=village.nodes[a],B=village.nodes[b],dx=B[0]-A[0],dy=B[1]-A[1],t=Math.max(0,Math.min(1,((p[0]-A[0])*dx+(p[1]-A[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-A[0]-t*dx,p[1]-A[1]-t*dy)<.001;});
function followRoad(start,direction,amount=4,frames=220){let p=[...start],travelled=0;const samples=[p];for(let i=0;i<frames;i++){const moved=directionalAdvance(village,p,direction,amount);assert.ok(moved.distance<=amount+.00001);assert.ok(onRoad(moved.point),'every step stays on a connected paved route');p=moved.point;travelled+=moved.distance;samples.push(p);}return {point:p,samples,travelled};}
test('bridge north end reaches the workshop on right hold using the lower paved route',()=>{
 assert.ok(availableDirections(village,village.nodes.bridge).includes('right'));
 const run=followRoad(village.nodes.bridge,'right');
 assert.deepEqual(run.point,village.nodes['workshop-door']);
 assert.ok(run.samples.some(([x,y])=>x>810&&x<840&&y<640),'first approach the junction north of the stone bridge');
 assert.ok(run.samples.some(([x,y])=>x>1000&&y>620),'use the lower bank, not the distant wooden bridge');
 assert.ok(run.samples.every(([,y])=>y>=620),'no detour through the plaza or upper bridge');
 for(let i=1;i<run.samples.length;i++)assert.ok(run.samples[i][0]>=run.samples[i-1][0]-.001,'holding right never walks backwards');
});
test('the workshop lower road reverses left through the central junction without a loop',()=>{
 const run=followRoad(village.nodes['workshop-door'],'left',4,200);
 assert.ok(run.point[0]<village.nodes.southJ[0]);
 assert.ok(run.samples.some(([x,y])=>x>810&&x<840&&y<640));
 for(let i=1;i<run.samples.length;i++)assert.ok(run.samples[i][0]<=run.samples[i-1][0]+.001,'holding left never walks backwards');
});
test('turn assistance starts at an exact node as well as between nodes',()=>{
 const bend={nodes:{a:[0,0],b:[0,-30],c:[100,-30]},edges:[['a','b'],['b','c']]};
 assert.deepEqual(directionalAdvance(bend,[0,0],'right',20).point,[0,-20]);
 assert.deepEqual(directionalAdvance(bend,[0,-20],'right',20).point,[10,-30]);
 assert.deepEqual(directionalAdvance(bend,[0,0],'right',70).point,[40,-30]);
});
test('bridge approach keeps distance budgets and the same path across frame sizes',()=>{
 const one=directionalAdvance(village,village.nodes.bridge,'right',200);
 const many=followRoad(village.nodes.bridge,'right',4,50);
 assert.ok(Math.hypot(one.point[0]-many.point[0],one.point[1]-many.point[1])<.001);
 assert.ok(Math.abs(one.distance-200)<.001);assert.ok(Math.abs(many.travelled-200)<.001);
 assert.ok(availableDirections(village,[805,720]).includes('right'));
});
