import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shuffled} from '../src/choice-order.js';
import {createNavigation} from '../src/navigation.js';
import {freshExpedition,restoreExpedition,noteTry,firstTrySummary} from '../src/expedition.js';

test('choice order is a permutation that stays put for the same question while the page is open',()=>{
  const list=[['a','가'],['b','나'],['c','다']];
  const first=shuffled('test:q1',list);
  assert.deepEqual([...first].sort(),[...list].sort());
  for(let i=0;i<5;i++)assert.deepEqual(shuffled('test:q1',list),first);
});

test('across many questions the right answer lands in every position',()=>{
  const seen=new Set();
  for(let i=0;i<60;i++)seen.add(shuffled('test:spread'+i,['right','w1','w2']).indexOf('right'));
  assert.deepEqual([...seen].sort(),[0,1,2]);
});

test('only the first pick counts; retrying never turns a helped answer into a first-try one',()=>{
  const s=freshExpedition();
  noteTry(s,'compare:0:common',false);noteTry(s,'compare:0:common',true);
  noteTry(s,'habitat:1',true);noteTry(s,'habitat:1',false);
  assert.deepEqual(s.firstTries,{'compare:0:common':'helped','habitat:1':'first'});
  assert.deepEqual(firstTrySummary(s),{first:1,total:2});
});

test('first tries survive a reload, unknown keys are dropped, and old saves without them still open',()=>{
  const s=freshExpedition();noteTry(s,'row:3:1:a-proof',true);
  const back=restoreExpedition(JSON.stringify({...s,firstTries:{...s.firstTries,'bad key!':'first','verify:fix':'maybe'}}));
  assert.deepEqual(back.firstTries,{'row:3:1:a-proof':'first'});
  const old={...freshExpedition()};delete old.firstTries;
  const restored=restoreExpedition(JSON.stringify(old));
  assert.deepEqual(restored.firstTries,{});
  assert.deepEqual(firstTrySummary(restored),{first:0,total:0});
});

test('navigation reports when a page went onto the history, and reset can keep the current page',()=>{
  const nav=createNavigation(),home={screen:'home'},map={screen:'map'};
  assert.equal(nav.visit(home),false);assert.equal(nav.visit(map),true);assert.equal(nav.visit(map),false);
  nav.reset(map);assert.equal(nav.canGoBack,false);assert.equal(nav.visit(map),false);assert.equal(nav.visit(home),true);
});
