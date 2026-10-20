import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {CONCEPTS,MOTION_REPLAYS,LAB_CONCEPT,replayItem,replayUnlocked,activityUnlocked,captionAt} from '../src/concepts.js';
import {conceptView,replayList,createConceptPlayer} from '../src/concept-video.js';
import {freshExpedition} from '../src/expedition.js';
import {ensureCampaign} from '../src/campaign.js';
import {settingsContent} from '../src/shell-views.js';
import {SETTINGS_TEXT} from '../src/settings-content.js';

const ids=CONCEPTS.map(c=>c.id);
const lab=(problem,levels)=>({problem,experiment:{sourceSeen:true,level:levels.at(-1),prediction:'more',reflection:'',note:'',peer:'',trials:levels.map(level=>({problem,level,prediction:'more'}))}});

test('five silent concept clips have the contracted lengths and gap-free captions',()=>{
 assert.deepEqual(Object.fromEntries(CONCEPTS.map(c=>[c.id,c.seconds])),{'webbed-foot':10,'shell-helmet':10,'warm-fur':12,'sort-criteria':12,'habitat-life':12.9});
 for(const c of CONCEPTS){
  assert.equal(c.captions[0][0],0,c.id);assert.equal(c.captions.at(-1)[1],c.seconds,c.id);
  c.captions.slice(1).forEach(([start],i)=>assert.equal(start,c.captions[i][1],c.id));
  assert.deepEqual(c.sources.map(([src,type])=>[src.split('/').pop(),type]),[[c.id+'.webm','video/webm'],[c.id+'.mp4','video/mp4']]);
  assert.match(c.poster,new RegExp(`assets/concepts/${c.id}\\.webp$`));
 }
 assert.deepEqual(Object.values(LAB_CONCEPT).sort(),['shell-helmet','warm-fur','webbed-foot']);
 assert.equal(MOTION_REPLAYS.length,8);
});

test('caption lookup follows the media time, including boundaries and the end',()=>{
 assert.equal(captionAt('warm-fur',0),'몸에서는 따뜻한 열이 계속 나와.');
 assert.equal(captionAt('warm-fur',2.99),'몸에서는 따뜻한 열이 계속 나와.');
 assert.equal(captionAt('warm-fur',3),'털이 없으면 열이 금방 밖으로 빠져나가.');
 assert.match(captionAt('warm-fur',11.5),/열을 만드는 게 아니야/);
 assert.match(captionAt('warm-fur',12),/열을 만드는 게 아니야/);
 assert.match(captionAt('habitat-life',8.6),/^오리는 연못에 살아/);
 assert.equal(captionAt('sort-criteria',-3),captionAt('sort-criteria',0));
 // Motion clips use the reviewed push interval: the rabbit pushes the ground from 2.45s to 3.1s.
 assert.equal(captionAt('rabbit',2.6),'땅을 뒤로 힘껏 밀어');
 assert.equal(captionAt('rabbit',0.5),'뒷다리를 굽혀');
 assert.equal(captionAt('nope',1),'');
});

test('every clip is locked on a fresh save; a teacher preview opens the list but not the activity buttons',()=>{
 const s=freshExpedition();
 for(const item of [...CONCEPTS,...MOTION_REPLAYS])assert.equal(replayUnlocked(s,item.id),false,item.id);
 s.adminUnlocked=true;
 for(const id of ids){assert.equal(replayUnlocked(s,id),true,id);assert.equal(activityUnlocked(s,id),false,id);}
});

test('lab clips open only after two different shapes were compared for that problem',()=>{
 const s=freshExpedition();
 s.designs[0]=lab('swim',[1]);assert.equal(replayUnlocked(s,'webbed-foot'),false);
 s.designs[0]=lab('swim',[1,3]);assert.equal(replayUnlocked(s,'webbed-foot'),true);
 assert.equal(replayUnlocked(s,'shell-helmet'),true,'any finished lab comparison opens the other invention clips');assert.equal(replayUnlocked(s,'warm-fur'),true);
 // An archived comparison still counts after the learner switched problems.
 const t=freshExpedition();t.designArchive=[{warm:lab('warm',[1,2])},{}];assert.equal(replayUnlocked(t,'warm-fur'),true);
 const u=freshExpedition();u.records.designs[1]=lab('protect',[2,3]);assert.equal(replayUnlocked(u,'shell-helmet'),true);
});

test('sort, habitat and motion clips follow their activities',()=>{
 const s=freshExpedition();ensureCampaign(s);
 s.activities=['2-0'];assert.equal(replayUnlocked(s,'sort-criteria'),false);
 s.activities.push('2-1');assert.equal(replayUnlocked(s,'sort-criteria'),true);
 assert.equal(replayUnlocked(s,'habitat-life'),false);
 s.campaign.records['3-2']={answers:{}};assert.equal(replayUnlocked(s,'habitat-life'),true);
 const t=freshExpedition();t.activities=['3-3'];t.inquiry.motion.camel=1;assert.equal(replayUnlocked(t,'habitat-life'),false);
 t.inquiry.motion.penguin=1;assert.equal(replayUnlocked(t,'habitat-life'),true);
 t.activities=[];assert.equal(replayUnlocked(t,'habitat-life'),false);
 assert.equal(replayUnlocked(t,'camel'),true);assert.equal(replayUnlocked(t,'frog'),false);
});

