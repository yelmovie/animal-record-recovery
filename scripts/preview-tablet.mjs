// Local-only responsive review fixtures. Excluded from the build manifest.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {campaignFixture} from '../tests/fixtures/campaign-state.mjs';
import {freshExpedition} from '../src/expedition.js';
import {campaignDraft,chooseCommission,claimCommission,missionRows,RETEST,runCommissionTrial} from '../src/campaign.js';
const root=process.cwd(),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.mp4':'video/mp4','.glb':'model/gltf-binary','.woff2':'font/woff2','.mp3':'audio/mpeg'};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname)),rel=path.relative(root,file);
 if(rel.startsWith('..')||path.isAbsolute(rel)||!['index.html','src','assets'].includes(rel.split(path.sep)[0])){res.writeHead(404);return res.end();}
 if(rel.replaceAll('\\','/').startsWith('assets/videos/')&&req.headers.referer?.includes('videoFail')){res.writeHead(404);return res.end('QA video failure');}
 let data=await readFile(file);
 if(rel==='index.html'){
  const state=url.searchParams.has('fresh')?freshExpedition():campaignFixture();state.adminUnlocked=true;state.introSeen=true;state.soundEnabled=false;
  if(url.searchParams.has('all'))for(let stage=1;stage<=5;stage++)for(let index=0;index<3;index++){
   const d=campaignDraft(state,stage,index);
   if(stage===2&&index===1)chooseCommission(state,stage,index,'criterion','six');
   if(stage===5&&index<2){const target=RETEST[state.records.designs[index].problem].target;for(const level of [1,target]){d.level=level;d.prediction='more';runCommissionTrial(state,stage,index);}chooseCommission(state,stage,index,'choice',String(target));chooseCommission(state,stage,index,'reason','fit');}
   else for(const r of missionRows(state,stage,index))chooseCommission(state,stage,index,r.key,r.answer);
   if(!claimCommission(state,stage,index).ok)throw Error(`Invalid review award ${stage}-${index}`);
  }
  state.stage=Number(url.searchParams.get('stage'))||1;state.step[state.stage]=Number(url.searchParams.get('step'))||0;
  if(['frog','crab','duck','rabbit'].includes(url.searchParams.get('animal')))state.activeAnimal=url.searchParams.get('animal');
  if(url.searchParams.has('creative')){
   state.studio={version:1,title:'날개 달린 우산',audience:'비 오는 날 걸어가는 친구',purpose:'나비처럼 넓은 날개가 우산을 들어 주면 두 손으로 가방을 잡을 수 있어. 바람이 불 때는 날개를 접을 수도 있어.',inspiration:'나비의 넓은 날개와 오리의 물갈퀴를 관찰하고 생각했어. 넓은 면을 접었다 펼 수 있도록 만들었어.',strokes:[{color:'#e69b24',width:8,points:[{x:120,y:100},{x:300,y:250},{x:600,y:140}]}]};
   state.studioRecord=structuredClone(state.studio);
  }
  if(url.searchParams.has('photos'))for(const id of ['frog','crab','duck','rabbit','butterfly','fish'])state.inquiry.motionPhotos[id]={dataURL:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0ioAAAAASUVORK5CYII=',width:320,height:180,time:1,duration:5};
  if(url.searchParams.has('long')&&state.studio){state.studio.purpose='넓은 면을 펼치고 접어 친구를 도와주는 발명이야. '.repeat(6);state.studioRecord=structuredClone(state.studio);}
  const fault=url.searchParams.get('fault'),raw=fault==='corrupt'?'{손상된 원본':fault==='future'?JSON.stringify({version:99,original:'미래 버전의 한글 기록'}):JSON.stringify(state);
  const failure=fault==='quota'?`const originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='animal-record-recovery:v1')throw new DOMException('Full','QuotaExceededError');return originalSet.call(this,k,v);};`:fault==='blocked'?`Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError');};`:'';
  data=data.toString().replace('<script type="module"',`<script>localStorage.setItem('animal-record-recovery:v1',${JSON.stringify(raw)});${failure}</script><script type="module"`);
 }
 if(rel.replaceAll('\\','/')==='src/adventure-app.js')data=data.toString()
  .replace("let screen='home'", "let screen=new URLSearchParams(location.search).get('screen')||'home'")
  .replace('let commissionIndex=0',"let commissionIndex=Math.min(2,Math.max(0,Number(new URLSearchParams(location.search).get('index'))||0))")
  .replace('focusIndex=0,clueIndex=0',"focusIndex=Math.min(2,Math.max(0,Number(new URLSearchParams(location.search).get('focus'))||0)),clueIndex=0")
  .replace('labSummary=false,focusIndex=',"labSummary=new URLSearchParams(location.search).has('summary'),focusIndex=");
 const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
 if(req.headers.range&&Buffer.isBuffer(data)){
  const match=req.headers.range.match(/^bytes=(\d+)-(\d*)$/),start=Number(match?.[1]),end=match?.[2]?Math.min(Number(match[2]),data.length-1):data.length-1;
  if(!match||!Number.isSafeInteger(start)||start>end||start>=data.length){res.writeHead(416,{'Content-Range':`bytes */${data.length}`});return res.end();}
  res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});return res.end(data.subarray(start,end+1));
 }
 res.writeHead(200,headers);res.end(data);
 }catch(e){res.writeHead(404);res.end(String(e));}
}).listen(Number(process.env.PORT)||4187,'127.0.0.1',()=>console.log(`Tablet review: http://127.0.0.1:${Number(process.env.PORT)||4187}`));
