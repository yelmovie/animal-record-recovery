import {test} from 'node:test';
import assert from 'node:assert/strict';
import {villagePath,nearestNode,npcLine,NPCS,buildingAt} from '../src/village.js';

const graph={nodes:{a:[0,0],b:[100,0],c:[100,100],d:[300,300]},edges:[['a','b'],['b','c'],['c','d']]};
test('village walks follow the path graph and snap taps to the nearest node',()=>{
  assert.deepEqual(villagePath(graph,'a','d'),['a','b','c','d']);
  assert.deepEqual(villagePath(graph,'a','missing'),[]);
  assert.equal(nearestNode(graph,[90,20]),'b');
  assert.equal(nearestNode(graph,[260,240]),'d');
});
test('NPC lines change once their building is restored and celebrate at five',()=>{
  const ranger=NPCS.find(n=>n.id==='ranger');
  assert.equal(npcLine(ranger,[1,2]),ranger.before);
  assert.equal(npcLine(ranger,[1,2,3]),ranger.after);
  assert.match(npcLine(ranger,[1,2,3,4,5]),/크리스털/);
});
test('tapping a building picks that stage, but the core square and open paths do not',()=>{
  const buildings={'1':{rect:[0,0,100,100]},core:{rect:[150,0,100,100]}};
  assert.equal(buildingAt(buildings,[50,90]),'1');
  assert.equal(buildingAt(buildings,[200,50]),null);
  assert.equal(buildingAt(buildings,[120,50]),null);
});