test('settings list sits with the replays, fetches no video and says how to open locked clips',()=>{
 const s=freshExpedition();s.inquiry.motion.frog=1;const h=settingsContent(s),list=replayList(s);
 const at=t=>{const i=h.indexOf(t);assert.ok(i>=0,t);return i;};
 assert.ok(at(SETTINGS_TEXT.replayIntro)<at(SETTINGS_TEXT.replayVideos));assert.ok(at(SETTINGS_TEXT.replayVideos)<at('앱 정보 · 배움과 보상'));
 assert.doesNotMatch(list,/<source|preload="(auto|metadata)"/);
 assert.match(list,/data-id="frog"[^>]*>(?:(?!<\/button>).)*preload="none"/s);
 assert.match(list,/data-id="warm-fur" data-value="settings" aria-disabled="true" data-why="5장/);
 assert.equal((list.match(/aria-disabled="true"/g)||[]).length,12);
 assert.match(settingsContent(s,{replaysOpen:true}),/class="settings-card concept-replays" open/);
});

test('player view offers webm before mp4, a poster, DOM caption and a way back to the list',()=>{
 const h=conceptView('warm-fur','settings');
 assert.ok(h.indexOf('warm-fur.webm')<h.indexOf('warm-fur.mp4'));
 assert.match(h,/<video class="concept-video" muted playsinline preload="metadata" poster="[^"]+warm-fur\.webp"/);
 assert.match(h,/class="concept-caption" role="status" aria-live="polite">몸에서는/);
 assert.match(h,/data-action="concept-back"/);assert.doesNotMatch(conceptView('frog'),/concept-end/);
 assert.equal(conceptView('nope'),'');assert.equal(replayItem('frog').kind,'motion');
});

function fakePlayer({reject=false,reduced=false}={}){
 const on=()=>{const map={};return {map,addEventListener(n,f){(map[n]??=[]).push(f);},removeEventListener(n,f){map[n]=(map[n]||[]).filter(x=>x!==f);},fire(n){(map[n]||[]).forEach(f=>f());}};};
 const el=()=>({hidden:false,textContent:'',focus(){this.focused=true;},...on()});
 const sources=[{...on(),removed:false,removeAttribute(){this.removed=true;}},{...on(),removed:false,removeAttribute(){this.removed=true;}}];
 const video={...on(),readyState:0,currentTime:0,ended:false,muted:false,hidden:false,calls:[],play(){this.calls.push('play');return reject?Promise.reject(new Error('blocked')):Promise.resolve();},pause(){this.calls.push('pause');},load(){this.calls.push('load');},removeAttribute(a){this.calls.push('remove:'+a);},querySelectorAll:()=>sources};
 const parts={'.concept-video':video,'.concept-caption':el(),'.concept-cues':{...el(),hidden:true},'.concept-status':{...el(),hidden:true},'.concept-end':{...el(),hidden:true,remove(){}},'[data-action="concept-play"]':{...el(),hidden:true},'[data-action="concept-replay"]':{...el(),hidden:true}};
 globalThis.matchMedia=()=>({matches:reduced});
 const playing=[];const player=createConceptPlayer({dataset:{concept:'warm-fur'},querySelector:q=>parts[q]},{onPlayingChange:v=>playing.push(v)});
 return {player,video,sources,parts,playing};
}

test('player starts muted after metadata, syncs the caption, and pins the last frame at the end',async()=>{
 const {player,video,parts}=fakePlayer();
 assert.equal(video.muted,true);video.readyState=1;video.fire('loadedmetadata');await Promise.resolve();
 assert.deepEqual(video.calls,['play']);
 video.currentTime=7;video.fire('timeupdate');assert.match(parts['.concept-caption'].textContent,/공기가 머물러서/);
 video.fire('ended');assert.equal(parts['.concept-end'].hidden,false);assert.equal(parts['[data-action="concept-replay"]'].hidden,false);assert.match(parts['.concept-caption'].textContent,/줄여 주는 거야/);
 player.replay();assert.equal(video.currentTime,0);assert.equal(parts['.concept-end'].hidden,true);
 player.destroy();assert.deepEqual(video.calls.slice(-3),['pause','remove:src','load']);
});

test('blocked autoplay and reduced motion show the play button instead of moving on their own',async()=>{
 const a=fakePlayer({reject:true});a.video.fire('loadedmetadata');await new Promise(r=>setTimeout(r));
 assert.equal(a.parts['[data-action="concept-play"]'].hidden,false);assert.equal(a.parts['[data-action="concept-play"]'].focused,true);a.player.destroy();
 const b=fakePlayer({reduced:true});b.video.fire('loadedmetadata');
 assert.deepEqual(b.video.calls,[]);assert.equal(b.parts['[data-action="concept-play"]'].hidden,false);b.player.destroy();
});

test('no metadata within 6 seconds (or a failed last source) shows the poster and every caption',()=>{
 mock.timers.enable({apis:['setTimeout']});
 try{
  const {video,sources,parts,player}=fakePlayer();mock.timers.tick(5999);assert.equal(parts['.concept-cues'].hidden,true);
  mock.timers.tick(1);assert.equal(parts['.concept-cues'].hidden,false);assert.equal(parts['.concept-caption'].hidden,true);assert.equal(video.hidden,true);
  assert.equal(parts['.concept-end'].hidden,false);assert.ok(sources.every(x=>x.removed));assert.ok(video.calls.includes('load'));player.destroy();
  const b=fakePlayer();b.sources[1].fire('error');assert.equal(b.parts['.concept-cues'].hidden,false);assert.equal(b.player.failed,true);b.player.destroy();
 }finally{mock.timers.reset();}
});
