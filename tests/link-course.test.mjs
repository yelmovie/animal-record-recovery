import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LINKS} from '../src/expedition.js';
import {KEYS,LANES,ROWS,FINISH,START,RADIUS,OPEN,rowOptions,answerLane,laneOf,passedRows,createRunner,stepRunner} from '../src/link-course.js';

const FRAME=1/60;
// Walks to the given lane of each row in turn, the way a child would: line up, then go right.
function play(animal,pick=row=>answerLane(animal,row),seconds=40){
 const r=createRunner(),log=[];
 const choose=(row,lane)=>{const ok=lane===answerLane(animal,row);log.push({row,lane,ok});return ok;};
 for(let i=0;i<seconds*60&&!r.ended;i++){
  const lane=pick(r.passed,log),target=r.passed<KEYS.length?LANES[lane]:0,dz=target-r.z;
  const near=r.passed<ROWS.length&&ROWS[r.passed]-r.x<2.2;
  stepRunner(r,FRAME,{x:near&&Math.abs(dz)>.3?0:1,z:Math.abs(dz)>.08?Math.sign(dz):0},choose);
 }
 return {r,log};
}
test('every row offers the three existing cards for that slot, with the answer in a different lane each row',()=>{
 for(const animal of ['frog','crab']){
  const lanes=KEYS.map((key,row)=>{const options=rowOptions(animal,row);assert.deepEqual(options.map(o=>o.value).sort(),LINKS[animal][key].map(([v])=>v).sort());return answerLane(animal,row);});
  assert.equal(new Set(lanes).size,3,animal+' answers spread over all three lanes');
  for(const [row,lane] of lanes.entries())assert.equal(rowOptions(animal,row)[lane].value,LINKS[animal].answer[row]);
 }
});
test('walking through the right gates reaches the finish; each choice is asked once',()=>{
 for(const animal of ['frog','crab']){const {r,log}=play(animal);assert.ok(r.ended,animal+' finishes');assert.deepEqual(log.map(x=>x.ok),[true,true,true]);assert.ok(r.x>=FINISH);}
});
test('a wrong gate is shut and steps the animal back; the next try can choose again',()=>{
 const {r,log}=play('frog',(row,log)=>log.some(x=>x.row===row&&!x.ok)?answerLane('frog',row):(answerLane('frog',row)+1)%3,60);
 assert.equal(log[0].ok,false);assert.ok(log.some(x=>x.row===0&&x.ok));assert.ok(r.ended);
 const shut=createRunner();let asked=0;Object.assign(shut,{x:ROWS[0]-1,z:LANES[(answerLane('frog',0)+1)%3]});
 for(let i=0;i<60;i++)stepRunner(shut,FRAME,{x:1,z:0},()=>{asked++;return false;});
 assert.ok(asked>=1&&shut.x<ROWS[0],'still before the row');assert.equal(shut.passed,0);
});
test('the hedge between gates blocks, and a passed row cannot be crossed back',()=>{
 const r=createRunner();Object.assign(r,{x:ROWS[0]-1,z:(LANES[0]+LANES[1])/2});let asked=0;
 for(let i=0;i<120;i++)stepRunner(r,FRAME,{x:1,z:0},()=>{asked++;return true;});
 assert.equal(asked,0);assert.ok(r.x<=ROWS[0]-RADIUS+1e-9);
 assert.equal(laneOf(LANES[2]+OPEN-RADIUS-.01),2);assert.equal(laneOf((LANES[1]+LANES[2])/2),-1);
 const after=createRunner(1);assert.ok(after.x>ROWS[0]);for(let i=0;i<200;i++)stepRunner(after,FRAME,{x:-1,z:0},()=>true);assert.ok(after.x>ROWS[0],'no way back');
});
test('a slow frame cannot skip a row',()=>{
 const r=createRunner();for(let i=0;i<40;i++)stepRunner(r,1,{x:1,z:0},()=>true);assert.ok(r.passed<=1);
 const blocked=createRunner();Object.assign(blocked,{z:(LANES[0]+LANES[1])/2});for(let i=0;i<40;i++)stepRunner(blocked,1,{x:1,z:0},()=>true);assert.equal(blocked.passed,0);assert.ok(blocked.x<ROWS[0]);
});
test('answers already recorded put the animal after those rows',()=>{
 assert.equal(passedRows('frog',{}),0);assert.equal(passedRows('frog',{environment:'pond'}),1);assert.equal(passedRows('frog',{environment:'pond',body:'fin'}),1);
 assert.equal(passedRows('crab',{environment:'coast',body:'legs',life:'walk'}),3);assert.ok(createRunner(3).ended);assert.equal(createRunner(0).x,START);
});
test('a choice that updates the runner itself (a re-render inside the step) still counts the row once',()=>{
 const r=createRunner();Object.assign(r,{x:ROWS[0]-.6,z:LANES[answerLane('frog',0)]});
 for(let i=0;i<30&&!r.passed;i++)stepRunner(r,FRAME,{x:1,z:0},row=>{r.passed=Math.max(r.passed,row+1);return true;});
 assert.equal(r.passed,1);
});
