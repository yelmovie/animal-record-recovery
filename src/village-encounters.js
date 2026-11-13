import {mountMapEncounters,normalizeMapHits} from './map-encounters.js';

// This copy ships with its own map so offline play needs no cross-project request.
const STAGES = [
  [
    "stamp",
    "file",
    "이 발자국, 내가 방금 만들었지!",
    "발자국 하나 더 찍을까?"
  ],
  [
    "label",
    "label",
    "이름표만 바꾸면 모르겠지?",
    "이번엔 어느 이름표를 바꿀까?"
  ],
  [
    "flip",
    "flip",
    "아까 기록은 이쪽이었나?",
    "기록을 또 뒤집어 볼까?"
  ],
  [
    "photo",
    "lens",
    "이 사진은 내가 잠깐 빌릴게!",
    "가면 뒤에는 아무것도 없어!"
  ],
  [
    "plans",
    "file",
    "설계도는 내가 먼저 봐야지!",
    "이 설계도는 둘둘 말아야지!"
  ]
];
const hit = ["앗, 내 도장이 흔들려!", "기록장이 바람에 날아가!"], finish = "앗, 기록은 돌려줄게!";
const palette = '#e66060';
const art = {
  left: new URL('../assets/village/map-villain-left.webp', import.meta.url).href,
  right: new URL('../assets/village/map-villain-right.webp', import.meta.url).href,
  frames: 6,
};
const reactions = [
  new URL('../assets/village/map-hero-reaction.webp', import.meta.url).href,
  new URL('../assets/village/map-ally-reaction.webp', import.meta.url).href,
];
const sizes = [73, 55];

export function normalizeVillageEncounters(value,legacy) {
  // Old releases stored numeric slots; retain valid previous strikes/defeats.
  const previous=Object.fromEntries(STAGES.map(([id],i)=>[id,
    Number.isInteger(legacy?.[i])&&legacy[i]>=1&&legacy[i]<=3?legacy[i]:0]));
  return {...normalizeMapHits(previous,STAGES.map(([id])=>id)),...normalizeMapHits(value,STAGES.map(([id])=>id))};
}

export function mountVillageEncounters({host,stages,progress,onSave,blocked,reduced,tone,actors}) {
  const points=stages.flatMap((stage,i)=>{
    if(!stage||!STAGES[i])return [];
    const [id,prop,first,again]=STAGES[i];
    return [{id,prop,lines:[first,again],hit,finish,...stage}];
  });
  if(!points.some(({id})=>(progress?.[id]||0)<3))return null;
  const runtime=mountMapEncounters({host,stages:points,progress,onSave,blocked,reduced,tone,art,palette,
    reach:76,contact:23});
  const layer=host.querySelector('.map-encounter-layer');
  const poses=reactions.map((src,i)=>{
    const el=document.createElement('span');
    el.className='map-encounter-reaction';el.hidden=true;el.setAttribute('aria-hidden','true');
    Object.assign(el.style,{position:'absolute',left:'0',top:'0',pointerEvents:'none',backgroundImage:`url("${src}")`,
      backgroundRepeat:'no-repeat',backgroundSize:`${i?400:800}% 100%`,
      filter:'drop-shadow(0 1px 1px #15232870)',zIndex:'1'});
    layer.append(el);return el;
  });
  const setOriginal=actors.map(actor=>{
    let previous=true;
    return visible=>{
      if(!actor||visible===previous)return;previous=visible;
      if(typeof actor==='function')actor(visible);else actor.style.opacity=visible?'':'0';
    };
  });
  return {
    update(input){
      const events=runtime.update(input);
      for(const [i,key] of ['hero','ally'].entries()){
        const el=poses[i],state=events[key],point=state&&input[key]&&input.project(input[key]);
        const visible=Boolean(point&&state&&!blocked?.());
        setOriginal[i]?.(!visible);el.hidden=!visible;
        if(!visible)continue;
        const scale=input.scale??1,size=Math.max(29,Math.min(140,sizes[i]*scale));
        const frame=state.frame+(i===0&&state.kind==='hurt'?4:0);
        Object.assign(el.style,{width:`${size}px`,height:`${size}px`,backgroundPosition:`${frame/(i?3:7)*100}% 50%`,
          transform:`translate(${point.x+state.dx*scale-size/2}px,${point.y-size}px) scaleX(${state.direction===1?-1:1})`});
      }
    },
    destroy(){setOriginal.forEach(show=>show(true));runtime.destroy();},
  };
}
