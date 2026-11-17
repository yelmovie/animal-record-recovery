import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshExpedition,restoreExpedition,DISCOVERIES,HABITATS,ANIMALS} from '../src/expedition.js';
import {MOTIONS} from '../src/inquiry.js';
import {RELAY_SECTIONS,RELAY_CONTROLS,relayOpen,relayAnimals,relayCheck,relayCross,relayNext,relayKind,normalizeRelay,freshRelay} from '../src/relay.js';

const STEPS=['3-0','3-1','3-2','3-3'];
function finished(){const s=freshExpedition();s.activities=['1-0',...STEPS];s.completed=[3];s.discovered=DISCOVERIES.map(d=>d.id);for(const d of DISCOVERIES)s.inquiry.motion[d.animal]=1;return s;}

test('the relay stays closed until all four stage-3 activities are recorded',()=>{
 const s=freshExpedition();assert.equal(relayOpen(s),false);
 for(const id of STEPS){assert.equal(relayOpen(s),false,id+' still missing');s.activities.push(id);}
 assert.equal(relayOpen(s),true);
 assert.equal(relayCross(freshExpedition(),'forest','rabbit').ok,false,'nothing is recorded while closed');
});
test('only animals the learner found can be picked; the teacher preview copy shows all six',()=>{
 const s=finished();s.discovered=['forest-rabbit','pond-duck'];assert.deepEqual(relayAnimals(s),['rabbit','duck']);
 assert.equal(relayCross(s,'pond','frog').ok,false,'frog was not found');
 const preview=freshExpedition();preview.adminUnlocked=true;assert.equal(relayOpen(preview),true);assert.equal(relayAnimals(preview).length,6);
});
test('a section accepts an animal only when its recorded place and way of moving both fit',()=>{
 const fits=id=>DISCOVERIES.map(d=>d.animal).filter(a=>relayCheck(id,a).ok);
 assert.deepEqual(fits('forest'),['rabbit','butterfly']);assert.deepEqual(fits('pond'),['frog','duck']);
 assert.deepEqual(fits('sky'),['butterfly']);assert.deepEqual(fits('coast'),['marine','crab']);
 // The rule is the stage-3 data itself, not a list kept here.
 for(const section of RELAY_SECTIONS)for(const d of DISCOVERIES)assert.equal(relayCheck(section.id,d.animal).ok,d.habitat===section.habitat&&section.kinds.includes(MOTIONS[d.animal].kind));
 for(const d of DISCOVERIES)assert.ok(RELAY_SECTIONS.some(x=>relayCheck(x.id,d.animal).ok),d.animal+' has a section');
 for(const section of RELAY_SECTIONS)assert.ok(Object.hasOwn(HABITATS,section.habitat)&&section.kinds.every(k=>Object.hasOwn(RELAY_CONTROLS,k)));
});
test('feedback repeats the learner\'s own record: where the animal was met and the body part it moves with',()=>{
 const place=relayCheck('forest','frog');assert.equal(place.reason,'place');assert.match(place.text,/개구리는 연못과 물가에서 만났어/);assert.match(place.text,/숲과 들/);
 const way=relayCheck('sky','rabbit');assert.equal(way.reason,'way');assert.match(way.text,/토끼는 긴 뒷다리로 뛰어서 움직여/);assert.match(way.text,/날아서/);
 const ok=relayCheck('pond','duck');assert.ok(ok.text.includes(DISCOVERIES.find(d=>d.animal==='duck').text));assert.match(ok.text,/물갈퀴야/);
 assert.equal(relayCheck('nowhere','duck').ok,false);assert.equal(relayCheck('pond','penguin').ok,false,'optional dome animals are not part of the relay');
 assert.equal(relayKind('crab'),'walk');assert.equal(relayKind('unknown'),'');
});
test('no wording compares animals by speed, height, time or distance',()=>{
 const text=JSON.stringify([RELAY_SECTIONS,RELAY_CONTROLS,...RELAY_SECTIONS.flatMap(x=>Object.keys(ANIMALS).map(a=>relayCheck(x.id,a).text))]);
 assert.doesNotMatch(text,/빠르|빨리|느리|높이 뛰|더 높|멀리 뛰|기록 시간|\d+\s*(초|m|cm|미터)/);
});
test('crossing every section completes the challenge and survives a reload',()=>{
 const s=finished();assert.deepEqual(s.relay,freshRelay());assert.equal(relayNext(s),0);
 assert.equal(relayCross(s,'forest','frog').ok,false);assert.deepEqual(s.relay.picks,{});
 assert.deepEqual(relayCross(s,'forest','rabbit'),{ok:true,done:false,fresh:false});assert.equal(relayNext(s),1);
 relayCross(s,'pond','duck');relayCross(s,'sky','butterfly');assert.equal(s.relay.done,false);assert.equal(relayNext(s),3);
 assert.deepEqual(relayCross(s,'coast','crab'),{ok:true,done:true,fresh:true});assert.equal(relayNext(s),0,'a finished relay starts over from the first section');
 assert.deepEqual(relayCross(s,'pond','frog'),{ok:true,done:true,fresh:false},'another animal can be tried later');
 const again=restoreExpedition(JSON.stringify(s));assert.deepEqual(again.relay,{picks:{forest:'rabbit',pond:'frog',sky:'butterfly',coast:'crab'},done:true});assert.deepEqual(again,s);
 assert.deepEqual(again.completed,s.completed,'the relay is not part of any completion condition');
});
test('older saves gain an empty relay, and saved picks are re-checked against the records',()=>{
 const old=finished();delete old.relay;assert.deepEqual(restoreExpedition(JSON.stringify(old)).relay,freshRelay());
 const early=freshExpedition();early.relay={picks:{forest:'rabbit'},done:true};assert.deepEqual(restoreExpedition(JSON.stringify(early)).relay,freshRelay(),'closed challenge keeps nothing');
 const s=finished();s.relay={picks:{forest:'frog',pond:'duck',sky:'butterfly',coast:'penguin',extra:'duck'},done:true};
 assert.deepEqual(restoreExpedition(JSON.stringify(s)).relay,{picks:{pond:'duck',sky:'butterfly'},done:false});
 assert.deepEqual(normalizeRelay('x',finished()),freshRelay());assert.deepEqual(normalizeRelay({picks:[],done:true},finished()),freshRelay());
});

