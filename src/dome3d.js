import {T,createStage,texture,blobShadow} from './stage3d.js';
import {MODELS,ball,limb,mat,loadAnimal} from './scanner3d.js';
// Screen 06: one small diorama island under a glass dome, one sector per environment.
// The learner swipes the camera around, finds the round's animals and taps them.

const R=6,TURN=Math.PI*2;
// Seeded so the island looks the same every visit.
function rng(seed){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const at=(a,r,y=0)=>new T.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);
function instanced(geo,m,list){
  const mesh=new T.InstancedMesh(geo,m,list.length),o=new T.Object3D();
  list.forEach(([p,s=1,ry=0],i)=>{o.position.copy(p);o.scale.setScalar(s);o.rotation.set(0,ry,0);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});
  mesh.raycast=()=>{};return mesh;
}
// Outer band of a sector (sea, icy water) so the water ends at the island edge.
function band(color,a,half,inner,o={}){const m=new T.Mesh(new T.RingGeometry(inner,R-.05,24,1,a-Math.PI/2-half*.94,half*1.88),mat(color,o));m.rotation.x=-Math.PI/2;m.position.y=.035;m.raycast=()=>{};return m;}
function patch(color,radius,pos,y=.03,o={}){const m=new T.Mesh(new T.CircleGeometry(radius,40),mat(color,o));m.rotation.x=-Math.PI/2;m.position.set(pos.x,y,pos.z);m.raycast=()=>{};return m;}

// Ground colour and props per environment. `spots` are [angle offset (× half sector), radius] for animals.
const ZONES={
  forest:{ground:'#7fa653',build(g,a,half,rand,spot){
    const trees=[],tufts=[],flowers=[];
    // Trees stand at the back and sides of the sector so they frame the animals instead of hiding them.
    for(let i=0;i<9;i++){const side=(i%2?1:-1)*(.35+rand()*.55);trees.push([at(a+side*half,3.6+rand()*2),.5+rand()*.3,rand()*TURN]);}
    for(let i=0;i<40;i++)tufts.push([at(a+(rand()*2-1)*half*.9,1.2+rand()*4.6,.12),.6+rand()*.8]);
    for(let i=0;i<22;i++)flowers.push([at(a+(rand()*2-1)*half*.85,1.4+rand()*4.2,.16),1]);
    g.add(instanced(new T.CylinderGeometry(.12,.16,.9,8).translate(0,.45,0),mat('#7a5a3a'),trees),
      instanced(new T.ConeGeometry(.75,1.7,10).translate(0,1.6,0),mat('#3f7a3a'),trees),
      instanced(new T.ConeGeometry(.12,.35,5),mat('#5f9a3f'),tufts),
      instanced(new T.SphereGeometry(.09,8,6),mat('#f2d24b'),flowers.filter((_,i)=>i%2)),instanced(new T.SphereGeometry(.09,8,6),mat('#f4f0f6'),flowers.filter((_,i)=>!(i%2))));
    spot('rabbit',[0,3.2]);spot('butterfly',[-.45,4.4]);}},
  pond:{ground:'#8db564',build(g,a,half,rand,spot){
    const c=at(a,3.6);g.add(patch('#4f9fc4',1.9,c,.035,{roughness:.15,metalness:.1}),patch('#c9b98a',2.15,c,.03));
    const reeds=[],pads=[];
    for(let i=0;i<26;i++){const t=rand()*TURN,r=2+rand()*.4;reeds.push([new T.Vector3(c.x+Math.cos(t)*r,0,c.z+Math.sin(t)*r),.7+rand()*.6]);}
    for(let i=0;i<7;i++){const t=rand()*TURN,r=rand()*1.4;pads.push([new T.Vector3(c.x+Math.cos(t)*r,.05,c.z+Math.sin(t)*r),.8+rand()*.5]);}
    g.add(instanced(new T.CylinderGeometry(.03,.04,1.1,5).translate(0,.55,0),mat('#6b8a3a'),reeds),instanced(new T.CylinderGeometry(.32,.32,.02,14),mat('#4f8f3a'),pads));
    spot('frog',[.35,2.3]);spot('duck',[-.15,3.6]);}},
  coast:{ground:'#e6d39e',build(g,a,half,rand,spot){
    const mud=at(a+half*.35,2.9);
    g.add(band('#3f86b8',a,half,4.1,{roughness:.12,metalness:.1}),patch('#9c8463',1.3,mud,.03,{roughness:1}));
    const rocks=[];for(let i=0;i<8;i++)rocks.push([at(a+(rand()*2-1)*half*.8,1.6+rand()*2.2,.05),.4+rand()*.5,rand()*TURN]);
    g.add(instanced(new T.DodecahedronGeometry(.35),mat('#8a8a84'),rocks));
    spot('crab',[.35,2.9]);spot('marine',[-.1,5.1]);}},
  dry:{ground:'#e3c07e',build(g,a,half,rand,spot){
    const dunes=[],cacti=[];for(let i=0;i<5;i++){const side=(i%2?1:-1)*(.4+rand()*.5);dunes.push([at(a+side*half,3.8+rand()*1.6,-.25),.6+rand()*.4]);}
    for(let i=0;i<6;i++){const side=(i%2?1:-1)*(.35+rand()*.55);cacti.push([at(a+side*half,2+rand()*3.4),.7+rand()*.5]);}
    g.add(instanced(new T.SphereGeometry(1,16,8).scale(1.3,.45,1),mat('#d9b06a'),dunes),instanced(new T.CapsuleGeometry(.16,.9,4,8).translate(0,.6,0),mat('#5f8a4a'),cacti));
    spot('camel',[0,3.4]);}},
  cold:{ground:'#eef4f7',build(g,a,half,rand,spot){
    g.add(band('#2f6f9a',a,half,4.3,{roughness:.1,metalness:.15}));
    const ice=[];for(let i=0;i<7;i++)ice.push([at(a+(rand()*2-1)*half*.8,1.5+rand()*2.5,.2),.5+rand()*.6,rand()*TURN]);
    g.add(instanced(new T.BoxGeometry(.6,.4,.5),mat('#cfe6f2',{roughness:.2}),ice));
    spot('penguin',[0,3]);}},
};

