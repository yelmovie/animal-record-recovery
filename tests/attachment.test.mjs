import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nearestAttachment} from '../src/drag.js';
import {assemblyView} from '../src/mission-views.js';
import {freshExpedition} from '../src/expedition.js';
test('attachment snapping follows the dropped position, including an incorrect position, rather than choosing the answer',()=>{
 const spots=[{id:'toe',x:262,y:196},{id:'ankle',x:118,y:92},{id:'heel',x:62,y:192}];
 assert.equal(nearestAttachment({x:255,y:188},spots).id,'toe');
 assert.equal(nearestAttachment({x:108,y:104},spots).id,'ankle');
 assert.equal(nearestAttachment({x:48,y:203},spots).id,'heel');assert.equal(nearestAttachment({x:0,y:0},[]),null);
});
test('sketching retains all attachment targets and existing strokes in the rendered product',()=>{
 const d=freshExpedition().designs[0];Object.assign(d,{problem:'swim',strokes:[[[20,30],[50,60]]],structure:'wide',spot:'toe'});
 const html=assemblyView(d,{sketching:true});assert.match(html,/assembly sketching/);assert.match(html,/points="20,30 50,60"/);
 assert.equal((html.match(/data-drop-action="design-part"/g)||[]).length,3);assert.match(html,/data-anchor-x="262" data-anchor-y="196"/);
});
