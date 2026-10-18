import * as T from './vendor/three/three.module.min.js';
export {T};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

// One renderer and an orbit camera tuned for small hands: one finger orbits, two fingers pinch,
// a short tap picks. Korean labels live in the DOM pin layer, never inside the 3D scene.
// o: {target,theta,phi,radius,minR,maxR,minPhi,maxPhi,fov,fps,pickables(),onTap(hit,point),onKey(key),tick(t),onFail}
export function createStage(host,o){
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputColorSpace=T.SRGBColorSpace;
  const canvas=renderer.domElement,scene=new T.Scene(),camera=new T.PerspectiveCamera(o.fov||35,1,.1,200);
  const box=document.createElement('div'),pinLayer=document.createElement('div'),loadingLabel=document.createElement('p');
  box.className='stage3d';pinLayer.className='pin-layer';canvas.tabIndex=0;canvas.setAttribute('aria-label',o.label||'3D 화면');
  loadingLabel.className='model-loading';loadingLabel.setAttribute('role','status');loadingLabel.textContent='동물 모형을 불러오고 있어…';loadingLabel.hidden=true;
  box.append(canvas,pinLayer,loadingLabel);
  const target=new T.Vector3(...o.target),home={theta:o.theta,phi:o.phi,radius:o.radius,tx:o.target[0],ty:o.target[1],tz:o.target[2]},orbit={...home},KEYS=Object.keys(home);
  let goal=null,raf=0,last=0,dead=false,pins=[];
  const ray=new T.Raycaster(),ndc=new T.Vector2(),tmp=new T.Vector3(),eye=new T.Vector3();

  function place(){
    const s=Math.sin(orbit.phi);target.set(orbit.tx,orbit.ty,orbit.tz);
    camera.position.set(target.x+orbit.radius*s*Math.sin(orbit.theta),target.y+orbit.radius*Math.cos(orbit.phi),target.z+orbit.radius*s*Math.cos(orbit.theta));
    camera.lookAt(target);
  }
  function frame(t){
    raf=0;if(dead)return;
    // ponytail: fixed frame cap (o.fps) instead of adaptive quality; lower it if old tablets stutter.
    if(o.fps&&t-last<1000/o.fps-2){request();return;}
    last=t;
    let moving=false;
    if(goal){const k=reduced()?1:.18;let left=0;for(const key of KEYS){orbit[key]+=(goal[key]-orbit[key])*k;left+=Math.abs(goal[key]-orbit[key]);}
      if(left<.003){Object.assign(orbit,goal);goal=null;}else moving=true;}
    if(o.tick?.(t))moving=true;
    place();renderer.render(scene,camera);drawPins();
    if(moving)request();
  }
  function request(){if(!raf&&!dead)raf=requestAnimationFrame(frame);}
  // Pins hidden behind the model (occlude) or facing away (normal) fade, so a far-side pin never marks the near side.
  function drawPins(){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    for(const p of pins){
      tmp.copy(p.pos).project(camera);
      let hidden=tmp.z>1||(!!p.normal&&p.normal.dot(eye.copy(camera.position).sub(p.pos))<0);
      if(!hidden&&p.occlude){const d=camera.position.distanceTo(p.pos);ray.set(camera.position,p.pos.clone().sub(camera.position).normalize());const hit=ray.intersectObjects(o.pickables(),true)[0];hidden=!!hit&&hit.distance<d-.06;}
      p.el.style.transform=`translate(${(tmp.x+1)/2*w}px,${(1-tmp.y)/2*h}px)`;
      p.el.classList.toggle('behind',hidden);
    }
  }
  function setPins(list){
    pinLayer.replaceChildren();
    pins=list.map(p=>{const el=document.createElement('span');el.className='pin3d '+(p.cls||'');el.innerHTML=p.html;pinLayer.append(el);return {...p,el};});
    request();
  }
  function resize(){
    const w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();request();
  }
  const ro=new ResizeObserver(resize);ro.observe(box);

  // Gestures
  const pts=new Map();let gesture=null;
  const pinchDist=()=>{const [a,b]=[...pts.values()];return Math.hypot(a.x-b.x,a.y-b.y)||1;};
  canvas.addEventListener('pointerdown',e=>{
    if(e.button>0)return;try{canvas.setPointerCapture(e.pointerId);}catch{}pts.set(e.pointerId,{x:e.clientX,y:e.clientY});goal=null;
    if(pts.size===1)gesture={x:e.clientX,y:e.clientY,t:performance.now(),moved:0,multi:false};else if(gesture)gesture.multi=true;
  });
  canvas.addEventListener('pointermove',e=>{
    const p=pts.get(e.pointerId);if(!p)return;e.preventDefault();
    const before=pts.size===2?pinchDist():0,dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(pts.size===1){if(gesture)gesture.moved+=Math.abs(dx)+Math.abs(dy);orbit.theta-=dx*.009;orbit.phi=clamp(orbit.phi-dy*.007,o.minPhi,o.maxPhi);}
    else if(pts.size===2)orbit.radius=clamp(orbit.radius*before/pinchDist(),o.minR,o.maxR);
    request();
  });
  const up=e=>{
    if(!pts.delete(e.pointerId))return;
    if(!pts.size&&gesture){const g=gesture;gesture=null;if(!g.multi&&g.moved<10&&performance.now()-g.t<700)tap(e.clientX,e.clientY);}
  };
  canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',e=>{e.preventDefault();goal=null;orbit.radius=clamp(orbit.radius*Math.exp(e.deltaY*.0012),o.minR,o.maxR);request();},{passive:false});
  canvas.addEventListener('keydown',e=>{
    const k=e.key;
    if(k==='ArrowLeft'||k==='ArrowRight')orbit.theta+=k==='ArrowLeft'?.25:-.25;
    else if(k==='ArrowUp'||k==='ArrowDown')orbit.phi=clamp(orbit.phi+(k==='ArrowUp'?-.15:.15),o.minPhi,o.maxPhi);
    else if(k==='+'||k==='=')orbit.radius=clamp(orbit.radius*.85,o.minR,o.maxR);
    else if(k==='-')orbit.radius=clamp(orbit.radius/.85,o.minR,o.maxR);
    else if(k==='Enter'||k===' '){o.onKey?.(k);}
    else return;
    e.preventDefault();goal=null;request();
  });
  // destroy() drops the context on purpose; only an unexpected loss falls back to 2D.
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!dead)o.onFail?.(new Error('context lost'));});
  function tap(x,y){
    const r=canvas.getBoundingClientRect();ndc.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);
    // A tap can land before the next frame; bring camera and matrices up to date first.
    place();scene.updateMatrixWorld();camera.updateMatrixWorld();ray.setFromCamera(ndc,camera);o.onTap?.(ray.intersectObjects(o.pickables(),true)[0]||null,{x,y});
  }

  // Glide to a view by the shortest way round.
  function goTo(g){
    const next={...orbit,...g},turn=2*Math.PI;
    next.theta=orbit.theta+((next.theta-orbit.theta)%turn+turn+Math.PI)%turn-Math.PI;
    next.phi=clamp(next.phi,o.minPhi,o.maxPhi);next.radius=clamp(next.radius,o.minR,o.maxR);goal=next;request();
  }
  host.append(box);resize();
  return {T,scene,camera,canvas,box,orbit,target,request,setPins,
    setLoading(loading){
      if(dead)return;
      if(!loading){place();renderer.render(scene,camera);drawPins();}
      box.classList.toggle('model-pending',loading);box.setAttribute('aria-busy',String(loading));loadingLabel.hidden=!loading;canvas.tabIndex=loading?-1:0;
    },
    // Look at a point from a world direction (from the point toward the camera).
    face(dir,radius=orbit.radius,at){const d=new T.Vector3(...dir).normalize();goTo({theta:Math.atan2(d.x,d.z),phi:Math.acos(d.y),radius,...(at?{tx:at[0],ty:at[1],tz:at[2]}:{})});},
    goTo,reset(){goTo(home);},
    attach(h){if(box.parentNode!==h)h.append(box);resize();},
    destroy(){
      dead=true;cancelAnimationFrame(raf);ro.disconnect();
      // Shared (cached GLB) resources stay for the next visit; the lost context frees their GPU copies.
      scene.traverse(x=>{if(x.userData.shared)return;x.geometry?.dispose();for(const m of [].concat(x.material||[])){m.map?.dispose();m.dispose();}});
      renderer.dispose();renderer.forceContextLoss();box.remove();
    }};
}

// Small canvas textures (≤256 px) so surfaces read as fur, feathers, skin or shell without image files.
export function texture(size,draw,repeat=1){
  const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);return t;
}
// A soft round shadow under a model (no shadow maps).
export function blobShadow(radius,opacity=.28){
  const map=texture(128,(g,s)=>{const r=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);r.addColorStop(0,'rgba(30,40,25,1)');r.addColorStop(1,'rgba(30,40,25,0)');g.fillStyle=r;g.fillRect(0,0,s,s);});
  const m=new T.Mesh(new T.PlaneGeometry(radius*2,radius*2),new T.MeshBasicMaterial({map,transparent:true,opacity,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.y=.005;m.raycast=()=>{};return m;
}
