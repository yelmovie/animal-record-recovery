import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExpedition,restoreExpedition,claimTask} from '../src/expedition.js';
import {activityView} from '../src/mission-views.js';
import {can3d} from '../src/view3d.js';

const view=(extra={})=>({stage:1,step:0,focusIndex:0,...extra});
test('screen 02 in 3D asks for a pin on the specimen before the descriptions appear',()=>{
  const s=freshExpedition();
  const before=activityView(s,view({use3d:true,pinned:[]}));
  assert.match(before,/data-3d="scanner"/);assert.match(before,/data-animal="frog"/);
  assert.ok(!before.includes('id="lens-surface"'),'the 2D lens surface is not drawn in 3D');
  assert.ok(!before.includes('data-action="observe"'),'no description to pick before the pin');
  assert.match(before,/<b>눈<\/b>을 찾아 눌러/);
  const pinned=activityView(s,view({use3d:true,pinned:['frog-eye']}));
  assert.equal((pinned.match(/data-action="observe"/g)||[]).length,3);
  s.observed.push('frog-eye');
  assert.match(activityView(s,view({use3d:true,pinned:[]})),/기록했어/,'a recorded part needs no new pin');
  assert.match(activityView(s,view({use3d:true,focusIndex:1})),/<b>뒷다리<\/b>를 찾아/);
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
