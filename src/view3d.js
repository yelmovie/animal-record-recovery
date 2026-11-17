// 3D screens (02 scanner, 06 dome, 07 life path, stage-3 relay) load three.js only when opened. Without WebGL — or with ?2d in
// the address — the 2D screens stay, and a failed load or a lost context falls back to them too.
let support=null;
export function can3d(){
  if(support!==null)return support;
  try{
    if(/[?&]2d\b/.test(location.search))return support=false;
    const c=document.createElement('canvas'),gl=c.getContext('webgl2')||c.getContext('webgl');
    support=!!gl;gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }catch{support=false;}
  return support;
}
export function disable3d(){support=false;}
const load=kind=>kind==='dome'?import('./dome3d.js'):kind==='linkrun'?import('./link-run3d.js'):kind==='relay'?import('./relay3d.js'):import('./scanner3d.js');
// The handle exists right away; the real viewer arrives when its module has loaded.
export function mount3d(kind,host,opts){
  let viewer=null,dead=false,last=opts;
  const handle={kind,
    attach(h,o){host=h;last=o;viewer?.attach(h,o);},
    call(name,...args){viewer?.[name]?.(...args);},
    destroy(){dead=true;viewer?.destroy();viewer=null;}};
  load(kind).then(m=>{if(!dead)viewer=m.create(host,last);}).catch(error=>{if(!dead)last.onFail?.(error);});
  return handle;
}
// Start downloading a 3D screen (module, three.js, models) ahead of time; failures are ignored here.
export function warm3d(kind,ids){if(!can3d()||navigator.connection?.saveData||/^(slow-)?2g$/.test(navigator.connection?.effectiveType||''))return;load(kind).then(m=>m.warm(ids)).catch(()=>{});}
