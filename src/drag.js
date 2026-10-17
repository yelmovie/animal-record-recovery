// Finger/mouse drag for [data-drag] cards onto [data-drop-action] zones (screens 03, 04, 07).
// A tap without movement is left to the normal click, which runs the pick → place fallback.
export function enableDrag(root,onDrop){
  if(typeof root?.addEventListener!=='function')return;
  let d=null,suppress=false;
  root.addEventListener('pointerdown',e=>{const card=e.target.closest?.('[data-drag]');if(card&&e.button<=0)d={card,x:e.clientX,y:e.clientY,id:e.pointerId,ghost:null,zone:null};});
  root.addEventListener('pointermove',e=>{
    if(!d||e.pointerId!==d.id)return;
    if(!d.ghost){
      if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<8)return;
      const r=d.card.getBoundingClientRect();d.ghost=d.card.cloneNode(true);d.ghost.classList.add('drag-ghost');d.ghost.removeAttribute('data-action');
      Object.assign(d.ghost.style,{width:r.width+'px',height:r.height+'px',left:r.left+'px',top:r.top+'px'});document.body.append(d.ghost);d.card.classList.add('dragging');
    }
    e.preventDefault();d.ghost.style.transform=`translate(${e.clientX-d.x}px,${e.clientY-d.y}px) rotate(-3deg)`;
    const zone=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop-action]')||null;
    if(zone!==d.zone){d.zone?.classList.remove('drop-hover');zone?.classList.add('drop-hover');d.zone=zone;}
  });
  const end=e=>{
    if(!d||e.pointerId!==d.id)return;const {card,ghost,zone}=d;d=null;if(!ghost)return;
    ghost.remove();card.classList.remove('dragging');zone?.classList.remove('drop-hover');
    // The click that follows a drag must not also count as a tap.
    suppress=true;setTimeout(()=>{suppress=false;},0);
    if(zone)onDrop(card.dataset,zone.dataset);
  };
  root.addEventListener('pointerup',end);root.addEventListener('pointercancel',end);
  root.addEventListener('click',e=>{if(suppress){e.stopPropagation();e.preventDefault();}},true);
}
// The action a drop or a tap-placement runs, and the dataset it receives.
export const dropData=(card,zone)=>({action:zone.dropAction,dataset:{id:card.id||zone.id,value:card.value||zone.zone,key:zone.key,kind:card.kind}});
