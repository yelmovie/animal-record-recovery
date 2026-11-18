import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACK,ORDER,PADS,LANE,RADIUS,WATER_Y,JUMP_REACH,groundTop,spawnPoint,blockersOf,createRunner,beginSection,stepRunner} from '../src/relay-course.js';
import {RELAY_SECTIONS} from '../src/relay.js';

const FRAME=1/60;
// Plays a section the way a child would: keep going right and use the one thing each kind of movement offers.
function play(id,kind,seconds=60){
 const r=beginSection(createRunner(),id,kind),t=TRACK[id];let fell=0,pieces=0;
 for(let i=0;i<seconds*60;i++){
  const input={x:1,z:0,act:false};
  if(kind==='jump'){const ahead=groundTop(r.x+.75);input.act=r.ground&&(ahead===-Infinity||ahead>r.y+.3);}
  if(kind==='fly'){const next=(t.barriers||[]).find(b=>b.x>r.x-.9),want=next?(next.min>-5?next.min+.8:next.max-.9):1.5;input.act=r.y<want;if(next&&Math.abs(r.y-want)>.5&&next.x-r.x<1.6)input.x=0;}
  if(kind==='swim'||kind==='walk'){const lane=t.lanes[kind],gate=t.rows.find(g=>g.x>r.x-.6&&g.pass>=lane[0]&&g.pass<=lane[1]);if(gate){const dz=gate.pass-r.z;input.z=Math.abs(dz)>.15?Math.sign(dz):0;if(Math.abs(dz)>.7&&gate.x-r.x<1.8)input.x=0;}}
  const out=stepRunner(r,FRAME,input);fell+=out.fell?1:0;pieces+=out.pieces.length;
  if(out.end)return {ok:true,time:i/60,fell,pieces,r};
 }
 return {ok:false,fell,pieces,r};
}
test('course sections match the relay sections and every kind a section allows can cross it',()=>{
 assert.deepEqual(ORDER,RELAY_SECTIONS.map(x=>x.id));
 for(const section of RELAY_SECTIONS)for(const kind of section.kinds){const run=play(section.id,kind);assert.ok(run.ok,`${section.id} by ${kind} reaches the end`);assert.equal(run.fell,0,`${section.id} by ${kind} without a fall`);assert.ok(run.pieces>=3,`${section.id} by ${kind} passes record pieces`);}
});
test('sections join through rest pads and never overlap',()=>{
 ORDER.forEach((id,i)=>{assert.equal(TRACK[id].x0,PADS[i][1]);assert.equal(TRACK[id].x1,PADS[i+1][0]);});
 assert.equal(groundTop(0),0);assert.equal(groundTop(10.5),-Infinity,'a stream gap has no ground');assert.equal(groundTop(23.5),.75);
});
test('every gap is well inside one jump and every obstacle row leaves a passage',()=>{
 const g=TRACK.forest.ground;for(let i=1;i<g.length;i++)assert.ok(g[i][0]-g[i-1][1]<=JUMP_REACH-.7,'gap '+i+' leaves room for a late or early jump');
 for(const id of ['pond','coast'])for(const gate of TRACK[id].rows){const lane=Object.values(TRACK[id].lanes).find(l=>gate.pass>=l[0]&&gate.pass<=l[1]);assert.ok(lane);
  assert.ok(gate.pass-RADIUS>=lane[0]-1e-9&&gate.pass+RADIUS<=lane[1]+1e-9,'passage is inside its lane');
  for(const z of gate.blocks)assert.ok(Math.abs(z-gate.pass)>=gate.r+RADIUS+.15,`row at ${gate.x} keeps its passage open`);}
 assert.equal(blockersOf('pond').length,10);assert.equal(blockersOf('forest').length,0);
});
test('a fall returns to the last checkpoint and a jump starts only from the ground',()=>{
 const r=beginSection(createRunner(),'forest','jump');let fell=false;
 for(let i=0;i<600&&!fell;i++)fell=stepRunner(r,FRAME,{x:1,z:0,act:false}).fell;
 assert.ok(fell,'walking into the first gap falls');assert.equal(r.falls,1);assert.ok(Math.abs(r.x-spawnPoint('forest','jump').x)<.01);assert.equal(r.y,0);
 stepRunner(r,FRAME,{x:0,z:0,act:true});assert.ok(r.vy>0&&!r.ground);const rising=r.vy;stepRunner(r,FRAME,{x:0,z:0,act:true});assert.ok(r.vy<rising,'no second jump in the air');
 // Past a checkpoint the return point moves forward and the count starts again.
 const far=play('forest','jump').r;assert.ok(far.spawn.x>=30&&far.falls===0);
});
test('a slow frame cannot push an animal through the floor, a wall or an obstacle',()=>{
 const r=beginSection(createRunner(),'forest','jump');for(let i=0;i<40;i++)stepRunner(r,1,{x:1,z:0,act:false});assert.ok(r.y===0||r.y<0,'still on or past the first edge');
 const wall=beginSection(createRunner(),'forest','jump');Object.assign(wall,{x:22.4});for(let i=0;i<120;i++)stepRunner(wall,.5,{x:1,z:0,act:false});assert.ok(wall.x<23,'the ledge side stops a walk');
 const swim=beginSection(createRunner(),'pond','swim');Object.assign(swim,{z:-1.4});for(let i=0;i<300;i++)stepRunner(swim,.5,{x:1,z:0,act:false});
 for(const b of blockersOf('pond'))assert.ok(Math.hypot(swim.x-b.x,swim.z-b.z)>=b.r+RADIUS-1e-6);assert.equal(swim.y,WATER_Y);assert.ok(Math.abs(swim.z)<=LANE-RADIUS+1e-9);
});
test('each coast animal stays on its own side: the crab on the mudflat, the fish in the sea water',()=>{
 const crab=beginSection(createRunner(),'coast','walk'),fish=beginSection(createRunner(),'coast','swim');
 for(let i=0;i<240;i++){stepRunner(crab,FRAME,{x:0,z:1,act:false});stepRunner(fish,FRAME,{x:0,z:-1,act:false});}
 assert.ok(crab.z<0&&crab.y===0);assert.ok(fish.z>0&&fish.y===WATER_Y);
 assert.ok(spawnPoint('pond','swim').x>TRACK.pond.x0,'a swimmer starts in the water');
});
test('flying: holding rises, letting go sinks gently, and barriers block the wrong height only',()=>{
 const r=beginSection(createRunner(),'sky','fly');for(let i=0;i<120;i++)stepRunner(r,FRAME,{x:0,z:0,act:true});const high=r.y;assert.ok(high>3);
 for(let i=0;i<60;i++)stepRunner(r,FRAME,{x:0,z:0,act:false});assert.ok(r.y<high);
 const low=beginSection(createRunner(),'sky','fly');for(let i=0;i<600;i++)stepRunner(low,FRAME,{x:1,z:0,act:false});assert.ok(low.x<89,'a low flight stops at the tall flower hedge');assert.ok(low.y>TRACK.sky.floor,'it rests on the flower tops, never falls');
});
test('every painted picture the stage asks for exists, and the whole set stays a small download',async()=>{
 const {RELAY_ART}=await import('../src/relay-course.js'),{statSync,readFileSync}=await import('node:fs');let total=0;
 for(const name of RELAY_ART)total+=statSync(new URL(`../assets/relay/${name}.webp`,import.meta.url)).size;
 assert.ok(total<3*1024*1024,'under the 3 MB budget: '+total);assert.equal(new Set(RELAY_ART).size,RELAY_ART.length);
 const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');for(const file of ['relay.css','relay3d.js','relay-course.js','relay.js','relay-views.js','map-controls.js'])assert.ok(build.includes(`'src/${file}'`),file+' is copied to dist');
 assert.match(build,/RUN_ART\.map/);assert.match(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/href="\.\/src\/relay\.css"/);
 const view=readFileSync(new URL('../src/view3d.js',import.meta.url),'utf8');assert.match(view,/kind==='relay'\?import\('\.\/relay3d\.js'\)/);
});

