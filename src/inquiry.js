// Small, qualitative learning models. Values are diagram positions, not measured performance.
export const EXPERIMENTS={
 swim:{control:'오리발의 폭',levels:['좁게','중간','넓게'],source:'물갈퀴',question:'넓은 오리발은 좁은 오리발보다 물을 어떻게 밀까?',predictions:[['more','더 많이 밀 거야'],['same','비슷할 거야'],['less','더 적게 밀 거야']],result:'넓은 면이 물을 더 많이 미는 모습',reason:'넓은 면으로 물을 밀 수 있어.',condition:'같은 길이·재료, 같은 빠르기로 한 번 밀기'},
 protect:{control:'덮개가 감싸는 곳',levels:['위쪽','위와 옆','위·옆·뒤'],source:'등딱지',question:'덮개로 감싸는 곳을 늘리면 가려지는 곳은 어떻게 될까?',predictions:[['more','더 많아질 거야'],['same','비슷할 거야'],['less','더 적어질 거야']],result:'덮개가 감싸는 부분',reason:'단단한 덮개가 머리를 감싸.',condition:'같은 재료·두께, 덮개가 감싸는 곳만 바꾸기'},
 warm:{control:'공기를 머금는 겹',levels:['한 겹','두 겹','세 겹'],source:'촘촘한 털',question:'공기를 머금는 겹이 늘면 열은 어떻게 빠져나갈까?',predictions:[['less','더 적게 빠져나갈 거야'],['same','비슷할 거야'],['more','더 많이 빠져나갈 거야']],result:'밖으로 빠져나가는 열의 모습',reason:'겹 사이의 공기가 열이 빠져나가는 것을 줄여.',condition:'같은 재료, 같은 처음 온도와 바깥 조건'}
};
export const levelValue=v=>Number.isInteger(Number(v))?Math.max(1,Math.min(3,Number(v))):1;
export function normalizeExperiment(raw={}){
 const e=raw&&typeof raw==='object'?raw:{};
 return {level:levelValue(e.level),sourceSeen:e.sourceSeen===true,prediction:['more','same','less'].includes(e.prediction)?e.prediction:'',reflection:['changed','same','surprised'].includes(e.reflection)?e.reflection:'',note:typeof e.note==='string'?e.note.slice(0,180):'',peer:typeof e.peer==='string'?e.peer.slice(0,180):'',trials:Array.isArray(e.trials)?e.trials.filter(t=>t&&Object.hasOwn(EXPERIMENTS,t.problem)&&Number.isInteger(t.level)&&t.level>=1&&t.level<=3&&['more','same','less'].includes(t.prediction)).slice(-12).map(t=>({problem:t.problem,level:t.level,prediction:t.prediction})):[]};
}
export function addExperimentTrial(design){
 const e=design.experiment;
 if(!e||!e.sourceSeen||!e.prediction||!Object.hasOwn(EXPERIMENTS,design.problem))return false;
 const trial={problem:design.problem,level:levelValue(e.level),prediction:e.prediction};
 e.trials.push(trial);e.trials=e.trials.slice(-12);e.reflection='';return trial;
}
export function comparisonReady(d){const e=d.experiment;if(!e)return false;const trials=e.trials.filter(t=>t.problem===d.problem);return e.sourceSeen&&new Set(trials.map(t=>t.level)).size>=2&&trials.some(t=>t.level===e.level);}
export function experimentReady(d){return comparisonReady(d)&&Boolean(d.experiment.reflection)&&Boolean(d.experiment.note.trim());}
// goal: the frame where the body part does the work; only that scene can be recorded.
export const MOTION_KEY_FRAME=1;
export const MOTIONS={
 frog:{part:'뒷다리와 물갈퀴',goal:'뒷다리가 물을 뒤로 미는 순간',frames:['뒷다리를 접어','뒷다리를 펴서 물을 뒤로 밀어','몸이 앞으로 나아가'],kind:'swim'},
 duck:{part:'물갈퀴',goal:'물갈퀴가 물을 뒤로 미는 순간',frames:['발을 앞으로 가져와','물갈퀴로 물을 뒤로 밀어','몸이 앞으로 나아가'],kind:'swim'},
 rabbit:{part:'긴 뒷다리',goal:'뒷다리가 땅을 뒤로 미는 순간',frames:['뒷다리를 굽혀','땅을 뒤로 힘껏 밀어','몸이 앞으로 뛰어나가'],kind:'jump'},
 butterfly:{part:'날개',goal:'날개를 아래로 내리는 순간',frames:['날개를 들어','날개를 내려','공중에서 날아가'],kind:'fly'},
 crab:{part:'걷는 다리',goal:'다리가 땅을 미는 순간',frames:['다리를 들어','다리로 땅을 밀어','옆으로 걸어가'],kind:'walk'},
 marine:{part:'지느러미와 꼬리',goal:'꼬리가 물을 옆으로 미는 순간',frames:['몸과 꼬리를 굽혀','몸과 꼬리를 반대로 움직여','물속에서 앞으로 나아가'],kind:'swim'}
};
export const frameAt=value=>Math.min(2,Math.floor(Math.max(0,Math.min(100,Number(value)||0))/34));
export function normalizeInquiry(raw={}){const x=raw&&typeof raw==='object'?raw:{};return {motion:Object.fromEntries(Object.entries(x.motion||{}).filter(([id,f])=>Object.hasOwn(MOTIONS,id)&&f===MOTION_KEY_FRAME)),reclass:[0,1].map(i=>({prediction:['yes','no'].includes(x.reclass?.[i]?.prediction)?x.reclass[i].prediction:'',revealed:x.reclass?.[i]?.revealed===true})),evidence:[0,1].map(i=>Array.isArray(x.evidence?.[i])?[...new Set(x.evidence[i].filter(k=>(i===0?['web','feather']:['ears','fur']).includes(k)))]:[])};}
