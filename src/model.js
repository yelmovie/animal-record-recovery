export const STORAGE_KEY = 'animal-record-recovery:v1';
export const STAGES = [
  {id:1, name:'관찰의 숲', type:'관찰 기록', title:'작은 특징에서 시작하는 발견', desc:'가까이 보고, 같은 점과 다른 점을 찾아요.', icon:'search', color:'#bdcf85', x:22,y:33},
  {id:2, name:'분류의 정원', type:'분류 기록', title:'누구나 같은 답을 찾는 기준', desc:'동물을 나누고 분류 기준을 검증해요.', icon:'layers', color:'#ecc883',x:44,y:23},
  {id:3, name:'생태의 물가', type:'환경 기록', title:'사는 곳과 생김새의 연결', desc:'환경 속 동물을 발견하고 관계를 연결해요.', icon:'leaf', color:'#97c7c2',x:70,y:35},
  {id:4, name:'단서의 오두막', type:'미확인 기록', title:'단서가 들려주는 동물 이야기', desc:'필요한 단서를 골라 판단을 검증해요.', icon:'scan', color:'#bdafd4',x:68,y:68},
  {id:5, name:'발명의 공방', type:'활용 기록', title:'동물에게 배우는 생활 속 발명', desc:'동물의 특징을 빌려 설계하고 개선해요.', icon:'tool', color:'#e7ad83',x:34,y:71},
];
export const ANIMALS = {
 frog:{name:'개구리',sheet:'frog',col:0,row:0,wings:false},
 crab:{name:'게',sheet:'crab',col:0,row:0,wings:false},
 duck:{name:'오리',sheet:'animals-a',col:0,row:0,wings:true},
 rabbit:{name:'토끼',sheet:'animals-a',col:1,row:0,wings:false},
 fish:{name:'금붕어',sheet:'animals-a',col:0,row:1,wings:false},
 butterfly:{name:'나비',sheet:'animals-a',col:2,row:1,wings:true},
 marine:{name:'바다 물고기',sheet:'marine',col:1,row:0,wings:false},
};
export const OBSERVATIONS = {
 frog:[{id:'frog-eye',label:'눈',text:'머리 위쪽에 튀어나온 눈이 있어요.',x:64,y:27},{id:'frog-leg',label:'뒷다리',text:'앞다리보다 긴 뒷다리가 있어요.',x:33,y:64},{id:'frog-skin',label:'몸 표면',text:'털이나 깃털 없이 맨살이 드러나 있어요.',x:55,y:48}],
 crab:[{id:'crab-eye',label:'눈',text:'몸 위로 뻗은 자루 끝에 눈이 있어요.',x:53,y:27},{id:'crab-leg',label:'다리',text:'집게다리와 여러 개의 걷는 다리가 있어요.',x:27,y:65},{id:'crab-shell',label:'몸 표면',text:'몸 바깥을 단단한 껍데기가 감싸요.',x:59,y:48}],
};
export const CLUES = [
 {id:'place',name:'발견 장소',icon:'leaf',text:'연못의 물 위와 물가에서 발견됐어요.'},
 {id:'feet',name:'발의 모습',icon:'scan',text:'발가락 사이에 물갈퀴가 있어요.'},
 {id:'cover',name:'몸의 표면',icon:'search',text:'몸이 깃털로 덮여 있어요.'},
 {id:'mouth',name:'입의 모습',icon:'search',text:'넓적한 부리가 있어요.'},
 {id:'move',name:'이동 모습',icon:'scan',text:'두 발로 걷고, 물에서 헤엄쳐요.'},
];
export const PROBLEMS = {
 protect:{name:'머리를 보호하고 싶어',product:'안전모',feature:'shell',structure:'dome',animal:'거북',reason:'단단한 등딱지처럼 바깥 덮개로 머리를 감싸요.'},
 swim:{name:'물에서 힘차게 나아가고 싶어',product:'수영 오리발',feature:'web',structure:'wide',animal:'오리',reason:'물갈퀴처럼 넓은 면으로 물을 밀어요.'},
 warm:{name:'추운 날 몸을 따뜻하게 하고 싶어',product:'방한 외투',feature:'fur',structure:'layer',animal:'북극곰',reason:'촘촘한 털처럼 공기를 머금는 겹으로 열이 빠져나가는 것을 줄여요.'},
};
export function freshState(){return {version:1,adminUnlocked:false,soundEnabled:true,completed:[],evidence:[],observed:[],animal:'frog',compare:{},classification:{},criterion:'cute',found:[],chain:{},clues:[],suspect:'',grounds:[],design:{problem:'protect',feature:'',structure:'',name:''},sketches:{},trials:[],step:{},lastStage:1};}
export function restoreState(raw){
  if(!raw) return freshState();
  try {
    const s=JSON.parse(raw), base=freshState();
    if(s.version!==1) return base;
    const out={...base};
    const strings=(x)=>Array.isArray(x)?[...new Set(x.filter(v=>typeof v==='string'))]:[];
    const object=(x)=>x && typeof x==='object' && !Array.isArray(x)?x:{};
    out.completed=Array.isArray(s.completed)?[...new Set(s.completed.filter(n=>Number.isInteger(n)&&n>=1&&n<=5))].sort():[];
    // Admin preview permits genuine out-of-order completion; preserve it on reload.
    out.adminUnlocked=typeof s.adminUnlocked==='boolean'?s.adminUnlocked:false;
    out.soundEnabled=typeof s.soundEnabled==='boolean'?s.soundEnabled:true;
    for(const key of ['evidence','observed','found','clues','grounds'])out[key]=strings(s[key]);
    out.observed=out.observed.filter(id=>Object.values(OBSERVATIONS).flat().some(o=>o.id===id));
    out.found=out.found.filter(id=>['rabbit','frog','marine'].includes(id));
    out.clues=out.clues.filter(id=>CLUES.some(c=>c.id===id)).slice(0,3);
    out.grounds=out.grounds.filter(id=>out.clues.includes(id)).slice(0,2);
    for(const key of ['compare','classification','chain'])out[key]=object(s[key]);
    out.step=Object.fromEntries(Object.entries(object(s.step)).filter(([k,v])=>/^[1-5]$/.test(k)&&[0,1].includes(v)));
    out.design={...base.design,...Object.fromEntries(Object.entries(object(s.design)).filter(([k,v])=>Object.keys(base.design).includes(k)&&typeof v==='string'))};
    if(!Object.hasOwn(PROBLEMS,out.design.problem))out.design.problem='protect';
    out.design.name=out.design.name.slice(0,24);
    for(const problem of Object.keys(PROBLEMS)){
      const strokes=object(s.sketches)[problem];
      if(Array.isArray(strokes))out.sketches[problem]=strokes.slice(0,30).filter(Array.isArray).map(points=>points.slice(0,250).filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)).map(([x,y])=>[Math.max(0,Math.min(320,x)),Math.max(0,Math.min(260,y))]));
    }
    out.trials=Array.isArray(s.trials)?s.trials.filter(t=>t&&typeof t.passed==='boolean').slice(-30):[];
    out.animal=['frog','crab'].includes(s.animal)?s.animal:'frog';
    out.criterion=['cute','wings'].includes(s.criterion)?s.criterion:'cute';
    out.suspect=['duck','frog','fish','rabbit'].includes(s.suspect)?s.suspect:'';
    out.lastStage=Number.isInteger(s.lastStage)&&s.lastStage>=1&&s.lastStage<=5?s.lastStage:1;
    return out;
  }catch{return freshState();}
}
export function isUnlocked(state,id){return Number.isInteger(id)&&id>=1&&id<=5&&(state.adminUnlocked===true||id===1||state.completed.includes(id)||state.completed.includes(id-1));}
export function compareValid(s){return s.compare.common==='eyes'&&s.compare.difference==='cover';}
export function classificationValid(s){return ['frog','crab','duck','rabbit','fish','butterfly'].every(id=>s.classification[id]===(ANIMALS[id].wings?'yes':'no'));}
export function chainValid(s){return s.chain.environment==='pond'&&s.chain.body==='web'&&s.chain.life==='swim';}
export function deductionValid(s){return s.suspect==='duck'&&s.grounds.length===2&&s.grounds.every(id=>s.clues.includes(id))&&s.grounds.some(id=>['cover','mouth'].includes(id));}
export function testDesign(design){if(!design||typeof design.problem!=='string'||!Object.hasOwn(PROBLEMS,design.problem))return {feature:false,structure:false,passed:false};const p=PROBLEMS[design.problem];return {feature:design.feature===p.feature,structure:design.structure===p.structure,passed:design.feature===p.feature&&design.structure===p.structure};}
export function stageReady(s,id){
 switch(id){case 1:return s.observed.length===6&&compareValid(s);case 2:return classificationValid(s)&&s.criterion==='wings';case 3:return s.found.length===3&&chainValid(s);case 4:return deductionValid(s);case 5:return Boolean(s.design.name.trim())&&testDesign(s.design).passed&&s.trials.some(t=>t.passed&&t.problem===s.design.problem&&t.feature===s.design.feature&&t.structure===s.design.structure);default:return false;}
}
export function completeStage(s,id){if(!isUnlocked(s,id)||!stageReady(s,id))return false;if(!s.completed.includes(id))s.completed.push(id);s.completed.sort();return true;}
