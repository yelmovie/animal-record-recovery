import {T,createStage,texture,blobShadow} from './stage3d.js';
import {mat,loadAnimal} from './scanner3d.js';
// Screen 06: one small diorama island under a glass dome, one sector per environment.
// The learner swipes the camera around, finds the round's animals and taps them.

const R=6,TURN=Math.PI*2;
// One shared atlas request; each surface uses a small repeating material tile.
const terrainColors={'#7fa653':0,'#3f7a3a':0,'#8db564':1,'#5f9a3f':1,'#e6d39e':2,'#e3c07e':2,'#d9b06a':2,'#c9b98a':2,'#eef4f7':3,'#cfe6f2':3,'#4f9fc4':4,'#3f86b8':4,'#2f6f9a':4,'#8a6a48':5,'#7a5a3a':5,'#9c8463':5};
function naturalMat(color,options={}){const m=mat(color,options);if(Object.hasOwn(terrainColors,color))m.userData.terrain=terrainColors[color];return m;}
function surfaceMat(tile,options={}){const m=mat('#e3e4db',options);m.userData.surface=tile;return m;}
function plantMat(asset){const m=new T.MeshStandardMaterial({color:'#ffffff',roughness:1,side:T.DoubleSide,alphaTest:.45});m.userData.plant=asset;return m;}
// Actual leaf silhouettes and veins replace the old discs and straight green rods.
function reedClump(g,p,size,rotation){
  const group=new T.Group(),material=plantMat('reed'),geo=new T.PlaneGeometry(1,1.45).translate(0,.68,0);
  for(const a of [0,Math.PI/2]){const mesh=new T.Mesh(geo,material);mesh.rotation.y=a;mesh.raycast=()=>{};group.add(mesh);}
  group.position.copy(p);group.rotation.y=rotation;group.scale.setScalar(size);g.add(group);
}
function lily(g,p,size,rotation){const mesh=new T.Mesh(new T.PlaneGeometry(size,size),plantMat('lotus_leaf'));mesh.rotation.set(-Math.PI/2,0,rotation);mesh.position.copy(p);mesh.raycast=()=>{};g.add(mesh);}
function rockGeometry(ice=false){
  const geo=ice?new T.SphereGeometry(1,24,12):new T.IcosahedronGeometry(1,2),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.13*Math.sin(x*6+z*4)*Math.cos(y*5-z*3);p.setXYZ(i,x*n*.65,(y+1)*n*(ice?.32:.42),z*n*.52);}
  geo.computeVertexNormals();return geo;
}
function cactus(g,p,size,rotation){
  const group=new T.Group(),material=surfaceMat(2,{roughness:.85}),stem=new T.CylinderGeometry(.16,.21,1.45,48,8),positions=stem.attributes.position;
  for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i),rib=1+.09*Math.cos(Math.atan2(z,x)*10);positions.setXYZ(i,x*rib,positions.getY(i)+.73,z*rib);}stem.computeVertexNormals();
  group.add(new T.Mesh(stem,material));
  const cap=new T.Mesh(new T.SphereGeometry(.16,16,10),material);cap.position.y=1.45;group.add(cap);
  for(const [side,height] of [[-1,.72],[1,1.03]]){
    const curve=new T.CatmullRomCurve3([new T.Vector3(side*.1,height-.3,0),new T.Vector3(side*.37,height-.25,0),new T.Vector3(side*.45,height-.07,0),new T.Vector3(side*.45,height+.28,0)]);
    group.add(new T.Mesh(new T.TubeGeometry(curve,12,.105,12,false),material));const tip=new T.Mesh(new T.SphereGeometry(.105,12,8),material);tip.position.set(side*.45,height+.28,0);group.add(tip);
  }
  group.position.copy(p);group.scale.setScalar(size);group.rotation.y=rotation;group.traverse(n=>{n.raycast=()=>{};});g.add(group);
}

