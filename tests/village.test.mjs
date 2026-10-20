import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {villagePath,nearestNode,directionalNode,npcLine,NPCS,buildingAt} from '../src/village.js';

const graph={nodes:{a:[0,0],b:[100,0],c:[100,100],d:[300,300]},edges:[['a','b'],['b','c'],['c','d']]};
test('directional walking follows a connected segment and cannot walk through a building',()=>{
  assert.equal(directionalNode(graph,'a','right'),'b');
  assert.equal(directionalNode(graph,'a','down'),null);
  assert.equal(directionalNode(graph,'b','down'),'c');
  assert.equal(directionalNode(graph,'b','left'),'a');
  assert.equal(directionalNode(graph,'missing','up'),null);
});
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
test('book building opens the gallery and the flask building opens invention stage five',()=>{
  const {buildings}=JSON.parse(readFileSync(new URL('../assets/village/village.json',import.meta.url),'utf8'));
  assert.equal(buildingAt(buildings,[1410,330]),'gallery');
  assert.equal(buildingAt(buildings,[1400,670]),'5');
  assert.equal(buildingAt(buildings,[300,630]),'4');
});
test('every stage and the gallery have a connected door node, including the workshop across the river',()=>{
 const data=JSON.parse(readFileSync(new URL('../assets/village/village.json',import.meta.url),'utf8'));
 for(const [id,b]of Object.entries(data.buildings)){
  if(id==='core')continue;
  assert.deepEqual(data.nodes[b.node],b.door,`${id}: door must be on the walk graph`);
  const route=villagePath(data,'plaza',b.node);assert.ok(route.length>1,`${id}: reachable from plaza`);
  if(id==='5')assert.ok(route.includes('woodBridge'),'the workshop route crosses the actual bridge');
 }
});
