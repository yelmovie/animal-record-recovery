import {test} from 'node:test';
import assert from 'node:assert/strict';
import {experimentDiagram} from '../src/inquiry-views.js';
import {assemblyView} from '../src/mission-views.js';
import {freshExpedition} from '../src/expedition.js';
import {villageCamera,villageZoom} from '../src/village.js';
import {researchLines} from '../src/research-report.js';
import {campaignFixture} from './fixtures/campaign-state.mjs';

test('swim comparisons vary width alone and use the same image and length',()=>{
 const images=[1,2,3].map(level=>experimentDiagram('swim',level,false).match(/<image class="swim-blade"[^>]+>/)[0]);
 assert.equal(new Set(images.map(x=>x.match(/height="([^"]+)/)[1])).size,1);
 assert.equal(new Set(images.map(x=>x.match(/href="([^"]+)/)[1])).size,1);
 const widths=images.map(x=>Number(x.match(/width="([^"]+)/)[1]));
 assert.ok(widths[0]<widths[1]&&widths[1]<widths[2]);
 for(const image of images)assert.match(image,/preserveAspectRatio="none"/);
});
test('only a fin attached at the toe becomes an integrated swimming shoe',()=>{
 const d={...freshExpedition().designs[0],problem:'swim',structure:'wide',spot:'toe'};
 assert.match(assemblyView(d,{},false),/assembled-swim-shoe/);
 for(const spot of ['heel','ankle'])assert.doesNotMatch(assemblyView({...d,spot},{},false),/assembled-swim-shoe/);
 assert.doesNotMatch(assemblyView({...d,structure:'dome'},{},false),/assembled-swim-shoe/);
});
test('whole-map view fits the full map and zoomed camera remains within its edges',()=>{
 for(const [sw,sh]of [[1024,768],[1280,720],[1440,900],[1920,1080]]){
  const fit=villageCamera(sw,sh,1920,1080,1,0,0);
  assert.ok(fit.left>=0&&fit.top>=70&&fit.left+fit.width<=sw&&fit.top+fit.height<=sh-70);
  for(const [x,y]of [[0,0],[1920,1080]]){
   const c=villageCamera(sw,sh,1920,1080,2,x,y);
   assert.ok(c.left<=0&&c.left>=sw-c.width&&c.top<=0&&c.top>=sh-c.height);
  }
 }
 assert.equal(villageZoom(0),1);assert.equal(villageZoom(9),2);
});
test('student report keeps chosen observations and personal notes without implementation metadata',()=>{
 const s=campaignFixture();s.designs[0].experiment.note='넓게 하니 물을 더 많이 밀었어.';
 const text=researchLines(s).join('\n');
 assert.match(text,/개구리의 눈을 살펴봤어/);assert.match(text,/넓게 하니 물을 더 많이 밀었어/);
 assert.doesNotMatch(text,/브라우저|인증|판정|설계선|PNG|sourceSeen|structure|undefined|\[object Object\]/);
 const blank=researchLines(freshExpedition()).join('\n');
 assert.doesNotMatch(blank,/나는 동물의|번째 모양 비교|개구리의 눈을 살펴봤어/);
});
