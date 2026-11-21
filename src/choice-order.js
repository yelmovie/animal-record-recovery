// Choice order (A8, 2026-11-21): every question gets its own random order once per page load, so the right answer
// no longer sits in the same place each time. The order holds while the page stays open, so a wrong pick does not
// jump around under the finger when the screen redraws. Only the order changes: labels, values and checks stay as they are.
const orders=new Map();
export function shuffled(key,list){
  let order=orders.get(key);
  if(!order||order.length!==list.length){
    order=list.map((_,i)=>i);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    orders.set(key,order);
  }
  return order.map(i=>list[i]);
}
