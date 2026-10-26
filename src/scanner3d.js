import {T,createStage,texture,blobShadow} from './stage3d.js';
import {GLTFLoader} from './vendor/three/GLTFLoader.js';
// Screen 02 waits for the actual GLB behind a loading panel. A failed load uses the 2D view.
// A procedural mesh carries its observation index
// (OBSERVATIONS[id][part], -1 = re-look hint); a GLB is one mesh, so REGIONS map a tap point to a part.

// size: longest side after fitting; yaw turns the model to face +x like the procedural ones
// The replacement butterfly already has a volumetric, upright body; no legacy roll is needed.
export const GLB={frog:{size:2.8,yaw:Math.PI/2-.15,revision:'20261018'},crab:{size:3.6,yaw:Math.PI/2,revision:'20261018'},duck:{size:2.8,yaw:Math.PI/2,revision:'20261018'},rabbit:{size:2.8,yaw:Math.PI/2,revision:'20261018'},camel:{size:3,yaw:Math.PI/2,revision:'20261018'},penguin:{size:2.2,yaw:Math.PI/2,revision:'20261018'},butterfly:{size:2.6,yaw:Math.PI/2,revision:'20261018-butterfly'},marine:{size:2.4,yaw:Math.PI/2,revision:'20261018'}};
const cache=new Map();
export function loadAnimal(id){
  if(!GLB[id])return Promise.reject(new Error('no model'));
  const url=new URL(`../assets/models/${id}.glb`,import.meta.url);if(GLB[id].revision)url.searchParams.set('v',GLB[id].revision);
  if(!cache.has(id))cache.set(id,new GLTFLoader().loadAsync(url.href).then(g=>{
    const root=g.scene,box=new T.Box3(),fit=GLB[id];root.rotation.set(0,fit.yaw,fit.roll||0);root.updateMatrixWorld(true);box.setFromObject(root);
    const size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3()),k=fit.size/Math.max(size.x,size.y,size.z);
    root.scale.setScalar(k);root.position.set(-c.x*k,-box.min.y*k,-c.z*k);
    root.traverse(m=>{m.userData.shared=true;for(const material of [].concat(m.material||[])){if(!fit.revision)material.roughness=.7;material.metalness=0;}});
    const wrap=new T.Group();wrap.add(root);return wrap;
  }));
  return cache.get(id).then(w=>w.clone());
}
// Spheres [x,y,z,r] in the fitted model space: parts first, then hint areas; anything else on the body is `body`.
// center: a point on the body for the body part. Pins start where a ray from the part's view hits the model.
export const REGIONS={
  frog:{center:[0,1.4,.39],parts:[[[.81,1.49,.22,.22],[.81,1.49,-.28,.22]],[[-.56,.5,.87,.5],[-.56,.5,-.9,.5],[-.17,.11,.81,.36],[-.17,.11,-.9,.36]],[]],hints:[[.62,.34,.45,.27,'앞다리야. 뒷다리와 길이를 비교해 봐.'],[.67,.34,-.5,.27,'앞다리야. 뒷다리와 길이를 비교해 봐.']],body:2},
  crab:{center:[-.3,1.1,0],parts:[[[-.2,1.2,.37,.2],[-.2,1.2,-.37,.2]],[[.85,.5,.75,.5],[.85,.5,-.75,.5],[-.2,.5,1.5,.6],[-.2,.5,-1.5,.6],[-.9,.4,1.45,.55],[-.9,.4,-1.45,.55],[.45,.4,1.45,.5],[.45,.4,-1.45,.5]],[]],hints:[],body:2},
  duck:{center:[-.4,1,0],parts:[[[1.2,1.65,0,.26]],[],[[.4,.05,.3,.32],[.4,.05,-.3,.32],[.35,.3,.22,.18],[.35,.3,-.22,.18]]],hints:[[.856,1.842,.113,.11,'눈이야. 이번에는 부리·몸 표면·발을 살펴봐.'],[.856,1.842,-.113,.11,'눈이야. 이번에는 부리·몸 표면·발을 살펴봐.']],body:1},
  rabbit:{center:[-.2,1.2,0],parts:[[[.6,2.2,.32,.3],[.6,2.2,-.36,.3],[.65,2.5,.4,.2],[.65,2.5,-.42,.2]],[],[[-.55,.6,.45,.48],[-.55,.6,-.45,.48],[-.18,.13,.45,.33],[-.18,.13,-.45,.33]]],hints:[[.65,.3,.25,.25,'앞다리야. 뒷다리와 길이를 비교해 봐.'],[.65,.3,-.25,.25,'앞다리야. 뒷다리와 길이를 비교해 봐.'],[1,1.55,.3,.13,'얼굴이야. 귀·몸 표면·뒷다리를 찾아봐.'],[1,1.55,-.3,.13,'얼굴이야. 귀·몸 표면·뒷다리를 찾아봐.'],[1.38,1.35,0,.13,'얼굴이야. 귀·몸 표면·뒷다리를 찾아봐.']],body:1},
};
export function regionAt(id,p){
  const r=REGIONS[id],inside=([x,y,z,rad])=>(p.x-x)**2+(p.y-y)**2+(p.z-z)**2<=rad*rad;
  const part=r.parts.findIndex(list=>list.some(inside));if(part>=0)return {part};
  const hint=r.hints.find(inside);return hint?{part:-1,hint:hint[4]}:{part:r.body};
}

