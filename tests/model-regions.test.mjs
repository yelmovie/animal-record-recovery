import test from 'node:test';
import assert from 'node:assert/strict';
import {regionAt} from '../src/scanner3d.js';

test('new rabbit hind foot and thigh are legs; its front foot remains a re-look hint',()=>{
  // Coordinates measured by clicking the supplied replacement model in WebGL.
  assert.equal(regionAt('rabbit',{x:-.153,y:.162,z:.449}).part,2);
  assert.equal(regionAt('rabbit',{x:-.352,y:.722,z:.591}).part,2);
  assert.equal(regionAt('rabbit',{x:.621,y:.207,z:.299}).part,-1);
  assert.equal(regionAt('rabbit',{x:-.153,y:.162,z:-.449}).part,2);
});

test('new mallard bill and both webbed feet match observations; its eye is a hint',()=>{
  assert.equal(regionAt('duck',{x:1.202,y:1.619,z:.078}).part,0);
  assert.equal(regionAt('duck',{x:.26,y:.062,z:.331}).part,2);
  assert.equal(regionAt('duck',{x:.268,y:.052,z:-.288}).part,2);
  assert.equal(regionAt('duck',{x:.856,y:1.842,z:.113}).part,-1);
  assert.equal(regionAt('duck',{x:.203,y:.936,z:.453}).part,1);
});

test('the new models map sampled mesh points to the observed parts',()=>{
  assert.equal(regionAt('sparrow',{x:-.316,y:2.077,z:1.044}).part,0);
  assert.equal(regionAt('sparrow',{x:1.497,y:2.039,z:-.106}).part,1);
  assert.equal(regionAt('sparrow',{x:.866,y:.138,z:.71}).part,2);
  assert.equal(regionAt('sparrow',{x:1.259,y:1.597,z:.445}).part,-1);
  assert.equal(regionAt('spider',{x:-.068,y:.645,z:1.036}).part,0);
  assert.equal(regionAt('spider',{x:-.488,y:1.079,z:.031}).part,1);
  assert.equal(regionAt('spider',{x:.268,y:.74,z:.084}).part,2);
  assert.equal(regionAt('ant',{x:.5,y:.539,z:.994}).part,0);
  assert.equal(regionAt('ant',{x:-.106,y:1.042,z:.09}).part,1);
  assert.equal(regionAt('ant',{x:1.338,y:2.148,z:-.506}).part,2);
});

test('bat membrane on either side, chest fur and ears have separate observation targets',()=>{
  for(const side of [-1,1]){
    assert.equal(regionAt('bat',{x:1.24*side,y:1.27,z:-.47}).part,0);
    assert.equal(regionAt('bat',{x:.41*side,y:2.02,z:.06}).part,2);
  }
  assert.equal(regionAt('bat',{x:0,y:1.14,z:.16}).part,1);
});
