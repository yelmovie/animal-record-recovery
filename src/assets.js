// Shared presentation boundary. Replace a raster with a model viewer here later;
// learning IDs, recorded evidence and save data must remain independent of rendering.
export const ASSETS = Object.freeze({
  crab: {src:'crab', label:'게'},
  frog: {src:'frog', label:'개구리'},
  rabbit: {src:'rabbit', label:'토끼'},
  marine: {src:'marine_fish', label:'바다 물고기'},
  flipper: {src:'flipper', label:'넓은 면을 가진 수영 오리발'},
  helmet: {src:'helmet', label:'머리를 감싸는 안전모'},
  coat: {src:'coat', label:'두툼한 안감이 있는 방한 외투'},
  pond: {src:'pond_base', label:'연못 지형'},
  lotus: {src:'lotus_leaf', label:'연잎'},
  reed: {src:'reed', label:'갈대'},
  case: {src:'evidence_case', label:'조사할 동물 기록과 돋보기'},
});
export const assetURL = id => new URL(`../assets/generated/${ASSETS[id].src}.webp`, import.meta.url).href;
export const sheetURL = sheet => new URL(`../assets/${sheet}.webp`, import.meta.url).href;
export const swimArtwork = kind => new URL(`../assets/adventure/swim-${kind}-v2.webp`, import.meta.url).href;
// A single transparent atlas keeps workshop objects consistent and shares one download.
export function workshopSprite(kind,x=0,y=0,width=100,height=100){
  const cells={swim:0,protect:1,warm:2,wide:3,dome:4,layer:5,web:6,shell:7,fur:8},cell=cells[kind];
  if(cell===undefined)throw new Error(`Unknown workshop sprite: ${kind}`);
  const regions=[[0,0,100,100],[100,0,100,100],[200,0,100,100],[0,100,100,90],[100,100,100,90],[200,100,100,90],[0,192,100,108],[100,194,100,106],[200,195,100,105]],r=regions[cell];
  return `<svg class="workshop-sprite" x="${x}" y="${y}" width="${width}" height="${height}" style="width:${width}px;height:${height}px;mix-blend-mode:darken" viewBox="0 0 ${r[2]} ${r[3]}" aria-hidden="true"><svg width="${r[2]}" height="${r[3]}" style="width:${r[2]}px;height:${r[3]}px" viewBox="${r.join(' ')}" overflow="hidden"><image href="${new URL('../assets/adventure/workshop-atlas.webp',import.meta.url).href}" width="300" height="300"/></svg></svg>`;
}
export function assetImage(id, className='', decorative=false) {
  const asset=ASSETS[id];
  if(!asset) throw new Error(`Unknown presentation asset: ${id}`);
  return `<img class="asset-image ${className}" src="${assetURL(id)}" alt="${decorative?'':asset.label}" width="1280" height="1280" decoding="async" draggable="false" data-asset="${id}" />`;
}
