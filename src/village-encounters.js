import {mountMapEncounters,normalizeMapHits} from './map-encounters.js';

// This copy ships with its own map so offline play needs no cross-project request.
const STAGES = [
  ["stamp", "file", "개구리랑 게를 눈썰미로 구별해? 내 가짜 발자국은 어쩌라고!", "다음엔 도장에 꼬리까지 그려 주지!", "앗, 발자국 도장이 거꾸로!", "사진첩까지 펼쳐졌잖아!", "흥, 진짜 동물 사진은 돌려줄게!"],
  ["label", "label", "날개가 있는지로 나눴어? 그럼 내 이름표 바꿔치기는 들통이잖아!", "내 기준은 간단해. 내 편, 내 편 아닌 편!", "앗, 분류표가 제자리로!", "내 멋대로 붙인 이름표가 떨어져!", "쳇, 누구나 쓸 수 있는 기준이라니 반칙이야!"],
  ["flip", "flip", "게가 어디 사는지까지 알아냈어? 내 뒤집힌 안내판을 믿으란 말이야!", "물가 안내판에 내 비밀 기지도 그려 둘까?", "앗, 물가 기록이 보이잖아!", "개구리랑 게 자리가 다 돌아왔어!", "흥, 안내판에서 내 비밀 기지는 지울게!"],
  ["photo", "lens", "사진을 가렸는데 발과 털만 보고 찾았어? 탐정이 너무 많아!", "다음엔 내 사진부터 토끼로 바꿔야겠군!", "앗, 내가 가린 사진이 열렸어!", "동물 안내 카드까지 완성됐잖아!", "쳇, 내 가짜 단서는 가져갈게!"],
  ["plans", "file", "동물의 특징으로 발명까지 해? 그 설계도, 악당 공방에 납품해!", "내 발명품은 설계도 훔치는 주머니야!", "앗, 설계도 두루마리가 풀렸어!", "내 주머니에 구멍이 났잖아!", "흥, 전시회는 열어. 난 발명부터 다시 배울래!"],
];
const palette = '#e66060';
const art = {
  left: new URL('../assets/village/map-villain-left-v2.webp', import.meta.url).href,
  right: new URL('../assets/village/map-villain-right-v2.webp', import.meta.url).href,
  frames: 6,
};
const reactions = [
  new URL('../assets/village/map-hero-reaction-v2.webp', import.meta.url).href,
  new URL('../assets/village/map-ally-reaction-v2.webp', import.meta.url).href,
];
const sizes = [73, 55];

export function normalizeVillageEncounters(value,legacy) {
  // Old releases stored numeric slots; retain valid previous strikes/defeats.
  const previous=Object.fromEntries(STAGES.map(([id],i)=>[id,
    Number.isInteger(legacy?.[i])&&legacy[i]>=1&&legacy[i]<=3?legacy[i]:0]));
  return {...normalizeMapHits(previous,STAGES.map(([id])=>id)),...normalizeMapHits(value,STAGES.map(([id])=>id))};
}

export function mountVillageEncounters({host,stages,progress,onSave,blocked,reduced,tone,actors,clearIndex}) {
  const points=stages.flatMap((stage,i)=>{
    if(!stage||!STAGES[i])return [];
    const [id,prop,first,again,hitOne,hitTwo,finish]=STAGES[i];
    return [{id,prop,lines:[first,again],hit:[hitOne,hitTwo],finish,speaker:"기록 도둑",...stage}];
  });
  if(!points.some(({id})=>(progress?.[id]||0)<3))return null;
  const runtime=mountMapEncounters({requiredFoes:5,host,stages:points,progress,onSave,blocked,reduced,tone,art,palette,clearStage:()=>STAGES[clearIndex]?.[0],
    reach:76,contact:23});
  const layer=host.querySelector('.map-encounter-layer');
  const poses=reactions.map((src,i)=>{
    const el=document.createElement('span');
    el.className='map-encounter-reaction';el.hidden=true;el.setAttribute('aria-hidden','true');
    el.dataset.actor=i?'ally':'hero';
    const sheet=new Image();sheet.src=src;
    Object.assign(el.style,{position:'absolute',left:'0',top:'0',pointerEvents:'none',backgroundImage:`url("${src}")`,
      backgroundRepeat:'no-repeat',backgroundSize:`${i?400:800}% 100%`,
      filter:'drop-shadow(0 1px 1px #15232870)',zIndex:'1'});
    layer.append(el);return {el,sheet};
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
        const {el,sheet}=poses[i],state=events[key],point=state&&input[key]&&input.project(input[key]);
        const visible=Boolean(point&&state&&sheet.naturalWidth&&!blocked?.());
        setOriginal[i]?.(!visible);el.hidden=!visible;
        if(!visible){delete el.dataset.pose;continue;}
        el.dataset.pose=state.kind;
        const scale=input.scale??1,size=Math.max(29,Math.min(140,sizes[i]*scale));
        const frame=state.frame+(i===0&&state.kind==='hurt'?4:0);
        Object.assign(el.style,{width:`${size}px`,height:`${size}px`,backgroundPosition:`${frame/(i?3:7)*100}% 50%`,
          transform:`translate(${point.x+state.dx*scale-size/2}px,${point.y-size}px) scaleX(${state.direction===1?-1:1})`});
      }
    },
    destroy(){setOriginal.forEach(show=>show(true));runtime.destroy();},
  };
}
