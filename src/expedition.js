import {normalizeExperiment,normalizeInquiry,experimentReady,MOTIONS,MOTION_KEY_FRAME} from './inquiry.js';
// Learning and progression are independent of the image / map presentation.
import {restoreState as restoreLegacy, testDesign, PROBLEMS} from './model.js';
export {testDesign, PROBLEMS};
export const STORAGE_KEY='animal-record-recovery:v1';
export const VERSION=3;
export const STAGES=[
  {id:1,name:'관찰의 숲',short:'관찰',icon:'search',color:'#c5dc91',standard:'4과02-01',reward:'관찰 렌즈',rewardIcon:'search',benefit:'가방에서 꺼내면 동물 몸을 다시 크게 볼 수 있어.',story:'뒤섞인 동물 사진에 특징을 기록해 줘!',change:'숲 전망대의 동물 사진첩을 되찾았어.',x:19,y:48,art:'frog',tasks:['개구리와 게 관찰','첫 번째 비교','오리와 토끼 관찰','두 번째 비교']},
  {id:2,name:'분류의 정원',short:'분류',icon:'layers',color:'#f1d799',standard:'4과02-01',reward:'분류 나침반',rewardIcon:'compass',benefit:'환경 탐사에서 아직 못 찾은 동물이 어디 있는지 알려 줘.',story:'누구나 같은 결과를 얻는 분류 표지판을 만들어 줘!',change:'정원에 두 가지 분류 표지판이 생겼어.',x:32,y:31,art:'butterfly',tasks:['날개로 나누기','첫 기준 확인','내 기준 세우기','두 기준 비교하기']},
  {id:3,name:'생태의 물가',short:'환경',icon:'leaf',color:'#b4d9d1',standard:'4과02-02',reward:'서식지 수첩',rewardIcon:'book',benefit:'동물 찾기에서 내가 발견한 사는 곳 기록을 다시 볼 수 있어.',story:'여섯 동물이 사는 곳과 생활 모습을 안내판에 담아 줘!',change:'물가의 생태 안내판에 여섯 동물이 돌아왔어.',x:63,y:32,art:'pond',tasks:['첫 동물 세 마리','개구리의 생활','새 동물 세 마리','게의 생활']},
  {id:4,name:'동물 찾기 안내소',short:'찾기',icon:'scan',color:'#d1c9df',standard:'4과02-01 · 4과02-02',reward:'특징 스캐너',rewardIcon:'scan',benefit:'발명할 때 동물 특징이 물건의 어느 부분이 되는지 알려 줘.',story:'모리가 모은 사진에 특징과 사는 곳을 붙여 줘!',change:'안내소에 오리와 토끼의 동물 안내 카드가 완성됐어.',x:78,y:49,art:'duck',tasks:['단서로 동물 찾기','생활 안내 만들기','새 동물 찾기','생활 안내 만들기']},
  {id:5,name:'발명의 공방',short:'발명',icon:'tool',color:'#edc3a4',standard:'4과02-03',reward:'발명가 배지',rewardIcon:'star',benefit:'두 발명과 탐험 기록이 나만의 결과물로 완성돼.',story:'서로 다른 생활 문제 두 가지를 동물의 특징으로 해결해 줘!',change:'네가 설계한 두 발명품으로 탐험대 전시회가 열렸어.',x:82,y:79,art:'flipper',tasks:['오리발 만들기','바꾸며 시험하기','새 발명 만들기','시험하고 소개하기']},
];

