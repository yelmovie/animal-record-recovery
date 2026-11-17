// Optional relay stage (stage 3). One animal crosses a one-way path seen from the side; the learner never turns the camera.
// The stage is boxes and flat planes; animals are the stage-3 pictures stood upright. Painted backdrops, ground tiles
// and props (assets/relay) are laid over a plain canvas-drawn version once they have downloaded, so a slow or failed
// download still leaves a complete stage. Rules and movement live in relay.js / relay-course.js.
import {T,texture,blobShadow} from './stage3d.js';
import {bindDirectionPad,mapKeyDirection} from './map-controls.js';
import {TRACK,ORDER,PADS,LANE,WATER_Y,RELAY_ART,groundTop,blockersOf,createRunner,beginSection,stepRunner} from './relay-course.js';
import {relayKind} from './relay.js';
import {assetURL} from './assets.js';
import {artURL} from './presentation.js';

// h: height in the world. foot: empty share under the feet. sink: share of the height under water while swimming.
// flip: the picture faces left. top: a picture seen from above (turned toward the way it flies). under: swims below the surface.
const PICTURES={
 rabbit:{url:()=>assetURL('rabbit'),h:1.75,foot:.08},
 frog:{url:()=>assetURL('frog'),h:1.5,foot:.1,sink:.26},
 duck:{url:()=>artURL('duck'),h:1.9,w:880/944,foot:.03,sink:.25,flip:true},
 butterfly:{url:()=>artURL('butterfly'),h:1.05,w:1.5,top:true},
 crab:{url:()=>assetURL('crab'),h:2.3,foot:.2},
 marine:{url:()=>assetURL('marine'),h:2.5,under:true},
};
const plantURL=name=>new URL(`../assets/generated/${name}-web.webp`,import.meta.url).href;
const paintedURL=name=>new URL(`../assets/relay/${name}.webp`,import.meta.url).href;
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function rng(seed){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
// Speckled surface: a base colour with darker and lighter flecks (grass blades, sand grains, mud).
const speckle=(base,dots,n=260,long=false)=>texture(128,(g,s)=>{const r=rng(base.length*97+n);g.fillStyle=base;g.fillRect(0,0,s,s);for(let i=0;i<n;i++){g.fillStyle=dots[i%dots.length];const x=r()*s,y=r()*s;g.fillRect(x,y,long?1.6:2+r()*2,long?4+r()*5:2+r()*2);}});
export function warm(){for(const url of [...Object.values(PICTURES).map(p=>p.url()),...RELAY_ART.map(paintedURL)]){const i=new Image();i.decoding='async';i.src=url;}}

export function create(host,options){
  let o=options,dead=false,raf=0,last=0,token=null,animal='',clock=0;
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  const canvas=renderer.domElement,box=document.createElement('div');box.className='relay3d';canvas.setAttribute('aria-label','이어달리기 길');canvas.setAttribute('role','img');box.append(canvas);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,160);
  scene.background=new T.Color('#cfeaf6');scene.fog=new T.Fog('#d6ecf2',34,82);
  // Bright enough that a painted ground tile keeps the colours it was painted with.
  scene.add(new T.HemisphereLight('#ffffff','#9fb38a',2.1));const sun=new T.DirectionalLight('#fff6de',1.5);sun.position.set(-5,12,9);scene.add(sun);
  const loader=new T.TextureLoader(),load=url=>{const t=loader.load(url,()=>request());t.colorSpace=T.SRGBColorSpace;return t;};
  // Painted art replaces its plain stand-in only when it has arrived; names not shipped are never requested.
  const painted=(name,apply)=>{if(RELAY_ART.includes(name))loader.load(paintedURL(name),t=>{if(dead){t.dispose();return;}t.colorSpace=T.SRGBColorSpace;apply(t);request();},undefined,()=>{});};
  const mats={},lambert=(key,opt)=>mats[key]??=new T.MeshLambertMaterial(opt);
  const tiles={grass:speckle('#86b657',['#6f9f45','#9bc76a','#7aab4d'],320,true),sand:speckle('#e2cf9f',['#d2bd89','#eddcb3']),mud:speckle('#9a8566',['#87724f','#ab977a','#7d6a4c']),hedge:speckle('#4f9143',['#3f7a3a','#63a852','#f2c94c','#e86a8a'],120)};
  // Every surface that wears a tile, with its size, so a painted tile can be laid at the same scale later.
  const tiled={grass:[],sand:[],mud:[],hedge:[]};
  function wear(material,tile,w,d,unit=2.2){const map=tiles[tile].clone();map.needsUpdate=true;map.repeat.set(w/unit,d/unit);material.map=map;tiled[tile].push({material,w,d});return material;}
  for(const tile of Object.keys(tiled))painted('tile-'+tile,t=>{for(const {material,w,d} of tiled[tile]){const map=t.clone();map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.repeat.set(w/4.5,d/4.5);map.needsUpdate=true;material.map?.dispose();material.map=map;material.needsUpdate=true;}});
  // A box whose top carries a repeating tile; x0..x1 along the path, z0..z1 across it.
  function slab(x0,x1,z0,z1,top,depth,tile,side='#8a6a48'){
    const cap=wear(new T.MeshLambertMaterial(),tile,x1-x0,z1-z0),wall=lambert('wall'+side,{color:side});
    const m=new T.Mesh(new T.BoxGeometry(x1-x0,depth,z1-z0),[wall,wall,cap,wall,wall,wall]);m.position.set((x0+x1)/2,top-depth/2,(z0+z1)/2);scene.add(m);return m;
  }
  const mesh=(geo,material,x,y,z)=>{const m=new T.Mesh(geo,material);m.position.set(x,y,z);scene.add(m);return m;};
  const BACK=-LANE-10,FRONT=LANE+7,EDGE=LANE+.55;
  const waters=[];
  function water(x0,x1,z0,z1,y,color,opacity=.74){
    const map=texture(128,(g,s)=>{g.fillStyle='#ffffff';g.fillRect(0,0,s,s);g.fillStyle='rgba(120,170,200,.35)';for(let i=0;i<9;i++){g.beginPath();g.ellipse((i*53)%s,(i*37)%s,14,3,0,0,7);g.fill();}});
    map.repeat.set((x1-x0)/3,(z1-z0)/3);
    // Drawn after the animal, so the part of a swimmer below the surface shows through the water.
    const m=mesh(new T.PlaneGeometry(x1-x0,z1-z0),new T.MeshBasicMaterial({map,color,transparent:true,opacity,depthWrite:false}),(x0+x1)/2,y,(z0+z1)/2);m.rotation.x=-Math.PI/2;m.renderOrder=6;waters.push(map);return m;
  }
  const rand=rng(20261117);
  // Props start as simple shapes; a painted cut-out standing upright takes their place when it has loaded.
  // The camera never turns, so an upright picture facing the viewer is enough.
  const props={pine:[],oak:[],bush:[],boulder:[],searock:[],kelp:[]};
  function prop(kind,x,y,z,h,shapes){props[kind].push({x,y,z,h,shapes});return shapes;}
  for(const kind of Object.keys(props))painted('prop-'+kind,t=>{
    const ratio=t.image.width/t.image.height,material=new T.MeshBasicMaterial({map:t,alphaTest:.5,side:T.DoubleSide});
    for(const p of props[kind]){for(const s of p.shapes)s.visible=false;const geo=new T.PlaneGeometry(p.h*ratio,p.h).translate(0,p.h/2,0);mesh(geo,material,p.x,p.y,p.z);}});
  function tree(x,z,s=1){const kind=rand()<.6?'pine':'oak',shapes=[mesh(new T.CylinderGeometry(.16*s,.22*s,1.3*s,7),lambert('trunk',{color:'#7b5a3c'}),x,.65*s,z)];
    if(kind==='pine')for(const [r,y] of [[1,1.7],[.78,2.4],[.52,3]])shapes.push(mesh(new T.ConeGeometry(r*s,1.25*s,8),lambert('pine',{color:'#3f7f45'}),x,y*s,z));
    else shapes.push(mesh(new T.IcosahedronGeometry(1.15*s,1),lambert('oak',{color:'#5c9d4a',flatShading:true}),x,2.2*s,z));
    prop(kind,x,0,z,(kind==='pine'?3.9:3.3)*s,shapes);}
  function bush(x,y,z,s){const m=mesh(new T.IcosahedronGeometry(s,1),lambert('bush',{color:'#5a9a4c',flatShading:true}),x,y,z);m.scale.y=.7;prop('bush',x,y-.2,z,s*1.5,[m]);}
  function rock(kind,x,y,z,s){const m=mesh(new T.IcosahedronGeometry(s,0),lambert('rock',{color:'#9a968c',flatShading:true}),x,y+s*.45,z);m.scale.set(1,.75,1);m.rotation.y=rand()*3;prop(kind,x,y-.05,z,s*1.7,[m]);return m;}
  const reedMat=new T.MeshLambertMaterial({map:load(plantURL('reed')),side:T.DoubleSide,alphaTest:.45}),lilyMat=new T.MeshLambertMaterial({map:load(plantURL('lotus_leaf')),alphaTest:.45,side:T.DoubleSide});
  function reeds(x,z,s){const geo=new T.PlaneGeometry(1,1.45).translate(0,.7,0);for(const a of [.5,-.6]){const m=mesh(geo,reedMat,x,WATER_Y-.05,z);m.rotation.y=a;m.scale.setScalar(s);}}
  function lily(x,z,s){const m=mesh(new T.PlaneGeometry(s,s),lilyMat,x,WATER_Y+.03,z);m.rotation.set(-Math.PI/2,0,rand()*6);m.renderOrder=7;}

  // Rest pads: a sandy path with a pale ring where the next animal sets off.
  PADS.forEach(([a,b],i)=>{slab(a,b,BACK,FRONT,0,7,'sand','#b9a37c');const ring=mesh(new T.RingGeometry(.9,1.15,28),new T.MeshBasicMaterial({color:'#fffbe6',transparent:true,opacity:.8,depthWrite:false}),(a+b)/2,.02,0);ring.rotation.x=-Math.PI/2;
    tree(a+1.2,-LANE-2.5,1.2);tree(b-1.4,-LANE-5,1.5);
    // The finish: a garden arch standing behind the last pad (a flat picture would vanish if it spanned the path edge-on).
    if(i===PADS.length-1){const x=a+3,z=-LANE-1,posts=[-1.5,1.5].map(dx=>mesh(new T.CylinderGeometry(.13,.15,3,8),lambert('trunk',{color:'#7b5a3c'}),x+dx,1.5,z)),top=mesh(new T.TorusGeometry(1.5,.2,8,20,Math.PI),lambert('garland',{color:'#58a55a'}),x,3,z);
      painted('prop-arch',t=>{for(const s of [...posts,top])s.visible=false;mesh(new T.PlaneGeometry(4.6,4.6).translate(0,2.3,0),new T.MeshBasicMaterial({map:t,alphaTest:.5,side:T.DoubleSide}),x,0,z);});}});
  // Meadow before the start and after the finish, so the world never ends at the edge of the screen.
  for(const [a,b] of [[PADS[0][0]-34,PADS[0][0]],[PADS.at(-1)[1],PADS.at(-1)[1]+34]]){slab(a,b,BACK,FRONT,0,7,'grass');for(let i=0;i<7;i++){tree(a+2+rand()*(b-a-4),-LANE-1.5-rand()*6,1+rand()*.7);bush(a+2+rand()*(b-a-4),.2,-LANE+rand()*(LANE*2+4),.5+rand()*.4);}}
  // 1 Forest and field: grass blocks with stream gaps and one rock ledge.
  {const t=TRACK.forest;for(const [a,b] of t.ground){slab(a,b,BACK,FRONT,0,7,'grass');for(const z of [-EDGE,EDGE])mesh(new T.BoxGeometry(b-a-.3,.22,.24),lambert('log',{color:'#8d6a44'}),(a+b)/2,.11,z);}
   mesh(new T.BoxGeometry(t.x1-t.x0,.2,FRONT-BACK),lambert('streambed',{color:'#7c8f86'}),(t.x0+t.x1)/2,-1.5,(BACK+FRONT)/2);water(t.x0,t.x1,BACK,FRONT,-.55,'#6fc0df',.86);
   for(const s of t.steps)mesh(new T.BoxGeometry(s.x1-s.x0,s.top,LANE*2+1.4),wear(new T.MeshLambertMaterial({color:'#b9b4a6'}),'sand',LANE*2+1.4,s.x1-s.x0),(s.x0+s.x1)/2,s.top/2,0);
   {const spots=[];for(const [a,b] of t.ground)for(let i=0;i<16;i++)spots.push([a+.4+rand()*(b-a-.8),(rand()<.5?-1:1)*(EDGE+.4+rand()*(rand()<.5?2.5:5.5))]);
    const dots=new T.InstancedMesh(new T.SphereGeometry(.09,6,5),new T.MeshLambertMaterial({color:'#ffffff'}),spots.length),d=new T.Object3D(),col=new T.Color();
    spots.forEach(([x,z],i)=>{d.position.set(x,.1,Math.max(BACK+.5,Math.min(FRONT-.5,z)));d.updateMatrix();dots.setMatrixAt(i,d.matrix);dots.setColorAt(i,col.set(['#ffffff','#f6d24a','#f3a0bd'][i%3]));});scene.add(dots);}
   for(let i=0;i<15;i++){const [a,b]=t.ground[i%4],x=a+.8+rand()*(b-a-1.6);tree(x,-LANE-1.6-rand()*6,.9+rand()*.8);if(i%2)bush(a+.6+rand()*(b-a-1.2),.2,LANE+1.6+rand()*3,.5+rand()*.4);}}
  // 2 Pond and waterside: open water, lily pads with reeds as obstacles.
  // The swimmer's lane ends at things you can see: the bank behind and a line of lily pads in front.
  {const t=TRACK.pond,bank=LANE+.15;slab(t.x0,t.x1,BACK,-bank,.25,7,'grass');slab(t.x0,t.x1,-bank,FRONT,-1.5,5.5,'mud','#6f8a7c');water(t.x0,t.x1,-bank,FRONT,WATER_Y,'#5fb7d6');
   for(let x=t.x0+.7;x<t.x1;x+=1.45){lily(x+rand()*.3,LANE+.55+rand()*.25,1.15+rand()*.3);if(rand()<.3)reeds(x,LANE+.7,.8);}
   for(const b of blockersOf('pond')){lily(b.x,b.z,b.r*2.3);reeds(b.x,b.z,.95);}
   for(let i=0;i<14;i++){const x=t.x0+1+rand()*(t.x1-t.x0-2);reeds(x,-LANE-.45+rand()*.25,1+rand()*.5);if(i<6)lily(x+1.5,LANE+2.2+rand()*3.5,.9+rand()*.6);if(i%3===0)tree(x,-LANE-4-rand()*4,1.1);}}
  // 3 Above the flower field: no ground between the pads, tall flower hedges below and leafy branches above.
  const crowns=[];
  {const t=TRACK.sky;slab(t.x0,t.x1,BACK,FRONT,-2.3,4,'grass');
   const stems=[],heads=[];for(let i=0;i<70;i++){const x=t.x0+.6+rand()*(t.x1-t.x0-1.2),z=BACK+3+rand()*(FRONT-BACK-5),h=.5+rand()*.45;stems.push([x,-2.3+h/2,z,h]);heads.push([x,-2.3+h,z]);}
   const stemMesh=new T.InstancedMesh(new T.CylinderGeometry(.035,.035,1,5),lambert('stem',{color:'#4f8f45'}),stems.length),headMesh=new T.InstancedMesh(new T.SphereGeometry(.2,8,6),new T.MeshLambertMaterial({color:'#ffffff'}),heads.length),d=new T.Object3D(),col=new T.Color();
   stems.forEach(([x,y,z,h],i)=>{d.position.set(x,y,z);d.scale.set(1,h,1);d.updateMatrix();stemMesh.setMatrixAt(i,d.matrix);});d.scale.set(1,1,1);
   heads.forEach(([x,y,z],i)=>{d.position.set(x,y,z);d.updateMatrix();headMesh.setMatrixAt(i,d.matrix);headMesh.setColorAt(i,col.set(['#f6c945','#ee7fa5','#ffffff','#f29b4b','#b98be0'][i%5]));});scene.add(stemMesh,headMesh);
   const depth=LANE*2+1.6;
   for(const b of t.barriers){
     if(b.min>-5){const h=b.min+2.3;mesh(new T.BoxGeometry(1.3,h,depth),wear(new T.MeshLambertMaterial(),'hedge',depth,h,1.6),b.x,b.min-h/2,0);}
     else{mesh(new T.CylinderGeometry(.3,.42,10,8),lambert('trunk',{color:'#7b5a3c'}),b.x,2.7,-LANE-1.3);const limb=mesh(new T.CylinderGeometry(.16,.24,depth+1,7),lambert('trunk',{color:'#7b5a3c'}),b.x,b.max+.25,-.2);limb.rotation.x=Math.PI/2;
       // Leafy clumps along the branch hang over the whole path; they turn see-through while the butterfly passes beneath, so the animal is never hidden.
       const leaves=wear(new T.MeshLambertMaterial({transparent:true}),'hedge',3,3,1.6);
       for(let k=0;k<6;k++){const r=1.2+rand()*.25,clump=mesh(new T.IcosahedronGeometry(r,1),leaves,b.x+(rand()-.5)*.6,b.max+r+.12+rand()*.3,-LANE-.4+k*(depth/5));clump.scale.y=.9;clump.position.y=b.max+r*.9+.12;clump.renderOrder=8;}
       crowns.push({material:leaves,x:b.x});}
   }}
  // 4 Sea and mudflat: a mudflat on the far side, sea water on the near side.
  {const t=TRACK.coast,[m0,m1]=t.lanes.walk;slab(t.x0,t.x1,BACK,m1,0,7,'mud','#7d6a4c');slab(t.x0,t.x1,m1,FRONT,-1.6,5.4,'sand','#5f86a0');water(t.x0,t.x1,m1,FRONT,WATER_Y,'#3f93cc',.7);
   // Lane edges you can see: driftwood behind the mudflat path, a sandbar in front of the sea lane.
   slab(t.x0,t.x1,LANE+.2,LANE+1.5,.07,1.9,'sand','#cdb98a');for(let x=t.x0+.4;x<t.x1-2;x+=4.2)mesh(new T.BoxGeometry(3.4,.2,.22),lambert('log',{color:'#8d6a44'}),x+1.7,.1,-LANE-.3).rotation.y=(rand()-.5)*.12;
   for(const b of blockersOf('coast')){if(b.z<0)rock('boulder',b.x,0,b.z,b.r);else{rock('searock',b.x,WATER_Y-.3,b.z,b.r*1.1);const weed=[-.3,.25].map(k=>mesh(new T.ConeGeometry(.12,1.3,6),lambert('weed',{color:'#3c8a5a'}),b.x+k,-.9,b.z+.45));prop('kelp',b.x-.1,-1.55,b.z+.5,1.5,weed);}}
   for(let i=0;i<10;i++){const x=t.x0+1+rand()*(t.x1-t.x0-2);rock('boulder',x,0,m0-1.2-rand()*6,.3+rand()*.5);if(i%2)mesh(new T.CircleGeometry(.5+rand()*.4,14),lambert('pool',{color:'#7fb9cf'}),x+2,.012,m0-.9-rand()*4).rotation.x=-Math.PI/2;}}
  // Far scenery. Plain version: soft hills and clouds. Painted version: one wide backdrop per place, cross-faded as the path moves on.
  const plain=[];
  for(let i=0;i<9;i++){const x=-10+i*17,hill=mesh(new T.SphereGeometry(9+rand()*4,14,8),lambert(i>6?'dune':'hill',{color:i>6?'#d9cfa6':'#9cc77a'}),x,-4.5,-26-rand()*5);hill.scale.y=.75;plain.push(hill);}
  for(let i=0;i<8;i++){const c=mesh(new T.SphereGeometry(1.6+rand(),10,7),new T.MeshBasicMaterial({color:'#ffffff',fog:false}),-6+i*23+rand()*8,9.5+rand()*3,-22);c.scale.set(2.2,.6,1);plain.push(c);}
  // Placed so the picture's top edge meets the top of the screen and its meadow meets the far edge of the playfield.
  const backdrops=[],BACKDROP_Y=-.6;
  ORDER.forEach((id,i)=>{// Should the seaside picture ever be left out, the coast keeps the forest hills behind its mudflat rather than an empty sky.
    const name={forest:'backdrop-forest',pond:'backdrop-pond',sky:'backdrop-forest',coast:RELAY_ART.includes('backdrop-coast')?'backdrop-coast':'backdrop-forest'}[id],center=(TRACK[id].x0+TRACK[id].x1)/2;
    // The picture fills the middle; on a wide screen its mirrored continuation fills the sides (the sky path shows the forest picture flipped).
    painted(name,t=>{const map=Object.assign(t.clone(),{wrapS:T.MirroredRepeatWrapping,needsUpdate:true}),flip=id==='sky'?-1:1;map.repeat.x=1.6*flip;map.offset.x=flip>0?-.3:1.3;
      const m=mesh(new T.PlaneGeometry(96,21.6),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,fog:false}),center,BACKDROP_Y,-36);m.renderOrder=-5+i;backdrops.push({m,center});for(const p of plain)p.visible=false;
      // The sky above the picture takes the colour of the picture's top edge, so no seam shows on a tall screen.
      if(i===0){const c=document.createElement('canvas');c.width=c.height=1;const g=c.getContext('2d');g.drawImage(t.image,0,0,t.image.width,6,0,0,1,1);const [r,gg,bb]=g.getImageData(0,0,1,1).data;scene.background=new T.Color(`rgb(${r},${gg},${bb})`);}});});
  // Record pieces: small gold gems that mark a good line through each section.
  const gemGeo=new T.OctahedronGeometry(.24),gemMat=new T.MeshBasicMaterial({color:'#ffd24a'}),gems={};
  for(const id of ORDER)gems[id]=TRACK[id].pieces.map(p=>mesh(gemGeo,gemMat,p[0],p[1],p[2]));

  // The animal: one sprite; its picture and size change with the chosen animal. It is depth-tested like any other
  // object, so reeds or rocks in front of it cover it and things behind it stay behind.
  // QA can read the runner from the element; the app itself never does.
  const runner=box.relayRunner=createRunner(),sprite=new T.Sprite(new T.SpriteMaterial({transparent:true,alphaTest:.35}));sprite.visible=false;sprite.renderOrder=4;scene.add(sprite);
  const shadow=blobShadow(.55,.3);scene.add(shadow);shadow.visible=false;shadow.renderOrder=3;
  const ripple=mesh(new T.RingGeometry(.5,.62,24),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.6,depthWrite:false}),0,0,0);ripple.rotation.x=-Math.PI/2;ripple.renderOrder=7;ripple.visible=false;
  // A pale ring under the animal, so a small or mud-coloured one is easy to find.
  const marker=mesh(new T.RingGeometry(.62,.74,28),new T.MeshBasicMaterial({color:'#fffbe6',transparent:true,opacity:.75,depthWrite:false}),0,0,0);marker.rotation.x=-Math.PI/2;marker.renderOrder=7;marker.visible=false;
  const pictures={};
  function dress(id){
    const p=PICTURES[id];if(!p)return;const map=pictures[id]??=Object.assign(load(p.url()),{wrapS:T.RepeatWrapping});
    sprite.material.map=map;sprite.material.needsUpdate=true;sprite.visible=true;
  }
  // Camera: fixed angle from the near side, sliding with the animal. Low enough that the far scenery fills the top of the screen.
  const view={x:0,y:2};
  function place(dt){
    const lead=o.phase==='run'||o.phase==='done'||!TRACK[ORDER[o.section]]?runner.x+1.6:TRACK[ORDER[o.section]].x0+2.4;
    const goalX=Math.max(1.5,Math.min(PADS.at(-1)[1]-4,lead)),goalY=2+(runner.kind==='fly'&&o.phase==='run'?Math.max(0,runner.y-1)*.5:0),k=reduced()?1:Math.min(1,dt*4);
    view.x+=(goalX-view.x)*k;view.y+=(goalY-view.y)*k;camera.position.set(view.x+.4,7.4+(view.y-2)*.6,18);camera.lookAt(view.x+.9,view.y,0);
    for(const {m,center} of backdrops){const far=Math.abs(view.x-center);m.material.opacity=far<14?1:far>26?0:1-(far-14)/12;m.visible=m.material.opacity>0;m.position.x=view.x+(center-view.x)*.08;m.position.y=BACKDROP_Y+(view.y-2)*1.6;}
    for(const {material,x} of crowns){const near=runner.kind==='fly'&&o.phase==='run'&&Math.abs(runner.x-x)<3.2,goal=near?.3:1;material.opacity+=(goal-material.opacity)*(reduced()?1:Math.min(1,dt*8));}
  }
  function pose(){
    const p=PICTURES[animal];if(!p||!sprite.visible)return;
    const kind=runner.kind,still=reduced(),t=clock,w=p.h*(p.w||1),swim=kind==='swim';let y=runner.y,turn=0,wide=1;
    if(swim&&p.under){y=WATER_Y-.6+(still?0:Math.sin(t*3)*.05);turn=still||!runner.moving?0:Math.sin(t*9)*.07;}
    else if(swim){y=WATER_Y-p.h*(p.sink||0)+(still?0:Math.sin(t*3)*.03);turn=still?0:Math.sin(t*2.3)*.035;}
    else if(kind==='fly'){wide=runner.ground?1:.42+.58*Math.abs(Math.cos(t*(runner.acting?21:11)));turn=-runner.face*.95;y=runner.y+.25;}
    else if(kind==='jump'){if(!runner.ground)turn=runner.face*Math.max(-.32,Math.min(.32,runner.vy*.04));else if(runner.moving&&!still)y+=Math.abs(Math.sin(t*10))*.14;}
    else if(kind==='walk'&&runner.moving&&!still){y+=Math.abs(Math.sin(t*15))*.05;turn=Math.sin(t*15)*.05;}
    const face=p.top?1:runner.face*(p.flip?-1:1),map=sprite.material.map;
    if(map){map.repeat.set(face,1);map.offset.set(face<0?1:0,0);}
    sprite.center.set(.5,p.top||p.under?.5:(p.foot||0));sprite.scale.set(w*wide,p.h,1);sprite.material.rotation=turn;sprite.position.set(runner.x,y,runner.z);
    ripple.visible=swim&&!p.under;if(ripple.visible){const s=still?1:1+((t*.9)%1)*.9;ripple.position.set(runner.x,WATER_Y+.02,runner.z);ripple.scale.setScalar(s);ripple.material.opacity=still?.5:.65*(2-s);}
    marker.visible=kind==='walk'||(kind==='jump'&&runner.ground)||(swim&&!!p.under);if(marker.visible)marker.position.set(runner.x,(swim?WATER_Y:runner.y)+.04,runner.z);
    // The shadow lies on whatever is under the animal: the ground, the stream in a gap, or the flower tops under the sky path.
    const top=groundTop(runner.x),under=top>-Infinity?top:runner.section==='sky'?TRACK.sky.floor-.9:-.5;
    shadow.visible=!swim&&runner.y>=under-.05;if(shadow.visible){shadow.position.set(runner.x,under+.04,runner.z);shadow.material.opacity=.3*Math.max(.2,1-Math.max(0,runner.y-under)/5);}
  }
  // Input: on-screen pad and action button first, the keyboard beside them.
  // A short tap still counts: each direction press is kept for at least STEP_MS, and the action button for ACT_MS,
  // so a child tapping an arrow walks a step and a quick tap on 뛰기 still jumps.
  const STEP_MS=420,ACT_MS=180,dirs=new Map(),held={act:false,space:false,actUntil:0},running=()=>!dead&&o.phase==='run'&&!document.hidden&&!document.querySelector('#dialog')?.open&&!runner.ended;
  const root=document.querySelector('#app')||document.body,abort=new AbortController(),on=(target,type,fn,opts={})=>target.addEventListener(type,fn,{...opts,signal:abort.signal});
  const now=()=>performance.now(),pressDir=(source,dir)=>{dirs.set(source,{dir,since:now(),until:0});request();},letGo=source=>{const h=dirs.get(source);if(h)h.until=h.since+STEP_MS;};
  const pad=bindDirectionPad(root,'[data-relay-dir]',b=>b.dataset.relayDir,{press:d=>pressDir('pad',d),release:()=>letGo('pad'),cancel:()=>letGo('pad'),tap:d=>{pressDir('pad',d);letGo('pad');},blocked:()=>!running()});
  const release=()=>{dirs.clear();held.act=false;held.space=false;held.actUntil=0;paintAct();};
  function paintAct(){root.querySelector('[data-relay-act]')?.classList.toggle('is-held',held.act!==false||held.space);}
  on(root,'pointerdown',e=>{const b=e.target.closest?.('[data-relay-act]');if(!b||!running())return;e.preventDefault();held.act=e.pointerId;held.actUntil=now()+ACT_MS;try{b.setPointerCapture(e.pointerId);}catch{}paintAct();});
  for(const type of ['pointerup','pointercancel'])on(document,type,e=>{if(held.act===e.pointerId){held.act=false;paintAct();}});
  on(root,'click',e=>{const b=e.target.closest?.('[data-relay-act]');if(b&&e.detail===0&&running())held.actUntil=now()+ACT_MS;});
  on(root,'contextmenu',e=>{if(e.target.closest?.('[data-relay-act],[data-relay-dir]'))e.preventDefault();});
  const typing=e=>e.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
  on(document,'keydown',e=>{if(!running()||typing(e)||e.ctrlKey||e.altKey||e.metaKey)return;const d=mapKeyDirection(e);
    if(d){e.preventDefault();const k='key:'+(e.code||e.key),h=dirs.get(k);if(!h||h.until)pressDir(k,d);}else if(e.code==='Space'||e.key===' '){if(!held.space)held.actUntil=now()+ACT_MS;held.space=true;e.preventDefault();paintAct();}});
  on(document,'keyup',e=>{const d=mapKeyDirection(e);if(d)letGo('key:'+(e.code||e.key));else if(e.code==='Space'||e.key===' '){if(held.space||running())e.preventDefault();held.space=false;paintAct();}});
  on(window,'blur',release);on(document,'visibilitychange',()=>{release();if(!document.hidden)request();});
  function input(){
    const t=now(),d=new Set();for(const [k,h] of dirs){if(h.until&&t>=h.until){dirs.delete(k);continue;}d.add(h.dir);}
    return {x:(d.has('right')?1:0)-(d.has('left')?1:0),z:(d.has('down')?1:0)-(d.has('up')?1:0),act:held.act!==false||held.space||t<held.actUntil};
  }
  function frame(now){
    raf=0;if(dead||document.hidden)return;const dt=Math.min(.05,last?(now-last)/1000:0);last=now;clock+=dt;
    if(running()){
      const out=stepRunner(runner,dt,input());
      for(const i of out.pieces){gems[runner.section][i].visible=false;o.onPiece?.(runner.pieces.length);}
      if(out.fell)o.onFall?.(runner.falls);
      if(out.end){release();pad.clear();o.onEnd?.();}
    }
    if(!reduced()){for(const map of waters)map.offset.x=(clock*.04)%1;for(const id of ORDER)for(const g of gems[id])if(g.visible)g.rotation.y=clock*2;}
    place(dt);pose();renderer.render(scene,camera);request();
  }
  function request(){if(!raf&&!dead&&!document.hidden)raf=requestAnimationFrame(frame);}
  // Setting the size clears the canvas, so an unchanged size is left alone and a new one is drawn at once (no blank flash on a re-render).
  let size='';
  function resize(){const w=box.clientWidth,h=box.clientHeight;if(!w||!h||size===w+'x'+h)return;size=w+'x'+h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1.25?44:36;camera.updateProjectionMatrix();place(0);renderer.render(scene,camera);request();}
  const ro=new ResizeObserver(resize);ro.observe(box);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!dead)o.onFail?.(new Error('context lost'));});
  // A new token means a section starts now with the chosen animal; other re-renders keep the animal where it is.
  function update(next){
    o=next;
    if(o.token!==token){token=o.token;if(o.phase==='run'&&PICTURES[o.animal]&&ORDER[o.section]){animal=o.animal;beginSection(runner,ORDER[o.section],relayKind(animal));dress(animal);for(const g of gems[runner.section])g.visible=true;release();}
      else if(!o.animal&&o.section===0&&o.phase==='pick'){sprite.visible=false;shadow.visible=false;ripple.visible=false;marker.visible=false;animal='';for(const id of ORDER)for(const g of gems[id])g.visible=true;}}
    request();
  }
  host.append(box);view.x=TRACK[ORDER[o.section]]?TRACK[ORDER[o.section]].x0+2.4:1.5;resize();update(o);
  return {
    attach(h,next){if(box.parentNode!==h)h.append(box);resize();update(next);},
    destroy(){dead=true;cancelAnimationFrame(raf);ro.disconnect();abort.abort();pad.destroy();
      scene.traverse(x=>{x.geometry?.dispose();for(const m of [].concat(x.material||[])){m.map?.dispose();m.dispose();}});for(const t of Object.values(tiles))t.dispose();
      for(const t of Object.values(pictures))t.dispose();renderer.dispose();renderer.forceContextLoss();box.remove();}
  };
}
