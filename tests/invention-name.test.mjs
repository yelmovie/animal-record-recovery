import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExpedition,selectDesignProblem,PROBLEMS,PRODUCTS,taskReady,restoreExpedition} from '../src/expedition.js';
import {activityView} from '../src/mission-views.js';

test('a new invention suggests a name without saving it or counting it as the learner input',()=>{
 const s=freshExpedition();selectDesignProblem(s,0,'swim');
 const d=s.designs[0],p=PROBLEMS.swim;
 Object.assign(d,{feature:p.feature,structure:p.structure,spot:PRODUCTS.swim.spot});d.experiment.sourceSeen=true;
 assert.equal(d.name,'');assert.equal(taskReady(s,5,0),false);
 const html=activityView(s,{stage:5,step:0});
 assert.match(html,/id="invention-name"[^>]*value=""[^>]*placeholder="예: 물살 쌩쌩 오리발"/);
 assert.match(html,/aria-describedby="invention-name-help"/);assert.match(html,/원하는 이름을 직접 써 줘/);
});

test('a freely chosen name is escaped, survives workspace switches and reload, and remains editable',()=>{
 const s=freshExpedition();selectDesignProblem(s,0,'swim');s.designs[0].name='번개 & 물살 오리발';
 selectDesignProblem(s,0,'protect');assert.equal(s.designs[0].name,'');selectDesignProblem(s,0,'swim');
 const restored=restoreExpedition(JSON.stringify(s));assert.equal(restored.designs[0].name,'번개 & 물살 오리발');
 const html=activityView(restored,{stage:5,step:0});
 assert.match(html,/value="번개 &amp; 물살 오리발"/);assert.match(html,/이름은 자유롭게 바꿀 수 있어/);
});