export const ANIMALS={
  frog:{name:'개구리',legs:true,wings:false,four:true,web:true,fur:false,fin:false,six:false,cover:'맨살',habitat:'pond',fact:'긴 뒷다리와 물갈퀴가 있어. 물가에서 뛰거나 헤엄쳐.'},
  crab:{name:'게',legs:true,wings:false,four:false,web:false,fur:false,fin:false,six:false,cover:'껍데기',habitat:'coast',fact:'단단한 껍데기와 집게다리, 여러 걷는 다리가 있어.'},
  duck:{name:'오리',legs:true,wings:true,four:false,web:true,fur:false,fin:false,six:false,cover:'깃털',habitat:'pond',fact:'깃털로 덮인 몸, 넓적한 부리와 물갈퀴가 있어.'},
  rabbit:{name:'토끼',legs:true,wings:false,four:true,web:false,fur:true,fin:false,six:false,cover:'털',habitat:'forest',fact:'몸이 털로 덮여 있고 긴 귀와 긴 뒷다리가 있어.'},
  fish:{name:'금붕어',legs:false,wings:false,four:false,web:false,fur:false,fin:true,six:false,cover:'비늘',habitat:'pond',fact:'지느러미와 비늘이 있어. 물속에서 헤엄쳐.'},
  butterfly:{name:'나비',legs:true,wings:true,four:false,web:false,fur:false,fin:false,six:true,cover:'날개',habitat:'forest',fact:'다리가 여섯 개이고 더듬이와 두 쌍의 날개가 있어.'},
  hen:{name:'닭',legs:true,wings:true,four:false,web:false,fur:false,fin:false,six:false,cover:'깃털',habitat:'forest',fact:'깃털로 덮인 몸에 날개와 부리가 있고, 두 다리로 걸어 다녀.'},
  bat:{name:'박쥐',legs:true,wings:true,four:false,web:false,fur:true,fin:false,six:false,cover:'털',habitat:'forest',fact:'털로 덮인 몸에 얇은 피부로 된 날개가 있어. 낮에는 동굴에 매달려 쉬어.'},
  bee:{name:'벌',legs:true,wings:true,four:false,web:false,fur:true,fin:false,six:true,cover:'잔털',habitat:'forest',fact:'다리가 여섯 개이고 투명한 날개 두 쌍과 더듬이가 있어.'},
  snail:{name:'달팽이',legs:false,wings:false,four:false,web:false,fur:false,fin:false,six:false,cover:'껍데기',habitat:'forest',fact:'나선 모양 껍데기를 지고, 다리 없이 넓은 배발로 기어가.'},
  marine:{name:'바다 물고기',legs:false,wings:false,four:false,cover:'비늘',habitat:'coast',fact:'지느러미로 바닷물 속을 헤엄쳐.'},
};
// Sorting questions. Observable ones give everyone the same answer; the others are opinions.
export const CRITERIA={wings:'날개가 있나요?',legs:'다리가 있나요?',four:'다리가 네 개인가요?',web:'발가락 사이에 물갈퀴가 있나요?',fur:'몸이 털로 덮였나요?',fin:'지느러미가 있나요?',six:'다리가 여섯 개인가요?',cute:'귀엽나요?',scary:'무섭게 생겼나요?',fast:'빨리 달리나요?'};
export const OWN_CRITERIA=['legs','web','fin','six'],OPINION_CRITERIA=['scary','fast'];
// Screen 05: questions anyone can check on the body; the rest depend on who answers.
export const OBSERVABLE=['wings','legs','four','web','fin','six'];
// Researchers A/B/C answer opinion questions differently (fixed data, y/n per researcher).
export const OPINION_ANSWERS={
 fast:{frog:'yny',duck:'nny',rabbit:'yyy',crab:'nyn',fish:'yny',butterfly:'yyn',hen:'nyn',bat:'yyy',bee:'yny',snail:'nnn'},
 cute:{frog:'nyn',duck:'yyn',rabbit:'yyy',crab:'nny',fish:'yny',butterfly:'yyn',hen:'nyn',bat:'nny',bee:'ynn',snail:'nyy'},
 scary:{frog:'nny',duck:'nnn',rabbit:'nnn',crab:'yny',fish:'nny',butterfly:'nny',hen:'nnn',bat:'yyn',bee:'yny',snail:'nyn'},
};
export const researcherAnswers=(key,id)=>OBSERVABLE.includes(key)?[0,1,2].map(()=>ANIMALS[id][key]?'yes':'no'):[...(OPINION_ANSWERS[key]?.[id]||'nnn')].map(c=>c==='y'?'yes':'no');
export const disagreements=key=>SORT_ANIMALS.filter(id=>new Set(researcherAnswers(key,id)).size>1);
export const VAGUE=['fast','scary'];
export const CAUSES=[['opinion','‘빠르다’는 사람마다 생각하는 기준이 달라서'],['few','동물 수가 너무 적어서','동물 수를 늘려도 연구원마다 답이 달라.'],['mistake','한 연구원이 동물을 잘못 봐서','세 연구원 모두 같은 동물 그림을 봤어. 그림이 아니라 질문이 문제야.']];
export const SORT_ANIMALS=['frog','duck','rabbit','crab','fish','butterfly','hen','bat','bee','snail'];
export const OBSERVATIONS={
  frog:[{id:'frog-eye',label:'눈',text:'머리 위쪽에 튀어나온 눈이 있어.',wrong:['자루 끝에 달린 눈이 있어.','털 사이에 작은 눈이 숨어 있어.'],x:68,y:22},{id:'frog-leg',label:'뒷다리',text:'앞다리보다 긴 뒷다리가 있어.',wrong:['앞다리와 뒷다리 길이가 똑같아.','다리가 없고 지느러미가 있어.'],x:23,y:61},{id:'frog-skin',label:'몸 표면',text:'털이나 깃털 없이 맨살이 드러나 있어.',wrong:['단단한 껍데기가 몸을 감싸.','부드러운 털로 덮여 있어.'],x:47,y:40}],
  crab:[{id:'crab-eye',label:'눈',text:'자루 끝에 달린 눈이 있어.',wrong:['머리 위쪽에 튀어나온 눈이 있어.','눈이 없어.'],x:60,y:27},{id:'crab-leg',label:'다리',text:'집게다리와 여러 개의 걷는 다리가 있어.',wrong:['긴 뒷다리 두 개와 짧은 앞다리 두 개가 있어.','다리가 두 개뿐이야.'],x:16,y:58},{id:'crab-shell',label:'몸 표면',text:'단단한 껍데기가 몸을 감싸.',wrong:['털이나 깃털 없이 맨살이 드러나 있어.','깃털로 덮여 있어.'],x:50,y:40}],
  duck:[{id:'duck-bill',label:'부리',text:'넓적한 부리가 있어.',wrong:['뾰족하고 짧은 부리가 있어.','부리가 없고 입술이 있어.'],x:20,y:30},{id:'duck-wing',label:'몸 표면',text:'깃털로 덮여 있고 날개가 있어.',wrong:['몸이 털로 덮여 있어.','털이나 깃털 없이 맨살이 드러나 있어.'],x:61,y:50},{id:'duck-feet',label:'발',text:'두 발의 발가락 사이에 물갈퀴가 있어.',wrong:['발가락이 따로 떨어져 있고 사이에 막이 없어.','발 대신 지느러미가 있어.'],x:50,y:86}],
  rabbit:[{id:'rabbit-ear',label:'귀',text:'길게 솟은 귀가 있어.',wrong:['귀가 짧고 둥글어.','귀가 거의 보이지 않아.'],x:46,y:18},{id:'rabbit-fur',label:'몸 표면',text:'몸이 털로 덮여 있어.',wrong:['깃털로 덮여 있어.','단단한 껍데기가 몸을 감싸.'],x:51,y:48},{id:'rabbit-leg',label:'뒷다리',text:'길고 튼튼한 뒷다리와 앞다리, 네 다리가 있어.',wrong:['다리가 여섯 개 있어.','앞다리가 뒷다리보다 훨씬 길어.'],x:33,y:76}],
};
export const OBSERVE_PAIRS=[['frog','crab'],['duck','rabbit']];
// The third item of a wrong option is the observed fact that disproves it.
export const COMPARES=[
  [{key:'common',title:'같은 점은?',answer:'eyes',options:[['eyes','둘 다 눈과 다리가 있어'],['feathers','둘 다 깃털로 덮여 있어','개구리는 맨살, 게는 껍데기였어. 깃털은 못 봤어.'],['shell','둘 다 단단한 껍데기가 있어','단단한 껍데기는 게에게만 있었어.']]},{key:'difference',title:'다른 점은?',answer:'cover',options:[['cover','게에게는 단단한 껍데기가 있어'],['eyes','개구리에게만 눈이 있어','게에게도 자루 끝에 달린 눈이 있었어.'],['legs','게에게는 다리가 없어','게에게는 집게다리와 걷는 다리가 있었어.']]}],
  [{key:'common',title:'같은 점은?',answer:'legs',options:[['legs','둘 다 다리로 땅을 디딜 수 있어'],['wings','둘 다 날개가 있어','토끼에게는 날개가 없었어.'],['fur','둘 다 털로 덮여 있어','오리는 털이 아니라 깃털로 덮여 있었어.']]},{key:'difference',title:'다른 점은?',answer:'cover',options:[['cover','오리는 깃털, 토끼는 털로 덮여 있어'],['ears','오리에게만 긴 귀가 있어','길게 솟은 귀는 토끼에게 있었어.'],['feet','토끼에게만 물갈퀴가 있어','물갈퀴는 오리 발에 있었어.']]}],
];
// Screen 03 statement cards: both questions' options in one pile; ref keeps the slot they were written for.
export const compareCards=round=>{const all=COMPARES[round].flatMap(q=>q.options.map(([value,label,why])=>({ref:`${q.key}-${value}`,key:q.key,label,why})));return [0,3,1,4,2,5].map(i=>all[i]);};
export const HABITATS={forest:{name:'숲과 들',subtitle:'풀과 나무가 자라는 땅',sheet:[0,0]},pond:{name:'연못과 물가',subtitle:'물과 땅이 만나는 곳',sheet:[1,0]},coast:{name:'바다와 갯벌',subtitle:'바닷물과 드러나는 바닷가',sheet:[0,1]}};
export const DISCOVERIES=[
  {id:'forest-rabbit',animal:'rabbit',habitat:'forest',text:'풀과 나무 사이에서 토끼가 뒷다리로 뛰어다녔어.'},
  {id:'pond-frog',animal:'frog',habitat:'pond',text:'개구리가 물가에서 쉬고 물갈퀴로 물을 밀며 헤엄쳤어.'},
  {id:'coast-marine',animal:'marine',habitat:'coast',text:'바다 물고기가 지느러미로 바닷물 속을 헤엄쳤어.'},
  {id:'forest-butterfly',animal:'butterfly',habitat:'forest',text:'꽃이 있는 풀밭에서 나비가 날개로 날아다녔어.'},
  {id:'pond-duck',animal:'duck',habitat:'pond',text:'오리가 연못에서 물갈퀴로 물을 밀며 헤엄쳤어.'},
  {id:'coast-crab',animal:'crab',habitat:'coast',text:'바닷가 갯벌에서 게가 여러 다리로 걸어다녔어.'},
];
export const LINKS={
  frog:{animal:'frog',environment:[['pond','연못과 물가'],['sea','짠 바닷물 속'],['desert','건조한 모래 사막']],body:[['web','뒷발의 물갈퀴'],['fin','지느러미와 꼬리'],['claw','단단한 집게다리']],life:[['swim','물을 밀며 헤엄쳐'],['wiggle','몸과 꼬리를 흔들며 헤엄쳐'],['side','옆으로 걸어 다녀']],answer:['pond','web','swim'],sentence:'개구리는 물가에서 살며 물갈퀴로 물을 밀어 헤엄쳐.'},
  crab:{animal:'crab',environment:[['coast','바다와 갯벌'],['forest','숲과 들'],['pond','연못과 물가']],body:[['legs','집게다리와 여러 개의 걷는 다리'],['web','발가락 사이 물갈퀴'],['fin','지느러미와 꼬리']],life:[['walk','여러 다리로 갯벌을 걸어 다녀'],['swim','물을 밀며 헤엄쳐'],['jump','땅을 박차고 뛰어']],answer:['coast','legs','walk'],sentence:'게는 바다와 갯벌에서 여러 개의 다리로 걸어 다녀.'},
};
// Screen 08: each clue fits two or three candidates, so one clue never decides; the learner picks clues worth the energy.
export const CLUE_ENERGY=3;
export const CASES=[
  {id:'duck',animal:'duck',title:'물가에서 만난 친구',candidates:['duck','frog','fish','hen'],clues:[
    {id:'place',kind:'발견 장소',icon:'leaf',place:'pond',text:'연못 물 위와 물가에서 발견됐어.',fits:['duck','frog','fish']},
    {id:'cover',kind:'몸의 모습',icon:'search',crop:[61,50],text:'몸이 깃털로 덮여 있어.',fits:['duck','hen']},
    {id:'foot',kind:'발',icon:'search',crop:[50,86],text:'발가락 사이에 물갈퀴가 있어.',fits:['duck','frog']},
    {id:'move',kind:'이동 모습',icon:'scan',text:'땅에서는 두 다리로 뒤뚱뒤뚱 걸어.',fits:['duck','hen']},
    {id:'life',kind:'생활 장면',icon:'book',text:'부리로 먹이를 찾아 먹어.',fits:['duck','hen']}],
   habitat:'pond',reason:'paddle',reasons:[['paddle','물갈퀴로 물을 밀며 헤엄쳐'],['burrow','긴 뒷다리로 땅을 박차고 뛰어'],['fly','지느러미로 물속을 헤엄쳐']],reasonTip:'근거로 낸 단서 중 발에 있던 것을 떠올려 봐.',sentence:'오리는 연못과 물가에서 물갈퀴로 물을 밀며 헤엄쳐.',legacy:{feather:'cover',web:'foot'}},
  {id:'rabbit',animal:'rabbit',title:'풀밭에서 만난 친구',candidates:['rabbit','frog','bat','hen'],clues:[
    {id:'place',kind:'발견 장소',icon:'leaf',place:'forest',text:'풀과 나무가 자라는 들판의 땅 위에서 발견됐어.',fits:['rabbit','hen']},
    {id:'fur',kind:'몸의 모습',icon:'search',crop:[51,48],text:'몸이 털로 덮여 있어.',fits:['rabbit','bat']},
    {id:'ears',kind:'귀',icon:'search',crop:[46,18],text:'크고 길쭉한 귀가 있어.',fits:['rabbit','bat']},
    {id:'move',kind:'이동 모습',icon:'scan',text:'긴 뒷다리로 땅을 박차고 뛰어.',fits:['rabbit','frog']},
    {id:'life',kind:'생활 장면',icon:'book',text:'낮에는 굴이나 어두운 곳에 숨어 쉬어.',fits:['rabbit','bat']}],
   habitat:'forest',reason:'jump',reasons:[['paddle','물갈퀴로 물을 밀며 헤엄쳐'],['jump','긴 뒷다리로 땅을 박차고 뛰어'],['fin','지느러미로 바닷속을 헤엄쳐']],reasonTip:'사진에서 토끼의 뒷다리 모양을 살펴봐.',sentence:'토끼는 숲과 들의 땅에서 긴 뒷다리로 뛰어다녀.',legacy:{ears:'ears',fur:'fur'}},
];
export const clueOf=(c,id)=>c.clues.find(x=>x.id===id);
// Candidates every given clue is true for.
export const fitting=(c,ids)=>c.candidates.filter(a=>ids.every(id=>clueOf(c,id)?.fits.includes(a)));
export const proves=(c,ids)=>ids.length>=2&&ids.every(id=>clueOf(c,id))&&fitting(c,ids).join()===c.animal;
const groundsReady=(c,a)=>a.candidate===c.animal&&a.grounds.every(id=>a.opened.includes(id))&&proves(c,a.grounds);
export const FEATURES=[['shell','거북의 단단한 등딱지'],['web','오리의 물갈퀴'],['fur','북극곰의 촘촘한 털']];
export const STRUCTURES=[['dome','머리를 감싸는 단단한 덮개'],['wide','물을 미는 넓고 납작한 면'],['layer','공기를 머금는 여러 겹']];
const blankCase=()=>({opened:[],grounds:[],candidate:'',habitat:'',reason:''});
const blankDesign=()=>({problem:'',feature:'',structure:'',name:'',strokes:[],trials:[],explanation:'',experiment:normalizeExperiment()});
export function freshExpedition(){return {version:VERSION,inquiry:normalizeInquiry(),soundEnabled:true,adminUnlocked:false,introSeen:false,stage:1,step:{},activities:[],completed:[],observed:[],activeAnimal:'frog',compares:[{},{}],sorts:[{},{}],criteria:['',''],discovered:[],links:{frog:{},crab:{}},cases:[blankCase(),blankCase()],designs:[blankDesign(),blankDesign()],records:{cases:[null,null],designs:[null,null]},toolUses:[],mapPosition:'entrance',legacy:null};}
const uniqueStrings=(v,allowed)=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'&&allowed.includes(x)))]:[];
const record=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const safeChoice=(v,allowed,fallback='')=>typeof v==='string'&&allowed.includes(v)?v:fallback;
const normalizedChoices=(v,allowedKeys,allowedValues)=>Object.fromEntries(Object.entries(record(v)).filter(([k,x])=>allowedKeys.includes(k)&&typeof x==='string'&&allowedValues.includes(x)));
function normalizeDesign(raw){
  const d=record(raw),out=blankDesign();out.experiment=normalizeExperiment(d.experiment);
  out.problem=safeChoice(d.problem,Object.keys(PROBLEMS));out.feature=safeChoice(d.feature,FEATURES.map(x=>x[0]));out.structure=safeChoice(d.structure,STRUCTURES.map(x=>x[0]));
  out.name=typeof d.name==='string'?d.name.slice(0,24):'';
  out.explanation=safeChoice(d.explanation,['match','looks','magic']);
  if(Array.isArray(d.strokes))out.strokes=d.strokes.slice(0,30).filter(Array.isArray).map(line=>line.slice(0,250).filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)).map(([x,y])=>[Math.max(0,Math.min(320,x)),Math.max(0,Math.min(260,y))]));
  // Validate each saved trial from its choices; never trust a stored passed flag.
  out.trials=Array.isArray(d.trials)?d.trials.slice(-30).filter(t=>t&&typeof t==='object'&&Object.hasOwn(PROBLEMS,t.problem)).map(t=>{const choices={problem:t.problem,feature:safeChoice(t.feature,FEATURES.map(x=>x[0])),structure:safeChoice(t.structure,STRUCTURES.map(x=>x[0]))};return {...choices,passed:testDesign(choices).passed};}):[];
  return out;
}
export function restoreExpedition(raw){
  const base=freshExpedition();if(!raw)return base;
  try{
    const input=JSON.parse(raw);if(!input||typeof input!=='object')return base;
    if(input.version===1)return migrateLegacy(raw);
    if(input.version!==VERSION)return base;
    const out=base;out.inquiry=normalizeInquiry(input.inquiry);
    for(const key of ['soundEnabled','adminUnlocked','introSeen'])if(typeof input[key]==='boolean')out[key]=input[key];
    out.stage=Number.isInteger(input.stage)&&input.stage>=1&&input.stage<=5?input.stage:1;
    out.step=Object.fromEntries(Object.entries(record(input.step)).filter(([k,v])=>/^[1-5]$/.test(k)&&Number.isInteger(v)&&v>=0&&v<=3));
    out.observed=uniqueStrings(input.observed,Object.values(OBSERVATIONS).flat().map(o=>o.id));
    out.activeAnimal=safeChoice(input.activeAnimal,Object.keys(OBSERVATIONS),'frog');
    out.compares=[0,1].map(i=>normalizedChoices(input.compares?.[i],['common','difference'],compareCards(i).map(c=>c.ref)));
    out.sorts=[0,1].map(i=>normalizedChoices(input.sorts?.[i],SORT_ANIMALS,['yes','no']));
    out.criteria=[safeChoice(input.criteria?.[0],['cute','wings']),safeChoice(input.criteria?.[1],[...OWN_CRITERIA,...OPINION_CRITERIA])];
    out.discovered=uniqueStrings(input.discovered,DISCOVERIES.map(d=>d.id));
    for(const id of ['frog','crab'])out.links[id]=normalizedChoices(input.links?.[id],['environment','body','life'],Object.values(LINKS[id]).filter(Array.isArray).flat().flat().filter(x=>typeof x==='string'));
    out.cases=CASES.map((c,i)=>{const x=input.cases?.[i],opened=uniqueStrings(x?.opened,c.clues.map(k=>k.id)).slice(0,CLUE_ENERGY);return {opened,grounds:uniqueStrings(x?.grounds,opened),candidate:safeChoice(x?.candidate,c.candidates),habitat:safeChoice(input.cases?.[i]?.habitat,Object.keys(HABITATS)),reason:safeChoice(x?.reason,c.reasons.map(r=>r[0]))};});
    out.designs=[0,1].map(i=>normalizeDesign(input.designs?.[i]));
    const allowed=STAGES.flatMap(t=>[0,1,2,3].map(n=>`${t.id}-${n}`));
    out.activities=uniqueStrings(input.activities,allowed);
    // Preserve awarded tasks even while a learner revisits and edits an answer.
    out.completed=STAGES.filter(t=>[0,1,2,3].every(n=>out.activities.includes(`${t.id}-${n}`))).map(t=>t.id);
    for(const i of [0,1]){
      const c=record(input.records?.cases?.[i]),expected=CASES[i];
      // A record saved before screen 08 used two trait ids; translate it for display.
      const legacy=Array.isArray(c.traits)&&c.traits.length===2&&c.traits.every(t=>Object.hasOwn(expected.legacy,t)),grounds=legacy?c.traits.map(t=>expected.legacy[t]):uniqueStrings(c.grounds,expected.clues.map(k=>k.id));
      if(out.activities.includes(`4-${i*2+1}`)&&c.candidate===expected.animal&&(legacy||proves(expected,grounds))&&c.habitat===expected.habitat&&c.reason===expected.reason)out.records.cases[i]={opened:[...grounds],grounds,candidate:c.candidate,habitat:c.habitat,reason:c.reason};
      const d=normalizeDesign(input.records?.designs?.[i]||out.designs[i]);
      if(out.activities.includes(`5-${i*2+1}`)&&testDesign(d).passed&&d.explanation==='match'&&d.trials.some(t=>t.problem===d.problem&&t.feature===d.feature&&t.structure===d.structure&&t.passed))out.records.designs[i]=d;
    }
    out.toolUses=uniqueStrings(input.toolUses,STAGES.map(t=>String(t.id)));
    out.mapPosition=safeChoice(input.mapPosition,['entrance','1','2','3','4','5','camp'],'entrance');
    if(input.legacy&&typeof input.legacy==='object')out.legacy=restoreLegacy(JSON.stringify(input.legacy));
    return out;
  }catch{return base;}
}
function migrateLegacy(raw){
  const previous=restoreLegacy(raw),out=freshExpedition();out.legacy=previous;out.soundEnabled=previous.soundEnabled;out.adminUnlocked=previous.adminUnlocked;out.introSeen=true;
  out.observed=previous.observed;out.compares[0]=Object.fromEntries(Object.entries(previous.compare).map(([k,v])=>[k,`${k}-${v}`]));out.sorts[0]=previous.classification;out.criteria[0]=previous.criterion;
  out.discovered=DISCOVERIES.slice(0,3).filter(d=>previous.found.includes(d.animal)).map(d=>d.id);out.links.frog=previous.chain;
  const oldReady=[previous.observed.length===6,previous.compare.common==='eyes'&&previous.compare.difference==='cover',['frog','duck','rabbit','crab','fish','butterfly'].every(id=>previous.classification[id]===(ANIMALS[id].wings?'yes':'no')),previous.criterion==='wings',out.discovered.length===3,['pond','web','swim'].every((v,i)=>previous.chain[['environment','body','life'][i]]===v)];
  for(let stage=1;stage<=3;stage++)for(let step=0;step<2;step++)if(oldReady[(stage-1)*2+step])out.activities.push(`${stage}-${step}`);
  out.designs[0]=normalizeDesign({...previous.design,strokes:previous.sketches[previous.design.problem]||[],trials:previous.trials});
  // The old unidentified-animal activity has changed; its new tasks start fresh.
  return out;
}
export function isStageOpen(s,id){return Number.isInteger(id)&&id>=1&&id<=5&&(s.adminUnlocked||id===1||s.completed.includes(id)||s.completed.includes(id-1)||Boolean(s.legacy&&(id<=Math.min(5,Math.max(0,...s.legacy.completed)+1))));}
export const countStage=(s,id)=>[0,1,2,3].filter(n=>s.activities.includes(`${id}-${n}`)).length;
export function taskReady(s,stage,step){
  if(!Number.isInteger(stage)||stage<1||stage>5||!Number.isInteger(step)||step<0||step>3)return false;
  const round=Math.floor(step/2);
  if(stage===1)return step%2===0?OBSERVE_PAIRS[round].every(id=>OBSERVATIONS[id].every(o=>s.observed.includes(o.id))):COMPARES[round].every(q=>s.compares[round][q.key]===`${q.key}-${q.answer}`);
  if(stage===2){const key=round?s.criteria[1]:'wings',v=s.inquiry.verify[round];if(round&&!OWN_CRITERIA.includes(key))return false;if(step%2===0)return SORT_ANIMALS.every(id=>s.sorts[round][id]===(ANIMALS[id][key]?'yes':'no'));return round?v.checked===key&&s.inquiry.reclass[1].revealed:v.ran&&v.cause==='opinion'&&OBSERVABLE.includes(v.fix)&&v.checked===v.fix;}
  if(stage===3){if(step%2===0)return DISCOVERIES.slice(round*3,round*3+3).every(d=>s.discovered.includes(d.id)&&s.inquiry.motion[d.animal]===MOTION_KEY_FRAME);const id=round?'crab':'frog';return LINKS[id].answer.every((v,i)=>s.links[id][['environment','body','life'][i]]===v);}
  if(stage===4){const c=CASES[round],a=s.cases[round];return groundsReady(c,a)&&(step%2===0||a.habitat===c.habitat&&a.reason===c.reason);}
  if(stage===5){const d=s.designs[round],other=s.records.designs[1-round];if(!Object.hasOwn(PROBLEMS,d.problem)||other?.problem===d.problem||round===1&&!other&&d.problem===s.designs[0].problem)return false;if(step%2===0)return Boolean(d.name.trim()&&d.feature&&d.structure&&d.experiment.sourceSeen);return experimentReady(d)&&testDesign(d).passed&&d.trials.some(t=>t.problem===d.problem&&t.feature===d.feature&&t.structure===d.structure&&testDesign(t).passed)&&d.explanation==='match';}
  return false;
}
export function claimTask(s,stage,step){
  if(!isStageOpen(s,stage)||!Number.isInteger(step)||step<0||step>3||!Array.from({length:step},(_,n)=>`${stage}-${n}`).every(id=>s.activities.includes(id))||!taskReady(s,stage,step))return {ok:false};
  const key=`${stage}-${step}`,fresh=!s.activities.includes(key);if(fresh)s.activities.push(key);
  if(stage===4&&step%2===1)s.records.cases[Math.floor(step/2)]=JSON.parse(JSON.stringify(s.cases[Math.floor(step/2)]));
  if(stage===5&&step%2===1)s.records.designs[Math.floor(step/2)]=JSON.parse(JSON.stringify(s.designs[Math.floor(step/2)]));
  const stageComplete=countStage(s,stage)===4,firstStage=stageComplete&&!s.completed.includes(stage);
  if(firstStage){s.completed.push(stage);s.completed.sort();}
  return {ok:true,fresh,stageComplete,firstStage};
}
export function recordTrial(s,round){const d=s.designs[round];if(!d)return null;const result=testDesign(d);d.trials.push({problem:d.problem,feature:d.feature,structure:d.structure,passed:result.passed});if(d.trials.length>30)d.trials.shift();return result;}
export function taskHint(stage,step){
  if(stage===1)return step%2===0?'몸의 부분을 살펴보고 특징 기록을 눌러 줘. 동물마다 세 곳이야.':'직접 본 눈·다리·몸을 떠올려 같은 점과 다른 점을 다시 골라 봐.';
  if(stage===2)return step===2?'몸에서 누구나 확인할 수 있는 기준을 골라, 동물을 나눠 봐.':step%2===0?'지금의 기준을 한 번 더 읽고 동물의 몸을 살펴봐.':'예상을 고른 뒤 분류 바꾸기를 눌러 결과를 확인해 봐.';
  if(stage===3)return step%2===0?'세 장소에서 동물을 찾고, 몸이 힘을 쓰는 순간에 멈춰 기록해 줘.':'사는 곳 → 몸의 특징 → 움직이는 방법을 이어 봐.';
  if(stage===4)return step%2===0?'두 단서를 열어 기록한 뒤 알맞은 동물을 골라 줘.':'어느 곳에서, 어떤 몸의 부분으로 움직이는지 사진과 수첩을 다시 봐.';
  return step%2===0?'먼저 특징 기록을 누르고, 동물의 특징과 물건의 부분을 골라 이름을 지어 줘. 두 번째는 다른 문제를 골라야 해.':'다른 모양 두 가지를 시험하고, 예상과 비교한 뒤 알게 된 점과 발명 이유를 남겨 줘.';
}
// Names what is still missing or wrong so a retry needs a second look, not a guess.
// wrong: keys the views mark on the matching card ('compare:common', 'sort:frog', 'link:body', 'case:habitat').
export function taskMistake(s,stage,step){
  const round=Math.floor(step/2),names=ids=>ids.map(id=>ANIMALS[id].name).join(', ');
  if(stage===1&&step%2===0){const missing=OBSERVE_PAIRS[round].flatMap(id=>OBSERVATIONS[id].filter(o=>!s.observed.includes(o.id)).map(o=>`${ANIMALS[id].name} ${o.label}`));return missing.length?{text:`아직 기록하지 않은 부분: ${missing.join(', ')}`,wrong:[]}:null;}
  if(stage===1){const out=[],slot=k=>k==='common'?'같은 점':'다른 점';for(const q of COMPARES[round]){const pick=s.compares[round][q.key];if(pick===`${q.key}-${q.answer}`)continue;const card=compareCards(round).find(c=>c.ref===pick);
    // A true statement in the other slot is about the slot; a false one gets the fact that disproves it.
    out.push({key:'compare:'+q.key,text:!card?`‘${slot(q.key)}’ 칸이 비어 있어.`:card.why?`‘${card.label}’ 카드를 다시 봐. ${card.why}`:`‘${card.label}’는 ${slot(q.key)}이 아니라 ${slot(card.key)}이야.`});}return out.length?{text:out.map(x=>x.text).join(' '),wrong:out.map(x=>x.key)}:null;}
  if(stage===2&&round&&!OWN_CRITERIA.includes(s.criteria[1]))return {text:s.criteria[1]?`‘${CRITERIA[s.criteria[1]]}’는 사람마다 답이 달라. 몸을 보면 누구나 같은 답이 나오는 기준을 골라 봐.`:'먼저 나눌 기준을 하나 골라 줘.',wrong:[]};
  if(stage===2&&step%2===0){const key=round?s.criteria[1]:'wings',blank=SORT_ANIMALS.filter(id=>!s.sorts[round][id]);if(blank.length)return {text:`아직 고르지 않은 동물: ${names(blank)}`,wrong:[]};const bad=SORT_ANIMALS.filter(id=>s.sorts[round][id]!==(ANIMALS[id][key]?'yes':'no'));return bad.length?{text:`${names(bad)} 카드를 다시 봐. ‘${CRITERIA[key]}’를 사진에서 직접 확인해 봐.`,wrong:bad.map(id=>'sort:'+id)}:null;}
  if(stage===2){const v=s.inquiry.verify[round];
    if(round){if(v.checked!==s.criteria[1])return {text:'‘내 기준 검증’을 눌러 세 연구원의 결과를 확인해 봐.',wrong:[]};if(!s.inquiry.reclass[1].revealed)return {text:'예상을 고른 뒤 ‘분류 바꾸기’를 눌러 결과를 확인해 봐.',wrong:[]};return null;}
    if(!v.ran)return {text:'먼저 ‘검증 실행’을 눌러 세 연구원의 결과를 확인해 봐.',wrong:[]};
    if(v.cause!=='opinion'){const c=CAUSES.find(x=>x[0]===v.cause);return {text:c?c[2]:'결과가 왜 달라졌는지 골라 줘.',wrong:['verify:cause']};}
    if(!OBSERVABLE.includes(v.fix))return {text:v.fix?`‘${CRITERIA[v.fix]}’도 사람마다 답이 달라. 몸에서 확인할 수 있는 기준을 골라 봐.`:'누가 봐도 같은 답이 나오는 기준으로 고쳐 줘.',wrong:['verify:fix']};
    if(v.checked!==v.fix)return {text:'고친 기준으로 ‘다시 검증’을 눌러 세 결과가 같은지 확인해 봐.',wrong:[]};return null;}
  if(stage===3&&step%2===0){const list=DISCOVERIES.slice(round*3,round*3+3),unseen=list.filter(d=>!s.discovered.includes(d.id));if(unseen.length)return {text:`아직 찾지 않은 곳: ${unseen.map(d=>HABITATS[d.habitat].name).join(', ')}`,wrong:[]};const left=list.filter(d=>s.inquiry.motion[d.animal]!==MOTION_KEY_FRAME);return left.length?{text:left.map(d=>`${ANIMALS[d.animal].name}: ${MOTIONS[d.animal].goal}을 찾아 기록해 봐.`).join(' '),wrong:[]}:null;}
  if(stage===3){const id=round?'crab':'frog',keys=['environment','body','life'],cols=['사는 곳','몸의 특징','움직이는 방법'],tips=['어느 장소에서 발견했는지 떠올려 봐.','움직일 때 어느 몸 부분을 썼는지 떠올려 봐.','그 몸 부분으로 어떻게 움직였는지 떠올려 봐.'],bad=keys.map((k,i)=>({k,i})).filter(({k,i})=>s.links[id][k]!==LINKS[id].answer[i]);return bad.length?{text:bad.map(({k,i})=>s.links[id][k]?`‘${cols[i]}’을 다시 봐. ${tips[i]}`:`‘${cols[i]}’을 아직 고르지 않았어.`).join(' '),wrong:bad.map(({k})=>'link:'+k)}:null;}
  if(stage===4){const c=CASES[round],a=s.cases[round],names=ids=>ids.map(id=>ANIMALS[id].name).join(', ');
    if(step%2===0||!groundsReady(c,a)){
      if(!a.opened.length)return {text:`단서 카드를 눌러 조사해 봐. 조사 에너지는 ${CLUE_ENERGY}개야.`,wrong:[]};
      const left=CLUE_ENERGY-a.opened.length,open=fitting(c,a.opened);
      if(!a.candidate)return {text:'열어 본 단서와 맞는 동물을 골라 줘.',wrong:[]};
      if(a.candidate!==c.animal){const k=a.opened.map(id=>clueOf(c,id)).find(x=>!x.fits.includes(a.candidate));return {text:k?`${ANIMALS[a.candidate].name}은(는) ‘${k.kind}: ${k.text}’ 단서와 맞지 않아.`:`지금 단서로는 ${names(open)} 중 누구인지 알 수 없어. ${left?'다른 단서를 더 조사해 봐.':'‘다시 조사’로 다른 단서를 골라 봐.'}`,wrong:['case:candidate']};}
      if(a.grounds.length<2)return {text:'왜 그 동물인지 판단 근거 단서를 두 개 이상 골라 줘.',wrong:['case:grounds']};
      if(!proves(c,a.grounds)){const also=fitting(c,a.grounds).filter(id=>id!==c.animal);return {text:open.length>1&&!left?`연 단서만으로는 ${names(open)}을(를) 구별할 수 없어. ‘다시 조사’로 다른 종류의 단서를 골라 봐.`:`고른 근거는 ${names(also)}에게도 맞아. 다른 동물과 구별되는 단서를 근거로 골라 봐.`,wrong:['case:grounds']};}
      if(step%2===0)return null;}
    const out=[];if(a.habitat!==c.habitat)out.push({key:'case:habitat',text:a.habitat?'‘만난 곳’을 다시 봐. 사진 속 풍경에 무엇이 있는지 살펴봐.':'‘만난 곳’을 아직 고르지 않았어.'});if(a.reason!==c.reason)out.push({key:'case:reason',text:a.reason?`‘어떻게 움직일까’를 다시 봐. ${c.reasonTip}`:'‘어떻게 움직일까’를 아직 고르지 않았어.'});return out.length?{text:out.map(x=>x.text).join(' '),wrong:out.map(x=>x.key)}:null;}
  return null;
}
export function availableTools(s){return STAGES.filter(t=>s.completed.includes(t.id));}
export const reportDesigns=s=>s.designs.map((d,i)=>s.records.designs[i]||d);
export function collectedAnimals(s){return Object.keys(ANIMALS).filter(id=>s.observed.some(o=>o.startsWith(id+'-'))||DISCOVERIES.some(d=>d.animal===id&&s.discovered.includes(d.id))||s.sorts.some(set=>['yes','no'].includes(set[id])));}
