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