// Seeded so the island looks the same every visit.
function rng(seed){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const at=(a,r,y=0)=>new T.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);
function instanced(geo,m,list){
  const mesh=new T.InstancedMesh(geo,m,list.length),o=new T.Object3D();
  list.forEach(([p,s=1,ry=0],i)=>{o.position.copy(p);o.scale.setScalar(s);o.rotation.set(0,ry,0);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});
  mesh.raycast=()=>{};return mesh;
}
// Ground colour and props per environment. `spots` are [angle offset (× half sector), radius] for animals.
const ZONES={
  forest:{ground:'#7fa653',build(g,a,half,rand,spot){
    const trees=[],tufts=[],flowers=[];
    // Trees stand at the back and sides of the sector so they frame the animals instead of hiding them.
    for(let i=0;i<9;i++){const side=(i%2?1:-1)*(.35+rand()*.55);trees.push([at(a+side*half,3.6+rand()*2),.5+rand()*.3,rand()*TURN]);}
    for(let i=0;i<40;i++)tufts.push([at(a+(rand()*2-1)*half*.9,1.2+rand()*4.6,.12),.6+rand()*.8]);
    for(let i=0;i<22;i++)flowers.push([at(a+(rand()*2-1)*half*.85,1.4+rand()*4.2,.16),1]);
    g.add(instanced(new T.CylinderGeometry(.12,.16,.9,8).translate(0,.45,0),naturalMat('#7a5a3a'),trees),
      instanced(new T.IcosahedronGeometry(.82,2).scale(1,1.2,1).translate(0,1.65,0),naturalMat('#3f7a3a'),trees),
      instanced(new T.ConeGeometry(.12,.35,5),naturalMat('#5f9a3f'),tufts),
      instanced(new T.SphereGeometry(.09,8,6),naturalMat('#f2d24b'),flowers.filter((_,i)=>i%2)),instanced(new T.SphereGeometry(.09,8,6),naturalMat('#f4f0f6'),flowers.filter((_,i)=>!(i%2))));
    spot('rabbit',[0,3.2]);spot('butterfly',[-.45,4.4]);}},
  pond:{ground:'#8db564',build(g,a,half,rand,spot){
    const c=new T.Vector3(3.3,0,2.1);
    for(let i=0;i<10;i++){const t=Math.PI*.55+i*.17,r=1.45+rand()*.2;reedClump(g,new T.Vector3(c.x+Math.cos(t)*r,.035,c.z+Math.sin(t)*r),.45+rand()*.25,rand()*TURN);}
    for(let i=0;i<6;i++){const t=rand()*TURN,r=.45+rand()*.65;lily(g,new T.Vector3(c.x+Math.cos(t)*r,.05+i*.002,c.z+Math.sin(t)*r),.65+rand()*.25,rand()*TURN);}
    lily(g,at(a-half*.45,3.1,.055),1.4,.25);
    spot('frog',[-.45,3.1]);spot('duck',[-.2,4]);}},
  coast:{ground:'#e6d39e',build(g,a,half,rand,spot){
    const rocks=[];for(let i=0;i<8;i++)rocks.push([at(a+(rand()*2-1)*half*.8,1.6+rand()*2.2,.05),.4+rand()*.5,rand()*TURN]);
    g.add(instanced(rockGeometry(),surfaceMat(0,{roughness:.95}),rocks));
    spot('crab',[.35,2.9]);spot('marine',[-.1,5.1]);}},
  dry:{ground:'#e3c07e',build(g,a,half,rand,spot){
    for(let i=0;i<4;i++){const side=(i%2?1:-1)*(.45+rand()*.25);cactus(g,at(a+side*half,3.7+rand()*1.1,.035),.55+rand()*.3,rand()*TURN);}
    const rocks=[];for(let i=0;i<4;i++)rocks.push([at(a+(i%2?1:-1)*half*.85,2.2+rand()*.6,.035),.35+rand()*.3,rand()*TURN]);
    g.add(instanced(rockGeometry(),surfaceMat(0,{roughness:1}),rocks));
    spot('camel',[0,3.4]);}},
  cold:{ground:'#eef4f7',build(g,a,half,rand,spot){
    const ice=[];for(let i=0;i<6;i++)ice.push([at(a+(i%2?1:-1)*half*(.35+rand()*.35),3.4+rand()*1.2,.035),.5+rand()*.6,rand()*TURN]);
    g.add(instanced(rockGeometry(true),surfaceMat(1,{roughness:.32,metalness:.02}),ice));
    spot('penguin',[0,3]);}},
};

const SCALE={rabbit:.42,frog:.38,duck:.4,crab:.36,butterfly:.42,marine:.45,camel:.7,penguin:.6};

