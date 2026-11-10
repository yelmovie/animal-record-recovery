import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {progress} from '../src/presentation.js';
import {STAGES, freshExpedition} from '../src/expedition.js';
import {SETTINGS_TEXT} from '../src/settings-content.js';

test('review feedback: map, quest and reward stars follow every actual activity',()=>{
 assert.deepEqual(STAGES.map(stage=>stage.tasks.length),[8,2,4,6,4]);
 const state=freshExpedition();
 for(const stage of STAGES){
  const count=stage.tasks.length;
  const empty=progress(state,stage.id);
  assert.equal((empty.match(/<svg /g)||[]).length,count);
  assert.equal((empty.match(/class="earned"/g)||[]).length,0);
  state.activities=[`${stage.id}-${count-1}`];
  const last=progress(state,stage.id);
  assert.equal((last.match(/class="earned"/g)||[]).length,1);
  assert.match(last,/<i class="earned"><svg[\s\S]*<\/i>$/);
  state.activities=stage.tasks.map((_,index)=>`${stage.id}-${index}`);
  assert.equal((progress(state,stage.id).match(/class="earned"/g)||[]).length,count);
  state.activities=[];
 }
 assert.equal(progress(state,99),'');
});

test('review feedback: official source domain and corrected Korean spacing remain consistent',()=>{
 assert.match(SETTINGS_TEXT.contentSource,/ncic\.re\.kr/);
 assert.doesNotMatch(SETTINGS_TEXT.contentSource,/ncic\.go\.kr/);
 const read=file=>readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');
 assert.match(read('shell-views.js'),/처음부터 다시 하기/);
 assert.match(read('expedition.js'),/걸어 다녔어/);
 assert.match(read('adventure-app.js'),/이어 가자/);
 for(const file of ['shell-views.js','expedition.js','adventure-app.js','story-player.js'])assert.doesNotMatch(read(file),/다시하기|걸어다녔어|이어가자|이어갈/);
});

test('crab colour correction keeps original material maps and is idempotent',async()=>{
 const {applyCrabColour}=await import('../src/scanner3d.js');
 const {T}=await import('../src/stage3d.js');
 const material=new T.MeshStandardMaterial();const texture=new T.Texture();material.map=texture;
 const colour=material.color.clone();applyCrabColour(material);
 const compile=material.onBeforeCompile;applyCrabColour(material);
 assert.equal(material.onBeforeCompile,compile);
 assert.equal(material.map,texture);
 assert.ok(material.color.equals(colour));
 const shader={fragmentShader:'before\n#include <map_fragment>\nafter'};compile(shader);
 assert.match(shader.fragmentShader,/crabWarm/);assert.match(shader.fragmentShader,/crabEarth/);
 assert.equal((shader.fragmentShader.match(/#include <map_fragment>/g)||[]).length,1);
 assert.equal(material.customProgramCacheKey(),'crab-earth-v1');
 const source=readFileSync(new URL('../src/scanner3d.js',import.meta.url),'utf8');
 assert.match(source,/if\(id==='crab'\)applyCrabColour\(material\)/);
});
