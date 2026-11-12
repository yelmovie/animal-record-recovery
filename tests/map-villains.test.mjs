import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMapVillains} from '../src/map-villains.js';
test('old and malformed saves get five bounded hit counts',()=>{
 assert.deepEqual(normalizeMapVillains(null),[0,0,0,0,0]);
 assert.deepEqual(normalizeMapVillains([3,2,-1,4,'3',1]),[3,2,0,0,0]);
 assert.deepEqual(normalizeMapVillains(JSON.parse(JSON.stringify([0,1,2,3,0]))),[0,1,2,3,0]);
});

import {freshExpedition,restoreExpedition} from '../src/expedition.js';
test('save roundtrip, old saves, reset and preview copies preserve boundaries',()=>{const s=freshExpedition();s.mapVillains=[3,2,1,0,0];assert.deepEqual(restoreExpedition(JSON.stringify(s)).mapVillains,s.mapVillains);const copy=structuredClone(s);copy.mapVillains[0]=0;assert.equal(s.mapVillains[0],3);delete s.mapVillains;assert.deepEqual(restoreExpedition(JSON.stringify(s)).mapVillains,[0,0,0,0,0]);assert.deepEqual(freshExpedition().mapVillains,[0,0,0,0,0]);});