// Small extra figures that only live in the dome.
const EXTRA={
  butterfly(){const body=mat('#3a2f26'),wing=mat('#f0a43a',{side:T.DoubleSide,roughness:.5}),edge=mat('#3a2f26',{side:T.DoubleSide});
    const w=(z,y,s)=>{const g=new T.Group();g.add(ball(wing,[0,0,.55*z],[.45*s,.05,.55],0),ball(edge,[-.05,0,1.0*z],[.25*s,.051,.12],0));g.position.y=y;g.userData.wing=z;return g;};
    return [limb(body,[-.5,1.2,0],[.5,1.2,0],.1,0),w(1,1.25,1),w(-1,1.25,1),limb(body,[.5,1.25,.05],[.9,1.6,.2],.02,0),limb(body,[.5,1.25,-.05],[.9,1.6,-.2],.02,0)];},
  marine(){const skin=mat('#5a86b0',{roughness:.3,metalness:.25}),belly=mat('#d8e2ea',{roughness:.3}),fin=mat('#3f6a94',{side:T.DoubleSide});
    const tail=new T.Mesh(new T.ConeGeometry(.45,.7,3),fin);tail.rotation.z=Math.PI/2;tail.scale.z=.15;tail.position.set(-1.05,.5,0);
    return [ball(skin,[0,.55,0],[.9,.4,.3],0),ball(belly,[.05,.42,0],[.75,.22,.26],0),tail,ball(fin,[0,.95,0],[.35,.2,.04],0),ball(mat('#111'),[.7,.62,.22],[.06,.06,.04],0),ball(mat('#111'),[.7,.62,-.22],[.06,.06,.04],0)];},
  camel(){const fur=mat('#c99a5c',{roughness:1});
    return [ball(fur,[0,1.4,0],[1,.45,.42],0),ball(fur,[-.25,1.85,0],[.4,.35,.3],0),limb(fur,[.8,1.5,0],[1.15,2.2,0],.16,0),ball(fur,[1.3,2.25,0],[.32,.2,.18],0),...[[.6,.22],[.6,-.22],[-.6,.22],[-.6,-.22]].map(([x,z])=>limb(fur,[x,1.2,z],[x,.05,z],.09,0))];},
  penguin(){const black=mat('#22262b',{roughness:.5}),white=mat('#f4f4f0'),orange=mat('#f0a03a');
    return [ball(black,[0,.9,0],[.45,.75,.42],0),ball(white,[.18,.85,0],[.32,.62,.34],0),ball(black,[0,1.75,0],[.32,.3,.3],0),ball(orange,[.32,1.72,0],[.14,.05,.07],0),ball(orange,[.1,.05,.15],[.18,.04,.1],0),ball(orange,[.1,.05,-.15],[.18,.04,.1],0)];},
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
  const base=new T.Mesh(new T.CylinderGeometry(R+.2,R-.3,.8,64),mat('#8a6a48'));base.position.y=-.4;base.raycast=()=>{};
  const dome=new T.Mesh(new T.SphereGeometry(R+.6,40,16,0,TURN,0,Math.PI/2),new T.MeshStandardMaterial({color:'#dff3ff',transparent:true,opacity:.1,roughness:.05,side:T.BackSide,depthWrite:false}));dome.raycast=()=>{};
  const ring=new T.Mesh(new T.TorusGeometry(R+.6,.08,8,80),mat('#c9d6c4',{metalness:.4,roughness:.3}));ring.rotation.x=Math.PI/2;
  scene.add(base,dome,ring);
  opts.zones.forEach((id,i)=>{
    const a=angle(id),z=ZONES[id],g=new T.Group(),rand=rng(i*97+13);
    const ground=new T.Mesh(new T.CircleGeometry(R,24,a-Math.PI/2-half,half*2),mat(z.ground,{roughness:.95}));ground.rotation.x=-Math.PI/2;ground.position.y=.012;ground.raycast=()=>{};g.add(ground);
    z.build(g,a,half,rand,(animal,[da,r])=>{spots[animal]=at(a+da*half,r);});scene.add(g);
  });

  // Each animal: model + a generous invisible hit sphere (≥44 px on a tablet) + its idle motion.
  function addAnimal(t){
    const g=new T.Group(),model=new T.Group(),s=SCALE[t.animal]||.4,home=spots[t.animal]||at(angle(t.habitat),3);
    model.add(...(MODELS[t.animal]||EXTRA[t.animal])());model.scale.setScalar(s);g.add(model);
    // The Meshy model replaces the stand-in when it arrives; the idle motion moves `model`, so it carries over.
    loadAnimal(t.animal).then(glb=>{if(dead||!animals.some(x=>x.model===model))return;model.children.slice().forEach(c=>{model.remove(c);c.traverse(n=>n.geometry?.dispose());});model.add(glb);model.userData.glb=true;stage.request();}).catch(()=>{});
    if(t.animal!=='marine'&&t.animal!=='butterfly')g.add(blobShadow(1.1*s/.4,.22));
    const hit=new T.Mesh(new T.SphereGeometry(1.1,10,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.y=.5;hit.userData.find=t.id;g.add(hit);
    g.position.copy(home);// Models face +x; turn them outward toward the camera, three-quarter on (the crab straight on).
    g.rotation.y=angle(t.habitat)-Math.PI/2+(t.animal==='crab'?0:.7);scene.add(g);
    return {...t,g,model,hit,home,pin:new T.Vector3(),seed:Math.random()*10};
  }
  function tick(t){
    const s=t/1000;
    for(const x of animals){
      const k=s+x.seed,m=x.model;
      if(!reduced)switch(x.animal){
        case 'rabbit':case 'frog':m.position.y=Math.max(0,Math.sin(k*3))*.35;break;
        case 'duck':x.g.position.set(x.home.x+Math.sin(k*.5)*.6,0,x.home.z+Math.cos(k*.5)*.6);x.g.rotation.y=k*.5;m.position.y=Math.sin(k*2)*.03;break;
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
    if(k!==key){for(const x of animals){scene.remove(x.g);x.g.traverse(n=>{if(!n.userData.shared)n.geometry?.dispose();});}key=k;animals=all.map(addAnimal);}
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
