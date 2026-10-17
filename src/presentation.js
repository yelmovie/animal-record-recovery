import {assetImage as originalImage, sheetURL} from './assets.js';
export {sheetURL};
export const artURL=id=>new URL(`../assets/adventure/${id}.webp`,import.meta.url).href;
const newImages={explorer:'하루 탐험가',duck:'오리',butterfly:'나비',goldfish:'금붕어',bee:'벌',snail:'달팽이',bat:'박쥐',hen:'닭','field-kit':'탐사 장비 상자'};
export function art(id,cls='',decorative=false){return Object.hasOwn(newImages,id)?`<img class="art ${cls}" src="${artURL(id)}" alt="${decorative?'':newImages[id]}" decoding="async" draggable="false" data-image="${id}">`:originalImage(id,`art ${cls}`,decorative).replace('data-asset=','data-image=');}
export const sprite=(sheet,col=0,row=0,cls='',label='')=>`<span class="sprite ${cls}" style="--sheet:url('${sheetURL(sheet)}');--col:${col};--row:${row}" ${label?`role="img" aria-label="${label}"`:'aria-hidden="true"'}></span>`;
export const mori=(pose=1,cls='')=>sprite('raccoon',pose%4,Math.floor(pose/4),`mori ${cls}`);
export const animal=(id,cls='')=>art(id==='fish'?'goldfish':id,`animal ${cls}`);
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// A blocked button stays tappable and says why (a silent grey button reads as "broken" to young learners).
export const off=why=>`aria-disabled="true" data-why="${esc(why)}"`;
export const btn=(label,action,cls='',data='')=>`<button type="button" class="btn ${cls}" data-action="${action}" ${data}>${label}</button>`;
export const choice=(label,action,value,selected=false,data='',extra='')=>btn(`${icon(selected?'check':'leaf')}<span>${label}</span>`,action,`choice ${selected?'selected':''} ${extra}`,`data-value="${value}" aria-pressed="${selected}" ${data}`);
export const progress=(s,id)=>[0,1,2,3].map(i=>`<i class="${s.activities.includes(`${id}-${i}`)?'earned':''}">${icon('star')}</i>`).join('');
export function icon(name,cls=''){
  const paths={leaf:'M20 4C8 2 3 9 6 17c8 4 15-1 14-13ZM6 18l9-9',search:'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',layers:'m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5',scan:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10m-5-5v10',tool:'m14 5 5 5M5 21l-2-2L15 7l-1-4 4 1 3 3-1 4-4-1L5 21Z',book:'M12 5v16M3 3l9 2 9-2v16l-9 2-9-2V3Z',home:'m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7',arrow:'M4 12h16m-6-6 6 6-6 6',back:'M20 12H4m6-6-6 6 6 6',check:'m5 12 4 4L19 6',lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Zm7 4v3',close:'m6 6 12 12M18 6 6 18',star:'m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',reset:'M4 9a8 8 0 1 1 0 7M4 3v6h6',settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Zm7 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0',muted:'M4 9h4l5-4v14l-5-4H4V9Zm13 0 5 6m0-6-5 6',sound:'M4 9h4l5-4v14l-5-4H4V9Zm13-2c4 3 4 7 0 10',compass:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM16 8l-3 5-5 3 3-5 5-3',bag:'M7 7V5a5 5 0 0 1 10 0v2M4 7h16v15H4V7Zm0 7h16'};
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.leaf}"/></svg>`;
}
