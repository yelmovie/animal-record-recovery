import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/adventure-app.js',import.meta.url),'utf8');
const starSource=source.slice(source.indexOf('function flyStar(){'),source.indexOf('function previous(){'));
function feedbackHarness(reduced=false,hiddenProgress=false){
 const sounds=[],nodes=[],animations=[],timers=new Map();let next=0;
 const make=()=>{const classes=new Set();return {isConnected:true,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},children:[],setAttribute(){},append(el){this.children.push(el);},remove(){this.isConnected=false;},getBoundingClientRect(){return {left:0,top:0,width:100,height:48};},animate(){const animation={cancelled:false,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}};};
 const chip=make(),context=vm.createContext({document:{createElement(){const n=make();nodes.push(n);return n;},querySelector(selector){return hiddenProgress&&selector==='.guide-progress'?{getBoundingClientRect:()=>({width:0})}:chip;},body:{append(){}}},matchMedia:()=>({matches:reduced}),icon:()=>'',s:{soundEnabled:true},stage:1,STAGES:[{tasks:Array(8)}],countStage:()=>1,playSound:(...a)=>sounds.push(a),setTimeout:fn=>{const id=++next;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),innerWidth:1280,innerHeight:800});
 vm.runInContext('let clearStar=null;'+starSource,context);
 return {sounds,nodes,animations,timers,chip,run:c=>vm.runInContext(c,context)};
}
test('leaving during a star flight cancels animation, DOM and late reward sound',()=>{
 const h=feedbackHarness();h.run('flyStar()');assert.equal(h.nodes.filter(n=>n.isConnected).length,1);
 h.run('clearStar()');assert.ok(h.animations[0].cancelled);h.animations[0].onfinish();
 assert.equal(h.nodes.filter(n=>n.isConnected).length,0);assert.equal(h.sounds.length,0);assert.equal(h.timers.size,0);
});
test('repeated rewards replace the previous flight; a landed reward cleans up completely',()=>{
 const h=feedbackHarness();h.run('flyStar();flyStar()');assert.ok(h.animations[0].cancelled);assert.equal(h.nodes.filter(n=>n.isConnected).length,1);
 h.animations[1].onfinish();h.animations[1].onfinish();assert.equal(h.sounds.length,1);assert.equal(h.chip.children.length,1);
 h.run('clearStar()');assert.equal(h.nodes.filter(n=>n.isConnected).length,0);assert.equal(h.timers.size,0);assert.ok(h.animations.at(-1).cancelled);
});
test('reduced motion gives immediate progress feedback without a flying overlay or pulse',()=>{
 const h=feedbackHarness(true);h.run('flyStar()');assert.equal(h.animations.length,0);assert.equal(h.sounds.length,1);assert.equal(h.chip.children[0].textContent,' ★ 1/8 · +1');assert.equal(h.nodes[0].isConnected,false);
 h.run('clearStar()');assert.equal(h.timers.size,0);
});

test('a hidden activity picker sends the earned-star count to the visible heading instead',()=>{
 const h=feedbackHarness(false,true);h.run('flyStar()');assert.equal(h.animations.length,1);h.animations[0].onfinish();assert.equal(h.chip.children[0].textContent,' ★ 1/8 · +1');
 h.run('clearStar()');assert.equal(h.nodes.filter(n=>n.isConnected).length,0);
});
