// Local-only asset review; never included in the application build.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=String.raw`<!doctype html><html lang="ko"><meta charset="utf-8"><title>새 동물 모델 검수</title>
<style>body{margin:0;font:18px sans-serif;background:#f5f3e9;color:#243c30}header{padding:16px;display:flex;gap:12px;align-items:center}button,select{font:inherit;padding:10px}#stage{height:620px;position:relative;background:#e9ecd9}.stage3d{position:absolute;inset:0}.stage3d canvas{width:100%;height:100%;display:block}.pin-layer{display:none}output{display:block;padding:14px}#info{white-space:pre-wrap}</style>
<header><b>새 동물 모델 검수</b><select id="animal" aria-label="동물"><option value="frog">개구리</option><option value="crab">게</option><option value="rabbit">토끼</option><option value="marine">물고기</option><option value="duck">오리</option><option value="camel">낙타</option><option value="penguin">펭귄</option><option value="butterfly">나비</option></select><button id="home">전신</button><button id="front">오른쪽 회전</button><button id="side">왼쪽 회전</button><button id="back">반 바퀴 회전</button><button id="eye">눈 / 귀</button><button id="leg">다리</button></header><div id="stage"></div><output id="info">불러오는 중</output><output id="pick">표본을 누르면 좌표와 관찰 부위가 표시돼.</output>
<script type="module">
import {create} from '/src/scanner3d.js';
import {loadAnimal} from '/src/scanner3d.js';
import {T,createStage} from '/src/stage3d.js';
let viewer,asset,id='frog',focus=0;
const names={duck:['부리','몸 표면','발'],frog:['눈','뒷다리','몸 표면'],crab:['눈','다리','몸 표면'],rabbit:['귀','몸 표면','뒷다리'],marine:['몸','지느러미','꼬리']};
function options(){return{animal:id,parts:names[id],found:[],pinned:[],focus,onPick(i){document.querySelector('#pick').textContent='선택된 부위: '+names[id][i];},onMiss(h){document.querySelector('#pick').textContent=h;},onFail(e){document.querySelector('#info').textContent='ERROR '+e.message;}};}
// The fish uses the dome, which also verifies its new model in the actual environment.
async function show(){viewer?.destroy();document.querySelector('#stage').replaceChildren();id=document.querySelector('#animal').value;focus=0;
 if(id==='butterfly'&&location.search.includes('detail')){viewer=createStage(document.querySelector('#stage'),{target:[0,.8,0],theta:.8,phi:1.1,radius:5.8,minR:2,maxR:10,minPhi:.1,maxPhi:3.04,pickables:()=>[],label:'나비 단독 입체 검수'});viewer.scene.add(new T.HemisphereLight(0xffffff,0x8b8877,2));const light=new T.DirectionalLight(0xffffff,2.2);light.position.set(3,5,4);viewer.scene.add(light);viewer.scene.add(await loadAnimal(id));viewer.request();}else if(['marine','camel','penguin','butterfly'].includes(id)){const {create}=await import('/src/dome3d.js');viewer=create(document.querySelector('#stage'),{zones:['forest','pond','coast','dry','cold'],names:{forest:'숲과 들',pond:'연못과 물가',coast:'바다와 갯벌',dry:'건조한 곳',cold:'추운 곳'},targets:[{id,animal:id,habitat:{marine:'coast',camel:'dry',penguin:'cold',butterfly:'forest'}[id],name:id,found:false}],extras:[],active:{marine:'coast',camel:'dry',penguin:'cold',butterfly:'forest'}[id],onFind(){},onLook(){}});}else viewer=create(document.querySelector('#stage'),options());
 asset=await loadAnimal(id);const bounds=new T.Box3().setFromObject(asset),size=bounds.getSize(new T.Vector3());let tris=0,maps=[];asset.traverse(m=>{if(m.geometry)tris+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;for(const mat of [].concat(m.material||[]))for(const k of ['map','normalMap','roughnessMap'])if(mat[k])maps.push(k+': '+mat[k].image.width+'×'+mat[k].image.height);});document.querySelector('#info').textContent=id+' | '+Math.round(tris).toLocaleString()+' triangles | '+size.toArray().map(v=>v.toFixed(2)).join(' × ')+'\n'+maps.join(' / ');
}
document.querySelector('#animal').onchange=show;document.querySelector('#home').onclick=()=>viewer.reset?.();
document.querySelector('#eye').onclick=()=>{focus=0;viewer.attach(document.querySelector('#stage'),options());};document.querySelector('#leg').onclick=()=>{focus=id==='rabbit'?2:1;viewer.attach(document.querySelector('#stage'),options());};
// Orbit controls use normal keyboard input on the canvas, never internal app state.
for(const [button,key] of [['front','ArrowRight'],['side','ArrowLeft'],['back','ArrowRight']])document.querySelector('#'+button).onclick=()=>{const canvas=document.querySelector('canvas');for(let n=0;n<(button==='back'?12:3);n++)canvas.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));};
if(location.search.includes('detail'))document.querySelector('#animal').value='butterfly';show();</script></html>`;
http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}
 const file=path.resolve(root,'.'+decodeURIComponent(pathname)),rel=path.relative(root,file);if(rel.startsWith('..')||path.isAbsolute(rel)||!['src','assets'].includes(rel.split(path.sep)[0]))throw new Error('not found');
 res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.glb':'model/gltf-binary','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file));
}catch{res.writeHead(404);res.end();}}).listen(Number(process.env.PORT)||4180,'127.0.0.1',()=>console.log('Model review: http://127.0.0.1:'+(process.env.PORT||4180)+'/?pick-debug'));
