import {createRewardCards} from './reward-cards.js';
import {STAGES} from './expedition.js';

// One achievement card per map villain, in the villain order of village-encounters.js. The star count rises with the place number.
const CARDS=[['stamp','동물 특징 관찰 탐정'],['label','분류 기준 척척박사'],['flip','사는 곳 생태 기록왕'],['photo','단서 추리 동물 탐정'],['plans','동물 박사 발명 영웅']];
export const REWARD_CARDS=CARDS.map(([id,title],index)=>({id,title,stage:STAGES[index].name,
  art:new URL(`../assets/reward-cards/card-${index+1}-${id}.webp`,import.meta.url).href,
  thumb:new URL(`../assets/reward-cards/thumb-${index+1}-${id}.webp`,import.meta.url).href}));
const HITS=3;
// A card is owned once its villain has taken all three hits. Nothing extra is saved.
export const ownedRewardCards=hits=>REWARD_CARDS.map(({id})=>hits?.[id]===HITS);
// Card indexes won by this save patch: only the hit that takes a villain from under three to three.
export const newRewardCards=(before,patch)=>REWARD_CARDS.flatMap(({id},index)=>before?.[id]!==HITS&&patch?.[id]===HITS?[index]:[]);

const SOUNDS={whoosh:'card-whoosh',reveal:'card-reveal',epic:'card-epic',slot:'card-slot',complete:'card-complete'};
let cue=()=>{};
// adventure-app.js hands over its sound call, so the cards follow the sound switch and volume.
export function bindRewardSound(play){cue=play;}

// Built on first use: tests load this module without a browser.
let instance;
function rewards(){
  return instance??=createRewardCards({
    setName:'동물기록 성취 카드',
    cards:REWARD_CARDS,
    theme:{accent:'#c48b31',accent2:'#2d5542',glow:'#f5d27d',ink:'#263f35'},
    particles:['leaf','spark','star','heart'],
    colors:['#f5d27d','#dfedb2','#c48b31','#97c7c2','#e7ad83','#ffffff'],
    // The leaf of the app icon (index.html).
    emblem:'<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 29Q7 9 31 8Q33 30 10 29M11 29L26 14" fill="#d5ed96" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sound:name=>cue(SOUNDS[name]),
    inertRoot:()=>document.querySelector('#app'),
  });
}

// A card on its way to a slot stays empty in the header until it lands, even if the header is redrawn in between.
const flying=new Set();
export const rewardSlotsHtml=hits=>rewards().slotsHtml(ownedRewardCards(hits).map((owned,index)=>owned&&!flying.has(index)));
// Shows the card once the villain's exit has played (delay), flying in from the villain while it is still on screen.
// hits() returns the saved hit record at that moment; open() says whether the map is still the screen in view.
export function awardRewardCard(index,hits,open,delay){
  flying.add(index);
  setTimeout(()=>{
    if(!open()){flying.delete(index);return;}
    const foe=document.querySelector(`.map-encounter-foe[data-encounter="${REWARD_CARDS[index].id}"]`),box=foe?.getClientRects().length?foe.getBoundingClientRect():null;
    rewards().reveal(index,box?{x:box.left,y:box.top-28}:undefined,ownedRewardCards(hits())).finally(()=>flying.delete(index));
  },delay);
}
