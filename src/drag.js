// Prefer an explicit label; on the product itself snap to the nearest physical attachment point.
export function nearestAttachment(point,spots){return spots.reduce((best,spot)=>{const d=(spot.x-point.x)**2+(spot.y-point.y)**2;return !best||d<best.distance?{...spot,distance:d}:best;},null);}
function dropTarget(root,card,x,y){
 const hit=root.ownerDocument.elementFromPoint(x,y),exact=hit?.closest('[data-drop-action]');
 if(exact&&root.contains(exact))return exact;
 if(!card.classList.contains('part-card'))return null;
 const assembly=root.querySelector('.assembly'),box=assembly?.getBoundingClientRect();
 if(!box||x<box.left-20||x>box.right+20||y<box.top-20||y>box.bottom+20)return null;
 const points=[...assembly.querySelectorAll('.part-spot[data-anchor-x]')].map(el=>({el,x:box.left+Number(el.dataset.anchorX)/320*box.width,y:box.top+Number(el.dataset.anchorY)/260*box.height}));
 return nearestAttachment({x,y},points)?.el||null;
}
// Finger/mouse drag, with tap → place as an equally valid fallback.
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
      root.classList.toggle('part-dragging',d.card.classList.contains('part-card'));root.setPointerCapture?.(e.pointerId);
    }
    e.preventDefault();d.ghost.style.transform=`translate(${e.clientX-d.x}px,${e.clientY-d.y}px) rotate(-3deg)`;
    const zone=dropTarget(root,d.card,e.clientX,e.clientY);
    if(zone!==d.zone){d.zone?.classList.remove('drop-hover');zone?.classList.add('drop-hover');d.zone=zone;}
  });
  const end=e=>{
    if(!d||e.pointerId!==d.id)return;const {card,ghost,zone}=d;d=null;if(!ghost)return;
    ghost.remove();card.classList.remove('dragging');zone?.classList.remove('drop-hover');root.classList.remove('part-dragging');if(root.hasPointerCapture?.(e.pointerId))root.releasePointerCapture(e.pointerId);
    // The click that follows a drag must not also count as a tap.
    suppress=true;setTimeout(()=>{suppress=false;},0);
    if(zone&&e.type!=='pointercancel')onDrop(card.dataset,zone.dataset);
  };
  root.addEventListener('pointerup',end);root.addEventListener('pointercancel',end);
  root.addEventListener('click',e=>{if(suppress){e.stopPropagation();e.preventDefault();}},true);
}
// The action a drop or a tap-placement runs, and the dataset it receives.
export const dropData=(card,zone)=>({action:zone.dropAction,dataset:{id:card.id||zone.id,value:card.value||zone.zone,key:zone.key,kind:card.kind}});