// Screens (stage 3's last activity, inside the mission page)
import {relayView,RELAY_TITLE} from '../src/relay-views.js';
import {activityView} from '../src/mission-views.js';
const runView=(s,relay,use3d=true)=>relayView(s,{use3d,relay:{section:0,phase:'pick',animal:'',note:'',wrong:'',hint:false,token:0,used:{},...relay}});
test('the relay is stage 3\'s fifth activity, after both photo rounds and both life links',()=>{
 const s=finished();assert.match(activityView(s,{stage:3,step:4,use3d:true,relay:{section:0,phase:'pick',used:{}}}),/class="relay-run relay-pick"/);
 assert.match(activityView(s,{stage:3,step:4,use3d:true,relay:{section:0,phase:'pick',used:{}}}),/data-3d="relay"/);
 assert.doesNotMatch(activityView(s,{stage:3,step:4,use3d:false,relay:{section:0,phase:'pick',used:{}}}),/data-3d="relay"/,'without 3D the picks still work');
});
test('picking shows only found animals with the learner\'s own photos, and never the answer',()=>{
 const s=finished();s.inquiry.motionPhotos.duck={dataURL:'data:image/webp;base64,AAAA',width:320,height:180,time:1,duration:5};
 const html=runView(s,{section:1});assert.equal((html.match(/data-action="relay-pick"/g)||[]).length,6);
 assert.match(html,/src="data:image\/webp;base64,AAAA" alt="내가 찍은 오리 사진"/);assert.match(html,/연못 물길/);assert.match(html,/어떤 몸 부분으로 움직였는지 떠올려 봐/);
 for(const part of ['물갈퀴','긴 뒷다리','지느러미'])assert.ok(!html.includes(part),'no body part before a pick');
 s.discovered=['pond-duck'];assert.equal((runView(s,{section:1}).match(/data-action="relay-pick"/g)||[]).length,1);
 assert.match(runView(s,{section:1,note:'개구리 <b>',wrong:'frog'}),/개구리 &lt;b&gt;/);
});
test('the run screen offers a labelled direction pad and one action button only where the animal needs it; no notice line',()=>{
 const s=finished(),jump=runView(s,{phase:'run',animal:'rabbit'}),swim=runView(s,{phase:'run',section:1,animal:'frog'}),fly=runView(s,{phase:'run',section:2,animal:'butterfly'});
 for(const html of [jump,swim,fly]){for(const d of ['up','left','right','down'])assert.match(html,new RegExp(`data-relay-dir="${d}" aria-label="[^"]+ 움직이기"`));assert.match(html,/data-3d="relay"/);assert.doesNotMatch(html,/학습용 모형이야|relay-exit/);}
 assert.match(jump,/data-relay-act aria-label="긴 뒷다리로 뛰기"/);assert.match(fly,/data-relay-act aria-label="날개로 날갯짓"/);assert.ok(!swim.includes('data-relay-act'));
 assert.match(jump,/움직이는 몸 부분 <strong>긴 뒷다리<\/strong>/);assert.match(runView(s,{phase:'run',animal:'rabbit',hint:true}),/class="relay-hint"/);
 const done=runView(s,{phase:'done',section:3,used:{forest:'rabbit',pond:'frog',sky:'butterfly',coast:'marine'}});assert.match(done,new RegExp(RELAY_TITLE+' 완주!'));assert.match(done,/바다 물고기 · 지느러미와 꼬리/);assert.match(done,/data-action="advance"/);
 assert.doesNotMatch(jump+swim+fly+done,/\d+\s*(초|점|등|위)\b|기록 시간|순위/);
 const flat=runView(s,{phase:'ready',animal:'rabbit'},false);assert.match(flat,/이 길 지나가기/);assert.doesNotMatch(flat,/data-3d|data-relay-dir/);
});
