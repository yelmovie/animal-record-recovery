import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExpedition,restoreExpedition,claimTask} from '../src/expedition.js';
import {activityView} from '../src/mission-views.js';
import {can3d} from '../src/view3d.js';

const view=(extra={})=>({stage:1,step:0,focusIndex:0,...extra});
test('screen 02 offers all three descriptions without a pin and keeps optional pin focus',()=>{
  const s=freshExpedition();
  const before=activityView(s,view({use3d:true,pinned:[]}));
  assert.match(before,/data-3d="scanner"/);assert.match(before,/data-animal="frog"/);
  assert.ok(!before.includes('id="lens-surface"'),'the 2D lens surface is not drawn in 3D');
  assert.equal((before.match(/data-action="observe"/g)||[]).length,3);
  assert.match(before,/부분 버튼으로 바로 살펴봐/);
  const pinned=activityView(s,view({use3d:true,pinned:['frog-eye']}));
  assert.equal((pinned.match(/data-action="observe"/g)||[]).length,3);
  s.observed.push('frog-eye');
  assert.match(activityView(s,view({use3d:true,pinned:[]})),/기록했어/,'a recorded part needs no new pin');
  assert.match(activityView(s,view({use3d:true,focusIndex:1})),/<h2>뒷다리<\/h2>/);
});
test('without 3D the 2D lens screen is unchanged',()=>{
  const html=activityView(freshExpedition(),view());
  assert.match(html,/id="lens-surface"/);assert.ok(!html.includes('data-3d'));assert.equal((html.match(/data-action="observe"/g)||[]).length,3);
  assert.equal(can3d(),false,'no DOM (node) means no WebGL');
});
test('the 3D scanner keeps the same pass rule and save shape',()=>{
  const s=freshExpedition();
  s.observed=['frog-eye','frog-leg','frog-skin','crab-eye','crab-leg'];
  assert.equal(claimTask(s,1,0).ok,false,'five of six parts is not enough');
  s.observed.push('crab-shell');assert.equal(claimTask(s,1,0).ok,true);
  const saved=JSON.parse(JSON.stringify(s)),restored=restoreExpedition(JSON.stringify(saved));
  assert.deepEqual(restored.observed,saved.observed);assert.ok(!('pinned' in restored),'pins are not saved');
});
test('screen 06 in 3D draws the dome host and keeps the motion notes and 2D fallback',()=>{
  const s=freshExpedition(),v={stage:3,step:0,activeHabitat:'forest'};
  const dome=activityView(s,{...v,use3d:true,tiltable:true});
  assert.match(dome,/data-3d="dome"/);assert.ok(!dome.includes('data-action="discover"'),'animals are found in the dome, not on a 2D button');
  assert.match(dome,/data-action="dome-tilt"/);assert.ok(!activityView(s,{...v,use3d:true}).includes('dome-tilt'),'no tilt button without a sensor API');
  s.discovered.push('forest-rabbit');
  assert.match(activityView(s,{...v,use3d:true}),/motion-observer/,'a found animal opens the same motion notes');
  const flat=activityView(freshExpedition(),v);assert.match(flat,/data-action="discover"/);assert.ok(!flat.includes('data-3d'));
});
