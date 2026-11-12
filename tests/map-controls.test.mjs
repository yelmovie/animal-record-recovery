import test from 'node:test';
import assert from 'node:assert/strict';
import {bindDirectionPad,assistMapStep,stepAlongRoad,mapKeyDirection} from '../src/map-controls.js';

function harness(){
 class Events{listeners=new Map();addEventListener(type,fn){this.listeners.set(type,[...(this.listeners.get(type)||[]),fn]);}removeEventListener(type,fn){this.listeners.set(type,(this.listeners.get(type)||[]).filter(f=>f!==fn));}emit(type,props={}){const event={key:'',code:'',button:0,detail:1,pointerId:1,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){},...props};for(const fn of this.listeners.get(type)||[])fn(event);}}
 const doc=new Events(),win=new Events(),root=new Events();doc.defaultView=win;root.ownerDocument=doc;
 const buttons=['up','left','down','right'].map(direction=>{const classes=new Set();const b={direction,classes,setAttribute(){},toggleAttribute(c,on){on?classes.add(c):classes.delete(c);},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},closest:s=>s==='button'?b:null};return b;});
 root.querySelectorAll=()=>buttons;root.contains=b=>buttons.includes(b);doc.elementFromPoint=()=>buttons[3];
 let blocked=false;const calls=[],pad=bindDirectionPad(root,'button',b=>b.direction,{blocked:()=>blocked,press:d=>calls.push(['press',d]),release:(d,meta)=>calls.push(['release',d,meta]),tap:d=>calls.push(['tap',d])});
 return {doc,win,root,buttons,calls,pad,block:()=>blocked=true};
}
test('touch release preserves feedback for the keyboard key still held',()=>{
 const h=harness();h.doc.emit('keydown',{code:'ArrowLeft'});h.root.emit('pointerdown',{target:h.buttons[3]});
 assert.ok(h.buttons[3].classes.has('data-map-held'));h.doc.emit('pointerup');
 assert.ok(h.buttons[1].classes.has('data-map-held'));assert.equal(h.buttons[3].classes.size,0);
 h.doc.emit('keyup',{code:'ArrowLeft'});assert.equal(h.buttons[1].classes.size,0);h.pad.destroy();
});
test('sliding off the pad cancels a short step, re-entering starts exactly once',()=>{
 const h=harness();h.root.emit('pointerdown',{target:h.buttons[3]});h.doc.elementFromPoint=()=>null;h.doc.emit('pointermove');
 assert.deepEqual(h.calls.at(-1),['release','right',{cancelled:true}]);h.doc.elementFromPoint=()=>h.buttons[0];h.doc.emit('pointermove');h.doc.emit('pointermove');
 assert.deepEqual(h.calls.filter(c=>c[0]==='press'),[['press','right'],['press','up']]);h.pad.destroy();
});
test('foreign pointers cannot release the active finger and synthetic click does not double-step',()=>{
 const h=harness();h.root.emit('pointerdown',{target:h.buttons[3]});h.doc.emit('pointerup',{pointerId:2});assert.equal(h.calls.length,1);
 h.doc.emit('pointercancel');assert.deepEqual(h.calls.at(-1),['release','right',{cancelled:true}]);h.root.emit('click',{target:h.buttons[3]});assert.equal(h.calls.length,2);
 h.root.emit('click',{target:h.buttons[3],detail:0});assert.deepEqual(h.calls.at(-1),['tap','right']);h.pad.destroy();
});
test('blur cancels movement and destroy removes all listeners',()=>{
 const h=harness();h.root.emit('pointerdown',{target:h.buttons[3]});h.win.emit('blur');assert.deepEqual(h.calls.at(-1),['release','right',{cancelled:true}]);h.pad.destroy();
 const count=h.calls.length;h.root.emit('pointerdown',{target:h.buttons[3]});h.doc.emit('keydown',{code:'ArrowLeft'});assert.equal(h.calls.length,count);assert.ok(h.buttons.every(b=>b.classes.size===0));
});
test('blocked and composing input never lights a direction',()=>{
 const h=harness();h.doc.emit('keydown',{code:'KeyW',isComposing:true});assert.ok(h.buttons.every(b=>b.classes.size===0));h.block();h.doc.emit('keydown',{code:'ArrowLeft'});h.root.emit('pointerdown',{target:h.buttons[3]});assert.equal(h.calls.length,0);assert.ok(h.buttons.every(b=>b.classes.size===0));h.pad.destroy();
 assert.equal(mapKeyDirection({key:'ㅈ',code:'KeyW'}),'up');
});
test('road assistance remains bounded and never cuts across an obstacle',()=>{
 const stand=p=>p.x>=0&&p.x<=100&&Math.abs(p.y)<=3;
 const p=assistMapStep({x:0,y:0},{x:20,y:4},stand);assert.ok(stand(p));assert.ok(Math.hypot(p.x,p.y)<=Math.hypot(20,4)+.001);assert.ok(p.x>15);
 const stopped=assistMapStep({x:98,y:0},{x:20,y:0},stand);assert.ok(stand(stopped));
});
test('early turns consume distance along connected roads only',()=>{
 const edges=[[{x:0,y:0},{x:100,y:0}],[{x:100,y:0},{x:100,y:100}]];
 assert.deepEqual(stepAlongRoad({x:80,y:0},{x:0,y:1},30,edges),{x:100,y:10});
 assert.deepEqual(stepAlongRoad({x:40,y:0},{x:0,y:1},30,edges),{x:40,y:0});
});