test('every relay animal has a four-frame motion strip, and the frame follows the movement', async()=>{
 const {SPRITES,FRAMES,spriteName,spriteFrame,hopLift,RELAY_ART}=await import('../src/relay-course.js'),{RUN_ART}=await import('../src/link-course.js'),{statSync}=await import('node:fs');
 for(const id of ['rabbit','frog','duck','marine','crab','butterfly']){
  assert.ok(SPRITES[id],id);assert.ok(RELAY_ART.includes(spriteName(id))&&RUN_ART.includes(spriteName(id)),id);
  assert.ok(statSync(new URL(`../assets/relay/${spriteName(id)}.webp`,import.meta.url)).size>10000,id);
 }
 // Resting animals show the first frame; a frog that stops swimming rests too.
 for(const kind of ['jump','fly','walk'])assert.equal(spriteFrame('x',{kind,ground:true,moving:false},1.37),0);
 assert.equal(spriteFrame('frog',{kind:'swim',moving:false},1.37),0);
 // In the air the rabbit pushes off while rising, stretches at the top and reaches for the ground while falling.
 assert.equal(spriteFrame('rabbit',{kind:'jump',ground:false,vy:6},0),1);
 assert.equal(spriteFrame('rabbit',{kind:'jump',ground:false,vy:0},0),2);
 assert.equal(spriteFrame('rabbit',{kind:'jump',ground:false,vy:-6},0),3);
 // Moving cycles through all four frames.
 for(const [id,s] of [['rabbit',{kind:'jump',ground:true,moving:true}],['crab',{kind:'walk',moving:true}],['duck',{kind:'swim',moving:true}],['butterfly',{kind:'fly',ground:false}]]){
  const seen=new Set();for(let t=0;t<2;t+=.01)seen.add(spriteFrame(id,s,t));assert.deepEqual([...seen].sort(),[0,1,2,3].slice(0,FRAMES),id);
 }
 assert.equal(hopLift(0,.22),0);assert.ok(Math.abs(hopLift(.25,.22)-.22)<1e-9);
});
