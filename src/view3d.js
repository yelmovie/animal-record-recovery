// 3D screens (02 scanner, 06 dome) load three.js only when opened. Without WebGL — or with ?2d in
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
// The handle exists right away; the real viewer arrives when its module has loaded.
export function mount3d(kind,host,opts){
  let viewer=null,dead=false,last=opts;
  const handle={kind,
    attach(h,o){host=h;last=o;viewer?.attach(h,o);},
    call(name,...args){viewer?.[name]?.(...args);},
    destroy(){dead=true;viewer?.destroy();viewer=null;}};
  (kind==='dome'?import('./dome3d.js'):import('./scanner3d.js')).then(m=>{if(!dead)viewer=m.create(host,last);}).catch(error=>{if(!dead)last.onFail?.(error);});
  return handle;
}
