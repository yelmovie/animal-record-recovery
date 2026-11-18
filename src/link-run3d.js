// Stage 3 「개구리의 생활」·「게의 생활」 in 3D: the animal walks along a path seen from the side and passes one of three
// gates in each row (사는 곳 → 몸의 특징 → 움직이는 방법). Gate labels are DOM pins, never text inside the scene.
// Which gate is right is decided by the app's existing rule through onChoose; movement lives in link-course.js.
// Painted backdrops, tiles and props (assets/relay) are laid over a plain canvas-drawn stage once they have downloaded.
import {T,texture,blobShadow} from './stage3d.js';
import {bindDirectionPad,mapKeyDirection} from './map-controls.js';
import {KEYS,LANES,HALF,OPEN,ROWS,FINISH,START,RUN_ART,rowOptions,passedRows,createRunner,stepRunner} from './link-course.js';
import {assetURL} from './assets.js';
import {SPRITES,FRAMES,FOOT,spriteName,spriteFrame,hopLift} from './relay-course.js';

// h: height in the world. foot: empty share under the feet.
const PICTURES={frog:{url:()=>assetURL('frog'),h:1.45,foot:.1},crab:{url:()=>assetURL('crab'),h:1.9,foot:.2}};
const WORLD={
 frog:{ground:'grass',backdrop:'backdrop-pond',fence:'hedge',sky:'#cfe7f3',side:'#7a5a3a'},
 crab:{ground:'mud',backdrop:'backdrop-coast',fence:'log',sky:'#cde6f4',side:'#6f5b40'},
};
const paintedURL=name=>new URL(`../assets/relay/${name}.webp`,import.meta.url).href;
const plantURL=name=>new URL(`../assets/generated/${name}-web.webp`,import.meta.url).href;
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function rng(seed){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const speckle=(base,dots,n=260,long=false)=>texture(128,(g,s)=>{const r=rng(base.length*97+n);g.fillStyle=base;g.fillRect(0,0,s,s);for(let i=0;i<n;i++){g.fillStyle=dots[i%dots.length];const x=r()*s,y=r()*s;g.fillRect(x,y,long?1.6:2+r()*2,long?4+r()*5:2+r()*2);}});

export function create(host,options){
  let o=options,dead=false,raf=0,last=0,clock=0;
  const animal=PICTURES[o.animal]?o.animal:'frog',world=WORLD[animal],p=PICTURES[animal];
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  const canvas=renderer.domElement,box=document.createElement('div'),pinLayer=document.createElement('div');
  box.className='link-run3d';pinLayer.className='link-run-pins';canvas.setAttribute('aria-hidden','true');box.append(canvas,pinLayer);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,160);
  scene.background=new T.Color(world.sky);scene.fog=new T.Fog(world.sky,30,70);
  scene.add(new T.HemisphereLight('#ffffff','#9fb38a',2.1));const sun=new T.DirectionalLight('#fff6de',1.5);sun.position.set(-5,12,9);scene.add(sun);
  const loader=new T.TextureLoader(),load=url=>{const t=loader.load(url,()=>request());t.colorSpace=T.SRGBColorSpace;return t;};
  const painted=(name,apply)=>{if(RUN_ART.includes(name))loader.load(paintedURL(name),t=>{if(dead){t.dispose();return;}t.colorSpace=T.SRGBColorSpace;apply(t);request();},undefined,()=>{});};
  const mats={},lambert=(key,opt)=>mats[key]??=new T.MeshLambertMaterial(opt);
  const tiles={grass:speckle('#86b657',['#6f9f45','#9bc76a','#7aab4d'],320,true),sand:speckle('#e2cf9f',['#d2bd89','#eddcb3']),mud:speckle('#9a8566',['#87724f','#ab977a','#7d6a4c']),hedge:speckle('#4f9143',['#3f7a3a','#63a852','#f2c94c','#e86a8a'],120)};
  const tiled={grass:[],sand:[],mud:[],hedge:[]};
  function wear(material,tile,w,d,unit=2.2){const map=tiles[tile].clone();map.needsUpdate=true;map.repeat.set(w/unit,d/unit);material.map=map;tiled[tile].push({material,w,d});return material;}
  for(const tile of Object.keys(tiled))painted('tile-'+tile,t=>{for(const {material,w,d} of tiled[tile]){const map=t.clone();map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.repeat.set(w/4.5,d/4.5);map.needsUpdate=true;material.map?.dispose();material.map=map;material.needsUpdate=true;}});
  const mesh=(geo,material,x,y,z)=>{const m=new T.Mesh(geo,material);m.position.set(x,y,z);scene.add(m);return m;};
  function slab(x0,x1,z0,z1,top,depth,tile,side=world.side){
    const cap=wear(new T.MeshLambertMaterial(),tile,x1-x0,z1-z0),wall=lambert('wall'+side,{color:side});
    return mesh(new T.BoxGeometry(x1-x0,depth,z1-z0),[wall,wall,cap,wall,wall,wall],(x0+x1)/2,top-depth/2,(z0+z1)/2);
  }
  const waters=[];
  function water(x0,x1,z0,z1,y,color,opacity=.75){
    const map=texture(128,(g,s)=>{g.fillStyle='#ffffff';g.fillRect(0,0,s,s);g.fillStyle='rgba(120,170,200,.35)';for(let i=0;i<9;i++){g.beginPath();g.ellipse((i*53)%s,(i*37)%s,14,3,0,0,7);g.fill();}});
    map.repeat.set((x1-x0)/3,(z1-z0)/3);const m=mesh(new T.PlaneGeometry(x1-x0,z1-z0),new T.MeshBasicMaterial({map,color,transparent:true,opacity,depthWrite:false}),(x0+x1)/2,y,(z0+z1)/2);m.rotation.x=-Math.PI/2;m.renderOrder=6;waters.push(map);return m;
  }
  const rand=rng(animal==='frog'?311:733);
  const props={pine:[],oak:[],bush:[],boulder:[],searock:[],kelp:[]};
  function prop(kind,x,y,z,h,shapes){props[kind].push({x,y,z,h,shapes});}
  for(const kind of Object.keys(props))painted('prop-'+kind,t=>{const ratio=t.image.width/t.image.height,material=new T.MeshBasicMaterial({map:t,alphaTest:.5,side:T.DoubleSide});
    for(const q of props[kind]){for(const s of q.shapes)s.visible=false;mesh(new T.PlaneGeometry(q.h*ratio,q.h).translate(0,q.h/2,0),material,q.x,q.y,q.z);}});
  function tree(x,z,s=1){const kind=rand()<.55?'pine':'oak',shapes=[mesh(new T.CylinderGeometry(.16*s,.22*s,1.3*s,7),lambert('trunk',{color:'#7b5a3c'}),x,.65*s,z)];
    if(kind==='pine')for(const [r,y] of [[1,1.7],[.78,2.4],[.52,3]])shapes.push(mesh(new T.ConeGeometry(r*s,1.25*s,8),lambert('pine',{color:'#3f7f45'}),x,y*s,z));
    else shapes.push(mesh(new T.IcosahedronGeometry(1.15*s,1),lambert('oak',{color:'#5c9d4a',flatShading:true}),x,2.2*s,z));
    prop(kind,x,0,z,(kind==='pine'?3.9:3.3)*s,shapes);}
  function bush(x,z,s){const m=mesh(new T.IcosahedronGeometry(s,1),lambert('bush',{color:'#5a9a4c',flatShading:true}),x,.2,z);m.scale.y=.7;prop('bush',x,0,z,s*1.5,[m]);}
  function rock(kind,x,y,z,s){const m=mesh(new T.IcosahedronGeometry(s,0),lambert('rock',{color:'#9a968c',flatShading:true}),x,y+s*.45,z);m.scale.set(1,.75,1);m.rotation.y=rand()*3;prop(kind,x,y-.05,z,s*1.7,[m]);}
  const reedMat=new T.MeshLambertMaterial({map:load(plantURL('reed')),side:T.DoubleSide,alphaTest:.45}),lilyMat=new T.MeshLambertMaterial({map:load(plantURL('lotus_leaf')),alphaTest:.45,side:T.DoubleSide});
  function reeds(x,y,z,s){const geo=new T.PlaneGeometry(1,1.45).translate(0,.7,0);for(const a of [.5,-.6]){const m=mesh(geo,reedMat,x,y,z);m.rotation.y=a;m.scale.setScalar(s);}}
  function lily(x,y,z,s){const m=mesh(new T.PlaneGeometry(s,s),lilyMat,x,y+.03,z);m.rotation.set(-Math.PI/2,0,rand()*6);m.renderOrder=7;}

  // The ground: a path between a far bank and a near edge, running past the finish so the screen never ends.
  const X0=START-30,X1=FINISH+30,BACK=-HALF-12,FRONT=HALF+8;
  slab(X0,X1,-HALF-.6,HALF+.6,0,6,world.ground);
  if(animal==='frog'){
    // Far side: the pond the frog lives by. Near side: a strip of meadow.
    slab(X0,X1,BACK,-HALF-3.6,0,6,'grass');mesh(new T.BoxGeometry(X1-X0,.2,3),lambert('pondbed',{color:'#6f8f84'}),(X0+X1)/2,-1.1,-HALF-2.1);water(X0,X1,-HALF-3.6,-HALF-.6,-.2,'#5fb7d6');
    for(let x=X0+1;x<X1;x+=2.2){if(rand()<.55)lily(x+rand(),-.2,-HALF-1.4-rand()*1.6,.9+rand()*.4);if(rand()<.45)reeds(x+rand(),-.25,-HALF-.75,.9+rand()*.4);}
    slab(X0,X1,HALF+.6,FRONT,0,6,'grass');
    for(let i=0;i<26;i++){const x=X0+2+rand()*(X1-X0-4);tree(x,-HALF-4.6-rand()*6,1+rand()*.7);if(i%2)bush(X0+2+rand()*(X1-X0-4),HALF+1.8+rand()*3.5,.5+rand()*.35);}
  }else{
    // Far side: dry mudflat with boulders. Near side: shallow sea water with rocks and kelp.
    slab(X0,X1,BACK,-HALF-.6,0,6,'mud');slab(X0,X1,HALF+.6,FRONT,-1.4,5,'sand','#5f86a0');water(X0,X1,HALF+.6,FRONT,-.18,'#3f93cc',.72);
    for(let i=0;i<22;i++){const x=X0+2+rand()*(X1-X0-4);rock('boulder',x,0,-HALF-1.6-rand()*7,.35+rand()*.5);if(i%2){rock('searock',X0+2+rand()*(X1-X0-4),-.5,HALF+2+rand()*3,.5+rand()*.3);}if(i%3===0)prop('kelp',X0+2+rand()*(X1-X0-4),-1.4,HALF+1.4+rand()*3,1.5,[]);}
    for(let i=0;i<10;i++)mesh(new T.CircleGeometry(.5+rand()*.4,14),lambert('pool',{color:'#7fb9cf'}),X0+2+rand()*(X1-X0-4),.012,-HALF-1.2-rand()*5).rotation.x=-Math.PI/2;
  }
  // Three light trails, one to each gate, so the choice reads as three ways to go.
  for(const c of LANES){const m=mesh(new T.PlaneGeometry(X1-X0,1.5),wear(new T.MeshLambertMaterial({transparent:true,opacity:.92}),'sand',X1-X0,1.5),(X0+X1)/2,.012,c);m.rotation.x=-Math.PI/2;m.renderOrder=1;}
  // Path edges: low logs along both sides.
  for(const z of [-HALF-.35,HALF+.35])mesh(new T.BoxGeometry(X1-X0,.22,.24),lambert('log',{color:'#8d6a44'}),(X0+X1)/2,.11,z);
  // One painted backdrop behind everything, mirrored on wide screens.
  const plain=[];for(let i=0;i<6;i++){const hill=mesh(new T.SphereGeometry(10+rand()*4,14,8),lambert('hill',{color:'#9cc77a'}),X0+12+i*16,-4.5,-28-rand()*4);hill.scale.y=.7;plain.push(hill);}
  let backdrop=null;
  painted(world.backdrop,t=>{const map=Object.assign(t.clone(),{wrapS:T.MirroredRepeatWrapping,needsUpdate:true});map.repeat.x=1.6;map.offset.x=-.3;backdrop=mesh(new T.PlaneGeometry(96,21.6),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,fog:false}),0,.2,-36);backdrop.renderOrder=-5;for(const h of plain)h.visible=false;
    const c=document.createElement('canvas');c.width=c.height=1;const g=c.getContext('2d');g.drawImage(t.image,0,0,t.image.width,6,0,0,1,1);const [r,gg,b]=g.getImageData(0,0,1,1).data;scene.background=new T.Color(`rgb(${r},${gg},${b})`);});

  // Gate rows. Each lane has a wooden gate; hedges (frog) or driftwood fences (crab) fill the rest of the row.
  const wood=lambert('gatewood',{color:'#9a7044'}),fenceMat=world.fence==='hedge'?wear(new T.MeshLambertMaterial(),'hedge',6,1,1.2):lambert('drift',{color:'#8d7458'});
  const shutMat=lambert('shut',{color:'#6d5235'}),wrongMat=lambert('wrong',{color:'#c2643a'}),glow=new T.MeshBasicMaterial({color:'#ffe27a',transparent:true,opacity:.55,depthWrite:false});
  const gates=ROWS.map(x=>{
    const cuts=[-HALF-.6,...LANES.flatMap(c=>[c-OPEN,c+OPEN]),HALF+.6];
    for(let i=0;i<cuts.length;i+=2){const z0=cuts[i],z1=cuts[i+1];if(z1-z0<.05)continue;const h=world.fence==='hedge'?.95:.7,m=mesh(new T.BoxGeometry(.7,h,z1-z0),fenceMat,x,h/2,(z0+z1)/2);if(world.fence!=='hedge'){m.scale.x=.5;}}
    return LANES.map(c=>{
      for(const dz of [-OPEN,OPEN])mesh(new T.BoxGeometry(.22,1.7,.22),wood,x,.85,c+dz);
      mesh(new T.BoxGeometry(.24,.2,OPEN*2+.3),wood,x,1.72,c);
      // A board drops into a gate that is not the way on; a soft light marks the gate that was right.
      const shut=mesh(new T.BoxGeometry(.18,.9,OPEN*2-.1),shutMat,x,.6,c);shut.visible=false;
      const ring=mesh(new T.RingGeometry(.55,.85,28),glow,x+.6,.03,c);ring.rotation.x=-Math.PI/2;ring.renderOrder=7;ring.visible=false;
      return {shut,ring,x,z:c,flash:0};
    });
  });
  // The finish: a garden arch behind the path after the last row.
  {const x=FINISH+.5,z=-HALF-1.2,posts=[-1.4,1.4].map(dx=>mesh(new T.CylinderGeometry(.13,.15,3,8),wood,x+dx,1.5,z)),top=mesh(new T.TorusGeometry(1.4,.2,8,20,Math.PI),lambert('garland',{color:'#58a55a'}),x,3,z);
    painted('prop-arch',t=>{for(const s of [...posts,top])s.visible=false;mesh(new T.PlaneGeometry(4.4,4.4).translate(0,2.2,0),new T.MeshBasicMaterial({map:t,alphaTest:.5,side:T.DoubleSide}),x,0,z);});}

  // Labels over the gates of the row ahead (DOM, so Korean text stays sharp and readable).
  const pins=[];
  function setPins(){
    pinLayer.replaceChildren();pins.length=0;
    const row=runner.passed;
    ROWS.forEach((x,r)=>rowOptions(animal,r).forEach((option,lane)=>{
      // Only the row ahead is labelled; what was chosen in earlier rows is shown in the slots above the path.
      if(r!==row)return;
      const el=document.createElement('span');el.className='link-run-pin';el.textContent=option.label;pinLayer.append(el);
      // The label hangs on its own gate (never over the trail in front, where the animal stands).
      pins.push({el,pos:new T.Vector3(x+.35,1.35,LANES[lane])});
    }));
    paintGates();
  }
  function paintGates(){gates.forEach((row,r)=>row.forEach((g,lane)=>{const right=r<runner.passed&&o.links[KEYS[r]]===rowOptions(animal,r)[lane].value;g.shut.visible=r<runner.passed&&!right;g.ring.visible=right;}));}
  const v3=new T.Vector3();
  function drawPins(){const w=canvas.clientWidth,h=canvas.clientHeight;for(const q of pins){v3.copy(q.pos).project(camera);q.el.style.transform=`translate(${(v3.x+1)/2*w}px,${(1-v3.y)/2*h}px) translate(-50%,-100%)`;const x=(v3.x+1)/2*w;q.el.hidden=v3.z>1||x<60||x>w-60;}}

  // The animal.
  const runner=box.linkRunner=createRunner(passedRows(animal,o.links));
  const map=Object.assign(load(p.url()),{wrapS:T.RepeatWrapping}),sprite=new T.Sprite(new T.SpriteMaterial({map,transparent:true,alphaTest:.35}));sprite.center.set(.5,p.foot);sprite.renderOrder=4;scene.add(sprite);
  const shadow=blobShadow(.6,.3);scene.add(shadow);
  const marker=mesh(new T.RingGeometry(.62,.74,28),new T.MeshBasicMaterial({color:'#fffbe6',transparent:true,opacity:.75,depthWrite:false}),0,.04,0);marker.rotation.x=-Math.PI/2;marker.renderOrder=7;
  // The four-frame motion strip (shared with the relay) replaces the picture once it has downloaded; this path keeps
  // the animals a little smaller than the relay does.
  let sheet=null;const shrink=animal==='crab'?.83:.97;
  painted(spriteName(animal),s=>{s.wrapS=T.RepeatWrapping;sheet=s;sprite.material.map=s;sprite.material.needsUpdate=true;sprite.center.set(.5,FOOT);map.dispose();});
  function pose(){
    const still=reduced(),t=clock,sh=sheet?SPRITES[animal]:null,h=sh?sh.h*shrink:p.h,w=sh?h*sh.aspect:p.h*(p.w||1);let y=0,turn=0;
    // The frog hops (legs folded → push → stretched → landing); the crab walks to the side with small steps.
    if(runner.moving&&!still){if(animal==='frog'){if(sh)y=hopLift(t,.38);else{const k=Math.abs(Math.sin(t*7));y=k*.38;turn=-runner.face*Math.cos(t*7)*.12;}}else{y=Math.abs(Math.sin(t*15))*(sh?.03:.05);turn=Math.sin(t*15)*(sh?.02:.05);}}
    const face=animal==='crab'?1:runner.face,n=sh?FRAMES:1,frame=sh&&!still?spriteFrame(animal,{kind:animal==='frog'?'jump':'walk',moving:runner.moving},t):0,m=sprite.material.map;
    m.repeat.set(face/n,1);m.offset.set((frame+(face<0?1:0))/n,0);
    sprite.scale.set(w,h,1);sprite.material.rotation=turn;sprite.position.set(runner.x,y,runner.z);
    marker.position.set(runner.x,.04,runner.z);shadow.position.set(runner.x,.03,runner.z);shadow.material.opacity=.3*(1-y);
  }
  const view={x:0};
  function place(dt){const goal=Math.max(START+2,Math.min(FINISH-2,runner.x+2.2)),k=reduced()?1:Math.min(1,dt*4);view.x+=(goal-view.x)*k;camera.position.set(view.x+.4,9.2,16.5);camera.lookAt(view.x+.9,1.3,0);if(backdrop)backdrop.position.x=view.x;}

  // Input: the on-screen pad first, the keyboard beside it.
  // Input: the on-screen pad first, the keyboard beside it. A short tap (a child tapping an arrow, or a quick key press)
  // still walks one clear step: every press keeps its direction for at least STEP_MS before it is let go.
  const STEP_MS=420,held=new Map(),running=()=>!dead&&!document.hidden&&!document.querySelector('#dialog')?.open&&!runner.ended&&!o.paused;
  const now=()=>performance.now();
  const press=(source,dir)=>{held.set(source,{dir,since:now(),until:0});request();};
  const letGo=source=>{const h=held.get(source);if(h)h.until=h.since+STEP_MS;};
  const release=()=>held.clear();
  const root=document.querySelector('#app')||document.body,abort=new AbortController(),on=(target,type,fn)=>target.addEventListener(type,fn,{signal:abort.signal});
  const pad=bindDirectionPad(root,'[data-run-dir]',b=>b.dataset.runDir,{press:d=>press('pad',d),release:()=>letGo('pad'),cancel:()=>letGo('pad'),tap:d=>{press('pad',d);letGo('pad');},blocked:()=>!running()});
  const typing=e=>e.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
  on(document,'keydown',e=>{if(!running()||typing(e)||e.ctrlKey||e.altKey||e.metaKey)return;const d=mapKeyDirection(e);if(!d)return;e.preventDefault();const key='key:'+(e.code||e.key),h=held.get(key);if(!h||h.until)press(key,d);});
  on(document,'keyup',e=>{if(mapKeyDirection(e))letGo('key:'+(e.code||e.key));});
  on(window,'blur',release);on(document,'visibilitychange',()=>{release();if(!document.hidden)request();});
  const input=()=>{const t=now(),d=new Set();for(const [k,h] of held){if(h.until&&t>=h.until){held.delete(k);continue;}d.add(h.dir);}return {x:(d.has('right')?1:0)-(d.has('left')?1:0),z:(d.has('down')?1:0)-(d.has('up')?1:0)};};
  function choose(row,lane){
    const ok=!!o.onChoose?.(row,lane);
    if(!ok){const g=gates[row][lane];g.flash=1;release();pad.clear();}
    return ok;
  }
  function frame(now){
    raf=0;if(dead||document.hidden)return;const dt=Math.min(.05,last?(now-last)/1000:0);last=now;clock+=dt;
    if(running()){const before=runner.passed,out=stepRunner(runner,dt,input(),choose);if(runner.passed!==before)setPins();if(out.end)o.onEnd?.();}
    // A wrong gate shows a red board for a moment, then goes back to how the row looks.
    for(const row of gates)for(const g of row)if(g.flash>0){g.flash=Math.max(0,g.flash-dt*1.4);g.shut.visible=true;g.shut.material=g.flash>0?wrongMat:shutMat;if(!g.flash)paintGates();}
    if(!reduced())for(const m of waters)m.offset.x=(clock*.04)%1;
    place(dt);pose();renderer.render(scene,camera);drawPins();request();
  }
  function request(){if(!raf&&!dead&&!document.hidden)raf=requestAnimationFrame(frame);}
  let size='';
  function resize(){const w=box.clientWidth,h=box.clientHeight;if(!w||!h||size===w+'x'+h)return;size=w+'x'+h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1.25?46:36;camera.updateProjectionMatrix();place(0);pose();renderer.render(scene,camera);drawPins();request();}
  const ro=new ResizeObserver(resize);ro.observe(box);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!dead)o.onFail?.(new Error('context lost'));});
  function update(next){o=next;const passed=passedRows(animal,o.links);if(passed>runner.passed){runner.passed=passed;runner.back=ROWS[passed-1]+.6;if(runner.x<runner.back)runner.x=runner.back;}setPins();request();}
  view.x=Math.max(START+2,runner.x+2.2);host.append(box);setPins();resize();request();
  return {
    attach(h,next){if(box.parentNode!==h)h.append(box);resize();update(next);},
    destroy(){dead=true;cancelAnimationFrame(raf);ro.disconnect();abort.abort();pad.destroy();
      scene.traverse(x=>{x.geometry?.dispose();for(const m of [].concat(x.material||[])){m.map?.dispose();m.dispose();}});for(const t of Object.values(tiles))t.dispose();
      renderer.dispose();renderer.forceContextLoss();box.remove();}
  };
}