export const tag=(mesh,part,hint)=>{mesh.userData.part=part;if(hint)mesh.userData.hint=hint;return mesh;};
export function ball(m,pos,scale,part,hint,rot){const g=new T.Mesh(new T.SphereGeometry(1,22,14),m);g.position.set(...pos);g.scale.set(...scale);if(rot)g.rotation.set(...rot);return tag(g,part,hint);}
export function limb(m,a,b,r,part,hint){const A=new T.Vector3(...a),B=new T.Vector3(...b),g=new T.Mesh(new T.CapsuleGeometry(r,A.distanceTo(B),4,10),m);g.position.copy(A).add(B).multiplyScalar(.5);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.sub(A).normalize());return tag(g,part,hint);}
// A flat webbed fan pointing along +x (turned by `angle` around y), with toe ridges on top.
function webFoot(m,toe,pos,radius,angle,part,spread=1){
  const g=new T.Group(),fan=new T.Mesh(new T.CircleGeometry(radius,12,-.5*spread,spread),m);
  fan.rotation.x=-Math.PI/2;g.add(tag(fan,part));
  for(const a of [-.42*spread,0,.42*spread])g.add(limb(toe,[0,.015,0],[Math.cos(a)*radius,.02,-Math.sin(a)*radius],radius*.07,part));
  g.position.set(...pos);g.rotation.y=angle;return g;
}
// A texture already carries the colour, so a textured material stays white (colour × map would darken it).
export const mat=(color,o={})=>new T.MeshStandardMaterial({color:o.map?'#ffffff':color,roughness:.75,...o});
const both=f=>[1,-1].flatMap(f);
const sprinkle=(colors,count,size)=>(g,s)=>{for(let i=0;i<count;i++){g.fillStyle=colors[i%colors.length];g.beginPath();g.arc(Math.random()*s,Math.random()*s,size*(.4+Math.random()),0,7);g.fill();}};
const fill=c=>(g,s)=>{g.fillStyle=c;g.fillRect(0,0,s,s);};
const layers=(...fs)=>(g,s)=>fs.forEach(f=>f(g,s));
const furLines=(base,tones,count)=>layers(fill(base),(g,s)=>{g.lineWidth=1.4;for(let i=0;i<count;i++){const x=Math.random()*s,y=Math.random()*s,a=1.2+Math.random()*.7;g.strokeStyle=tones[i%tones.length];g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*7,y+Math.sin(a)*7);g.stroke();}});
const scallops=(base,edge)=>layers(fill(base),(g,s)=>{g.strokeStyle=edge;g.lineWidth=2;const step=s/8;for(let row=0;row<9;row++)for(let col=0;col<9;col++){g.beginPath();g.arc(col*step+(row%2)*step/2,row*step,step/2,.15*Math.PI,.85*Math.PI);g.stroke();}});