// opts: {zones:[id], names:{id:name}, targets:[{id,animal,habitat,name,found}], extras (same, look only), active, onFind(id), onLook(id), onFail}
export function create(host,opts){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let animals=[],key='',active=null,aimed=null,tilt=null,dead=false;
  const stage=createStage(host,{target:[0,.4,0],theta:0,phi:.95,radius:12.5,minR:5,maxR:17,minPhi:.45,maxPhi:1.35,fov:40,fps:30,
    label:'3D 생태 돔. 손가락으로 밀어 돌려 보고, 동물을 찾으면 눌러 봐.',pickables:()=>animals.map(x=>x.hit),onTap,tick,onFail:e=>opts.onFail?.(e)});
  const {scene}=stage,sun=new T.DirectionalLight('#fff4dc',2.2);sun.position.set(6,10,5);
  scene.add(new T.HemisphereLight('#f4fbff','#6b7a52',1.4),sun);
  const angle=id=>opts.zones.indexOf(id)*TURN/opts.zones.length;

  // Island: earth base, one ground sector per zone, glass dome.
  const half=Math.PI/opts.zones.length,spots={};
  const base=new T.Mesh(new T.CylinderGeometry(R+.2,R-.3,.8,64),surfaceMat(3));base.position.y=-.4;base.raycast=()=>{};
  // One continuous surface: no coplanar sector/pond meshes or radial texture seams.
  const ground=new T.Mesh(new T.CircleGeometry(R,96),mat('#e1e4d7',{roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=.035;ground.raycast=()=>{};
  const dome=new T.Mesh(new T.SphereGeometry(R+.6,40,16,0,TURN,0,Math.PI/2),new T.MeshStandardMaterial({color:'#dff3ff',transparent:true,opacity:.1,roughness:.05,side:T.BackSide,depthWrite:false}));dome.raycast=()=>{};
  const ring=new T.Mesh(new T.TorusGeometry(R+.6,.08,8,80),mat('#c9d6c4',{metalness:.4,roughness:.3}));ring.rotation.x=Math.PI/2;
  scene.add(base,ground,dome,ring);
  opts.zones.forEach((id,i)=>{
    const a=angle(id),z=ZONES[id],g=new T.Group(),rand=rng(i*97+13);
    z.build(g,a,half,rand,(animal,[da,r])=>{spots[animal]=at(a+da*half,r,animal==='frog'?.055:.035);});scene.add(g);
  });

  const assetTasks=[];
  const imageAsset=(path,apply)=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{if(!dead)apply(img);resolve();};img.onerror=()=>reject(new Error(`Unable to load dome image: ${path}`));img.src=new URL(path,import.meta.url).href;});
  const applyMap=(key,maps)=>scene.traverse(node=>{for(const material of [].concat(node.material||[])){const tile=material.userData[key];if(tile===undefined||!Object.hasOwn(maps,tile))continue;material.map=maps[tile];material.color.set('#e6e7df');material.needsUpdate=true;}});
  assetTasks.push(imageAsset('../assets/adventure/dome-ground.webp',img=>{const map=new T.Texture(img);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.needsUpdate=true;ground.material.map=map;ground.material.needsUpdate=true;}));
  assetTasks.push(imageAsset('../assets/adventure/terrain-atlas.webp',img=>applyMap('terrain',Array.from({length:6},(_,i)=>texture(256,(ctx,size)=>{const w=img.width/2,h=img.height/3;ctx.drawImage(img,(i%2)*w,Math.floor(i/2)*h,w,h,0,0,size,size);},2)))));
  assetTasks.push(imageAsset('../assets/adventure/nature-materials.webp',img=>applyMap('surface',Array.from({length:4},(_,i)=>texture(512,(ctx,size)=>{const w=img.width/2,h=img.height/2;ctx.drawImage(img,(i%2)*w,Math.floor(i/2)*h,w,h,0,0,size,size);},1)))));
  for(const name of ['reed','lotus_leaf'])assetTasks.push(imageAsset(`../assets/generated/${name}.webp`,img=>{const map=new T.Texture(img);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.needsUpdate=true;applyMap('plant',{[name]:map});}));
  const sceneryReady=Promise.all(assetTasks);

  // Each animal: model + a generous invisible hit sphere (≥44 px on a tablet) + its idle motion.
  function addAnimal(t){
    const g=new T.Group(),model=new T.Group(),s=SCALE[t.animal]||.4,home=spots[t.animal]||at(angle(t.habitat),3);
    model.scale.setScalar(s);g.add(model);
    // Keep the entire scene covered until all real models for this visit are ready.
    const ready=loadAnimal(t.animal,{dome:true}).then(glb=>{if(dead||!animals.some(x=>x.model===model))return;model.add(glb);model.userData.glb=true;stage.request();});
    if(t.animal!=='marine'&&t.animal!=='butterfly')g.add(blobShadow(1.1*s/.4,.22));
    const hit=new T.Mesh(new T.SphereGeometry(1.1,10,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.y=.5;hit.userData.find=t.id;g.add(hit);
    g.position.copy(home);// Models face +x; turn them outward toward the camera, three-quarter on (the crab straight on).
    g.rotation.y=angle(t.habitat)-Math.PI/2+(t.animal==='crab'?0:.7);scene.add(g);
    return {...t,g,model,hit,home,ready,pin:new T.Vector3(),seed:Math.random()*10};
  }
  function tick(t){
    const s=t/1000;
    for(const x of animals){
      const k=s+x.seed,m=x.model;
      if(!reduced)switch(x.animal){
        case 'rabbit':case 'frog':m.position.y=Math.max(0,Math.sin(k*3))*.35;break;
        case 'duck':x.g.position.set(x.home.x+Math.sin(k*.5)*.6,x.home.y,x.home.z+Math.cos(k*.5)*.6);x.g.rotation.y=k*.5;m.position.y=Math.sin(k*2)*.03;break;
        case 'crab':m.position.z=Math.sin(k*1.2)*.6;break;
        case 'butterfly':m.position.y=.6+Math.sin(k*1.3)*.3;if(m.userData.glb)m.scale.z=SCALE.butterfly*(.55+.45*Math.abs(Math.cos(k*7)));else m.children.forEach(c=>{if(c.userData.wing)c.rotation.x=c.userData.wing*Math.sin(k*14)*.6;});break;
        case 'marine':{const p=(k*.6)%3;m.position.y=p<1?Math.sin(p*Math.PI)*1.1-.25:-.25;m.rotation.z=p<1?Math.cos(p*Math.PI)*.6:0;break;}
        default:m.position.y=Math.sin(k*2)*.04;
      }
      x.pin.copy(x.g.position).add(m.position).y+=1.25;
    }
    if(tilt?.on)applyTilt();
    return !reduced||!!tilt?.on;
  }
  function onTap(hit){const id=hit?.object.userData.find;if(!id)return;const x=animals.find(a=>a.id===id);aim(x);if(x.look)opts.onLook?.(id);else opts.onFind?.(id);}
  // Aim the scanner at a found animal: glide in and centre it.
  function aim(x){aimed=x.id;active=x.habitat;stage.goTo({theta:angle(x.habitat),radius:8,tx:x.home.x*.7,ty:.5,tz:x.home.z*.7});}
  function faceZone(id){active=id;stage.goTo({theta:angle(id),phi:.92,radius:11,tx:at(angle(id),2.2).x,ty:.4,tz:at(angle(id),2.2).z});}
  function pins(){
    const zoneLabels=opts.zones.map(id=>({pos:at(angle(id),R-.3,.25),normal:at(angle(id),1),cls:'zone',html:`<span>${opts.names[id]}</span>`}));
    stage.setPins([...zoneLabels,...animals.filter(x=>x.found).map(x=>({pos:x.pin,cls:'found',html:`<b>✓</b><span>${x.name}</span>`}))]);
  }
  function apply(o){
    opts=o;const all=[...o.targets,...(o.extras||[]).map(t=>({...t,look:true}))],k=all.map(t=>t.id).join();
    if(k!==key){stage.setLoading(true);for(const x of animals){scene.remove(x.g);x.g.traverse(n=>{if(!n.userData.shared)n.geometry?.dispose();});}key=k;animals=all.map(addAnimal);
      Promise.all([sceneryReady,...animals.map(x=>x.ready)]).then(()=>{if(!dead&&key===k)stage.setLoading(false);}).catch(error=>{if(!dead&&key===k)opts.onFail?.(error);});}
    else animals.forEach(x=>{x.found=all.find(t=>t.id===x.id)?.found;});
    if(o.active!==active){if(aimed&&animals.find(x=>x.id===aimed)?.habitat===o.active)active=o.active;else faceZone(o.active);}
    aimed=null;pins();stage.request();
  }
  // Optional tilt: device orientation nudges the orbit; no events within 1.5 s means no sensor.
  function applyTilt(){if(tilt.beta==null)return;stage.orbit.theta=tilt.theta0-(tilt.gamma-tilt.g0)*Math.PI/180*1.4;stage.orbit.phi=Math.max(.45,Math.min(1.35,tilt.phi0+(tilt.beta-tilt.b0)*Math.PI/180*.8));}
  function setTilt(on,onFail){
    if(tilt){removeEventListener('deviceorientation',tilt.listen);clearTimeout(tilt.timer);tilt=null;}
    if(!on)return;
    tilt={on:true,theta0:stage.orbit.theta,phi0:stage.orbit.phi,beta:null,listen:e=>{if(e.beta==null)return;if(tilt.beta==null){tilt.b0=e.beta;tilt.g0=e.gamma;}tilt.beta=e.beta;tilt.gamma=e.gamma;stage.request();}};
    tilt.timer=setTimeout(()=>{if(tilt&&tilt.beta==null){setTilt(false);onFail?.();}},1500);
    addEventListener('deviceorientation',tilt.listen);stage.request();
  }
  apply(opts);
  if(location.search.includes('regions'))window.__dome={stage,animals:()=>animals};
  return {attach(h,o){stage.attach(h);apply(o);},reset(){stage.reset();active=null;},tilt:setTilt,destroy(){dead=true;setTilt(false);stage.destroy();}};
}
