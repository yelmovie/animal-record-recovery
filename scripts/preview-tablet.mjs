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
  data=data.toString().replace('<script type="module"',`<script>localStorage.setItem('animal-record-recovery:v1',${JSON.stringify(JSON.stringify(state))});</script><script type="module"`);
 }
 if(rel.replaceAll('\\','/')==='src/adventure-app.js')data=data.toString().replace("let screen='home'", "let screen=new URLSearchParams(location.search).get('screen')||'home'");
 const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
 if(req.headers.range&&Buffer.isBuffer(data)){
  const match=req.headers.range.match(/^bytes=(\d+)-(\d*)$/),start=Number(match?.[1]),end=match?.[2]?Math.min(Number(match[2]),data.length-1):data.length-1;
  if(!match||!Number.isSafeInteger(start)||start>end||start>=data.length){res.writeHead(416,{'Content-Range':`bytes */${data.length}`});return res.end();}
  res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});return res.end(data.subarray(start,end+1));
 }
 res.writeHead(200,headers);res.end(data);
 }catch(e){res.writeHead(404);res.end(String(e));}
}).listen(4187,'127.0.0.1',()=>console.log('Tablet review: http://127.0.0.1:4187'));