export const MODELS={
  frog(){
    const skin=mat('#8aa24c',{map:texture(256,layers(fill('#8aa24c'),sprinkle(['#6f8a3a','#a4b862'],900,1.6),sprinkle(['#3e4a25'],26,9)),2),roughness:.38}),
      belly=mat('#e7dcbc',{roughness:.45}),gold=mat('#c9952f',{roughness:.2,metalness:.1}),black=mat('#141414',{roughness:.15}),webM=mat('#9a9a5e',{side:T.DoubleSide,roughness:.5});
    const front='앞다리야. 뒷다리와 길이를 비교해 봐.';
    return [ball(skin,[0,.58,0],[1.05,.6,.8],2,null,[0,0,.32]),ball(belly,[.3,.5,0],[.78,.5,.64],2),ball(skin,[.88,.9,0],[.6,.4,.6],2),
      ...both(z=>[ball(gold,[.96,1.17,.31*z],[.17,.17,.17],0),ball(black,[1.07,1.21,.37*z],[.085,.085,.085],0),
        limb(skin,[.72,.55,.42*z],[.95,.08,.55*z],.08,-1,front),...[-.5,0,.5].map(a=>limb(skin,[.95,.05,.55*z],[.95+Math.cos(a+.2*z)*.22,.03,(.55+Math.sin(a+.2*z)*.22)*z],.03,-1,front)),
        limb(skin,[-.62,.45,.55*z],[-.05,.24,.98*z],.21,1),limb(skin,[-.05,.24,.98*z],[-.78,.12,1.06*z],.14,1),limb(skin,[-.78,.09,1.06*z],[-.2,.05,1.3*z],.08,1),
        webFoot(webM,skin,[-.2,.04,1.3*z],.5,-.25*z,1)])];
  },
  crab(){
    const shell=mat('#e08a52',{map:texture(256,layers(fill('#e08a52'),sprinkle(['#c46a38','#efa874','#a8552c'],700,2.2)),2),roughness:.55}),
      under=mat('#e8c9a0'),tip=mat('#6b2a17',{roughness:.4}),black=mat('#111',{roughness:.15});
    const legs=both(z=>[0,1,2,3].flatMap(k=>[limb(shell,[.3-.28*k,.5,.92*z],[.42-.4*k,.88,1.55*z],.09,1),limb(shell,[.42-.4*k,.88,1.55*z],[.5-.55*k,.03,1.98*z],.07,1)]));
    return [ball(shell,[0,.62,0],[.85,.34,1.15],2),ball(under,[0,.5,0],[.74,.24,1.02],2),...legs,
      ...both(z=>[limb(shell,[.7,.68,.22*z],[.88,.98,.26*z],.045,0),ball(black,[.9,1.03,.27*z],[.09,.09,.09],0),
        limb(shell,[.55,.5,.75*z],[1,.55,1.05*z],.11,1),limb(shell,[1,.55,1.05*z],[1.35,.52,.88*z],.12,1),ball(shell,[1.45,.5,.78*z],[.34,.22,.2],1,null,[0,.5*z,0]),
        limb(tip,[1.66,.56,.68*z],[1.92,.5,.48*z],.06,1),limb(tip,[1.64,.42,.72*z],[1.88,.45,.52*z],.05,1)])];
  },
  duck(){
    const grey=mat('#c9c0b2',{map:texture(256,scallops('#cbc3b5','#a99f90'),3)}),brown=mat('#7a4a32',{map:texture(256,scallops('#7d4b33','#5a3322'),3)}),
      wing=mat('#9a8670',{map:texture(256,scallops('#9c8872','#6f5d4b'),2)}),green=mat('#1f6b3a',{roughness:.3,metalness:.15}),blue=mat('#3a3a9a',{roughness:.3}),
      white=mat('#f4f1e8'),yellow=mat('#e0b93a',{roughness:.4}),orange=mat('#e8823a',{side:T.DoubleSide,roughness:.5}),toe=mat('#c96a2a'),black=mat('#111',{roughness:.15}),dark=mat('#203028');
    const eye='눈이야. 이번에는 부리·몸 표면·발을 살펴봐.';
    const ring=new T.Mesh(new T.TorusGeometry(.2,.035,8,24),white);ring.position.set(.78,1.42,0);ring.rotation.set(Math.PI/2,.35,0);
    return [ball(grey,[0,.95,0],[1.15,.66,.72],1),ball(brown,[.62,1.05,0],[.58,.6,.6],1),ball(dark,[-1.12,1.1,0],[.34,.15,.28],1,null,[0,0,.45]),ball(white,[-1.28,1.2,0],[.2,.06,.18],1,null,[0,0,.5]),
      tag(ring,1),limb(green,[.78,1.4,0],[.96,1.86,0],.21,1),ball(green,[1.02,2.05,0],[.38,.36,.33],1),
      ball(yellow,[1.48,1.97,0],[.34,.075,.17],0,null,[0,0,-.12]),ball(black,[1.8,1.93,0],[.05,.03,.07],0),
      ...both(z=>[ball(wing,[-.15,1.15,.52*z],[.9,.38,.14],1,null,[0,0,.14]),ball(blue,[-.28,1.06,.63*z],[.3,.09,.04],1),ball(black,[1.2,2.12,.25*z],[.05,.05,.05],-1,eye),
        limb(orange,[.08,.45,.28*z],[.12,.06,.3*z],.06,2),webFoot(orange,toe,[.12,.03,.3*z],.44,.1*z,2)])];
  },
  rabbit(){
    const fur=mat('#c4a47e',{map:texture(256,furLines('#c4a47e',['#d6bb98','#a08466','#e2cdb0'],2600),3),roughness:1}),
      light=mat('#e8ddcc',{map:texture(256,furLines('#e8ddcc',['#f6efe4','#cfc2ad'],1800),3),roughness:1}),pink=mat('#e7a9a6',{roughness:.6}),black=mat('#1a1410',{roughness:.15});
    const front='앞다리야. 뒷다리와 길이를 비교해 봐.',face='얼굴이야. 귀·몸 표면·뒷다리를 찾아봐.';
    return [ball(fur,[-.15,.75,0],[1,.74,.72],1),ball(fur,[.45,.86,0],[.55,.6,.55],1),ball(light,[.5,.6,0],[.45,.38,.45],1),ball(fur,[.86,1.45,0],[.5,.45,.42],1),
      ball(light,[1.24,1.34,0],[.22,.18,.22],1),ball(pink,[1.45,1.4,0],[.05,.04,.06],-1,face),ball(light,[-1.1,.88,0],[.25,.25,.25],1),
      ...both(z=>{const ear=new T.Group();ear.add(ball(fur,[0,0,0],[.16,.56,.07],0),ball(pink,[.06,-.02,0],[.1,.45,.05],0));ear.position.set(.66,2.28,.17*z);ear.rotation.set(-.14*z,0,.28);
        return [tag(ear,0),ball(black,[1.1,1.58,.3*z],[.08,.09,.06],-1,face),
          limb(fur,[.6,.55,.25*z],[.7,.08,.27*z],.09,-1,front),ball(light,[.8,.05,.27*z],[.14,.06,.09],-1,front),
          ball(fur,[-.45,.55,.45*z],[.5,.45,.25],2),limb(fur,[-.78,.09,.5*z],[.22,.09,.5*z],.1,2)];})];
  },
};
// Where each observation pin sits by default and from which direction the camera looks at it.
const PARTS={
  frog:{radius:5,anchors:[[1.07,1.25,.37],[-.4,.24,1.02],[-.1,1,.3]],views:[[.6,.55,.6],[-.25,.4,1],[.1,.85,.5]]},
  crab:{radius:6,anchors:[[.9,1.07,.27],[.05,.9,1.5],[0,.84,0]],views:[[.85,.45,.3],[.1,.5,1],[.2,.95,.2]]},
  duck:{radius:5.6,anchors:[[1.62,2,.1],[-.15,1.25,.72],[.34,.05,.38]],views:[[.75,.25,.6],[0,.3,1],[.5,.6,.65]]},
  rabbit:{radius:5.4,anchors:[[.7,2.45,.22],[-.25,1.3,.5],[-.3,.18,.64]],views:[[.4,.35,.85],[0,.5,1],[-.1,.35,1]]},
};

