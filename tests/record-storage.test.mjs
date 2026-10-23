import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectRecord,createRecordStorage,recordBackup,openRecordBackup} from '../src/record-storage.js';
import {freshExpedition,restoreExpedition} from '../src/expedition.js';
import {freshState} from '../src/model.js';
import {normalizeStudio,studioShape} from '../src/studio.js';
import {markerSafeOffset} from '../src/village.js';
const memory=raw=>({raw,failRead:false,failWrite:false,getItem(){if(this.failRead)throw Error('blocked');return this.raw;},setItem(_,v){if(this.failWrite)throw new DOMException('Full','QuotaExceededError');this.raw=v;}});

test('new, corrupt and future saves are distinct; repeated rendering cannot replace originals',()=>{
 assert.equal(inspectRecord(null).status,'empty');
 for(const [raw,status] of [['{broken','corrupt'],['null','corrupt'],['{"version":4}','corrupt'],['{"version":99}','unsupported'],['','corrupt']]){
  const disk=memory(raw),store=createRecordStorage(disk);assert.equal(store.read().status,status);
  for(let i=0;i<4;i++)assert.equal(store.write(freshExpedition()),false);
  assert.equal(disk.raw,raw);assert.equal(store.raw,raw);
 }
});
test('read failure and quota failure keep the original, and only a write failure can retry in place',()=>{
 const raw=JSON.stringify(freshExpedition()),disk=memory(raw),store=createRecordStorage(disk);disk.failRead=true;
 assert.equal(store.read().status,'unavailable');disk.failRead=false;assert.equal(store.write(freshExpedition()),false);assert.equal(disk.raw,raw);
 const working=createRecordStorage(disk);working.read();disk.failWrite=true;const next=freshExpedition();next.observed=['frog-eye'];
 assert.equal(working.write(next),false);assert.equal(working.status,'quota');assert.equal(disk.raw,raw);
 disk.failWrite=false;assert.equal(working.write(next),true);assert.deepEqual(JSON.parse(disk.raw).observed,['frog-eye']);
});
test('a newer save from another tab is never overwritten, even by an old confirmation',()=>{
 const disk=memory(JSON.stringify(freshExpedition())),store=createRecordStorage(disk);store.read();
 const next=freshExpedition();next.observed=['frog-eye'];disk.raw=JSON.stringify(next);const newer=disk.raw;
 assert.equal(store.write(freshExpedition()),false);assert.equal(store.write(freshExpedition(),{replace:true}),false);assert.equal(store.status,'conflict');assert.equal(disk.raw,newer);assert.equal(store.raw,newer);
});
test('Korean backup reopens progress, photos, drawings and archived records without changing the original input',()=>{
 const state=freshExpedition();state.observed=['frog-eye'];state.observeTries={'frog-eye':'helped'};
 state.inquiry.motionPhotos.rabbit={dataURL:'data:image/webp;base64,AAAA',width:480,height:270,time:1,duration:5};
 state.studio=normalizeStudio({title:'한글 발명 — 물갈퀴 우산',audience:'친구',purpose:'비를 막아 줘',inspiration:'넓은 면',strokes:[studioShape('wide')]});
 const normalized=restoreExpedition(JSON.stringify(state)),file=recordBackup(normalized);
 assert.match(file,/한글 발명/);assert.deepEqual(openRecordBackup(file),normalized);assert.deepEqual(state.observed,['frog-eye']);
 assert.throws(()=>openRecordBackup('{broken'));assert.throws(()=>openRecordBackup(JSON.stringify({format:'other'})));
 assert.throws(()=>openRecordBackup(JSON.stringify({format:'animal-record-recovery-backup',formatVersion:1,state:{version:99}})));
});
test('v1, v3 and existing v4 retain their supported migration path',()=>{
 for(const value of [freshState(),{...freshExpedition(),version:3},freshExpedition()]){const raw=JSON.stringify(value);assert.equal(inspectRecord(raw).status,'ok');assert.deepEqual(inspectRecord(raw).state,restoreExpedition(raw));}
});
test('shape input uses compatible strokes and clamps only partially visible signs, leaving the camera alone',()=>{
 for(const kind of ['rectangle','circle','triangle','arrow','wide'])assert.deepEqual(normalizeStudio({strokes:[studioShape(kind)]}).strokes[0],studioShape(kind));
 const bounds={left:8,right:1016,top:84,bottom:760};
 assert.deepEqual(markerSafeOffset({left:-20,right:100,top:70,bottom:170},bounds),[28,14]);
 assert.deepEqual(markerSafeOffset({left:950,right:1070,top:700,bottom:800},bounds),[-54,-40]);
 assert.deepEqual(markerSafeOffset({left:-300,right:-180,top:100,bottom:200},bounds),[0,0]);
 assert.deepEqual(markerSafeOffset({left:20,right:140,top:-30,bottom:50},bounds,{left:0,right:1024,top:0,bottom:768}),[0,114]);
});