// opts: {animal, parts:[label], found:[i], pinned:[i], focus, onPick(i), onMiss(hint,{x,y}), onFail}
export function create(host,opts){
  let model=null,id=null,focus=-1,picked=-1,dead=false;const taps={};
  const stage=createStage(host,{target:[0,.85,0],theta:.8,phi:1.22,radius:5.4,minR:1.8,maxR:9,minPhi:.25,maxPhi:1.6,
    label:'3D 동물 표본. 한 손가락으로 돌리고 두 손가락으로 확대해. 아래 부분 버튼으로 살펴보거나 표본을 눌러 관찰핀을 꽂을 수 있어.',
    pickables:()=>model?[model]:[],onTap,onKey:()=>{if(focus>=0)pick(focus);},onFail:e=>opts.onFail?.(e)});
  const {scene}=stage,sun=new T.DirectionalLight('#fff6e0',2.4),fill=new T.DirectionalLight('#dfe9ff',.7);
  sun.position.set(3,6,4);fill.position.set(-4,2,-3);
  // No plinth: the specimen rests on the desk mat behind the canvas, with only its soft shadow.
  scene.add(new T.HemisphereLight('#fffbe8','#6b7a52',1.5),sun,fill,blobShadow(1.6));

  // Fit the actual specimen to this canvas, including narrow phone viewports.
  // Using a fixed distance/low target made short animals tiny and tall ears crop.
  const home=()=>{
    if(!model?.userData.glb){stage.goTo({theta:.8,phi:1.22,radius:PARTS[id].radius,tx:0,ty:.85,tz:0});return;}
    const box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3());
    const direction=new T.Vector3(Math.sin(1.22)*Math.sin(.8),Math.cos(1.22),Math.sin(1.22)*Math.cos(.8));
    const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right);
    const tanY=Math.tan(T.MathUtils.degToRad(stage.camera.fov/2))*.84,tanX=tanY*stage.camera.aspect;
    let radius=1.8;
    const p=new T.Vector3();model.updateMatrixWorld(true);
    const eachPoint=fn=>model.traverse(mesh=>{const positions=mesh.geometry?.attributes.position;if(!positions)return;
      for(let i=0;i<positions.count;i++){p.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);fn(p);}
    });
    let left=Infinity,rightmost=-Infinity,bottom=Infinity,top=-Infinity;
    eachPoint(p=>{p.sub(center);const x=p.dot(right),y=p.dot(up);left=Math.min(left,x);rightmost=Math.max(rightmost,x);bottom=Math.min(bottom,y);top=Math.max(top,y);});
    center.addScaledVector(right,(left+rightmost)/2).addScaledVector(up,(bottom+top)/2);
    eachPoint(p=>{
      // Empty bounding-box corners overestimate crouching animals: fit their silhouette.
      p.sub(center);const depth=p.dot(direction);
      radius=Math.max(radius,Math.abs(p.dot(right))/tanX+depth,Math.abs(p.dot(up))/tanY+depth);
    });
    stage.goTo({theta:.8,phi:1.22,radius,tx:center.x,ty:center.y,tz:center.z});
  };
  // Cached GLB clones share geometry with the cache, so only procedural models are disposed.
  function show(next){
    if(model){scene.remove(model);if(!model.userData.glb)model.traverse(x=>{x.geometry?.dispose();x.material?.map?.dispose();x.material?.dispose?.();});}
    model=next;scene.add(model);if(location.search.includes('regions')&&next.userData.glb)showRegions();pins();stage.request();
  }
  // ?regions draws the tap spheres, for tuning REGIONS against a new model.
  function showRegions(){const r=REGIONS[id],m=new T.MeshBasicMaterial({color:'#ff3b7f',wireframe:true});
    [...r.parts.flat(),...r.hints].forEach(([x,y,z,rad])=>{const s=new T.Mesh(new T.SphereGeometry(rad,12,8),m);s.position.set(x,y,z);s.raycast=()=>{};model.add(s);});}
  const ray=new T.Raycaster();
  function anchor(i){
    if(!model?.userData.glb)return new T.Vector3(...PARTS[id].anchors[i]);
    const r=REGIONS[id],c=new T.Vector3(...(r.parts[i][0]||r.center)),dir=new T.Vector3(...PARTS[id].views[i]).normalize();
    model.updateMatrixWorld(true);ray.set(c.clone().addScaledVector(dir,8),dir.negate());return ray.intersectObject(model,true)[0]?.point||c;
  }
  function pick(i){picked=i;focus=i;pins();opts.onPick?.(i);}
  function onTap(hit,pt){
    let o=hit?.object;while(o&&o.userData.part===undefined&&!o.userData.glb)o=o.parent;if(!o)return;
    const {part:p,hint}=o.userData.glb?regionAt(id,hit.point):o.userData;
    if(location.search.includes('pick-debug'))console.info('specimen-pick',id,JSON.stringify(hit.point.toArray().map(n=>+n.toFixed(3))),p);
    if(p<0){opts.onMiss?.(hint,pt);return;}
    taps[id+p]=hit.point.clone();pick(p);
  }
  function pins(){
    const part=PARTS[id];
    stage.setPins(opts.parts.map((label,i)=>({i,label})).filter(({i})=>opts.found.includes(i)||opts.pinned.includes(i)).map(({i,label})=>({
      pos:taps[id+i]||anchor(i),occlude:true,
      cls:(opts.found.includes(i)?'found ':'')+(i===focus?'focus':''),html:`<b>${opts.found.includes(i)?'✓':i+1}</b><span>${label}</span>`})));
  }
  function apply(o){
    opts=o;
    if(o.animal!==id){
      id=o.animal;stage.setLoading(true);show(new T.Group());
      loadAnimal(id).then(glb=>{if(id===o.animal&&!dead){glb.userData.glb=true;show(glb);home();stage.setLoading(false);}}).catch(error=>{if(id===o.animal&&!dead)opts.onFail?.(error);});
      focus=o.focus;home();
    }else if(o.focus!==focus){focus=o.focus;if(focus!==picked)stage.face(PARTS[id].views[focus],PARTS[id].radius*.6,anchor(focus).toArray());}
    picked=-1;pins();
  }
  apply(opts);
  // ?regions also exposes the viewer for tuning from the console.
  if(location.search.includes('regions'))window.__scan={stage,model:()=>model,anchor};
  return {attach(h,o){stage.attach(h);apply(o);},reset:home,destroy(){dead=true;stage.destroy();}};
}
