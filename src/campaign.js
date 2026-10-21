// Museum commissions extend the core investigations. Awarded evidence is
// snapshotted separately from editable drafts, so replay cannot rewrite an exhibit.
import {studioReady} from './studio.js';
import {withParticle} from './korean.js';
const row=(key,label,options,answer,hint,animal='')=>({key,label,options,answer,hint,animal});
const yesNo=[['yes','O'],['no','X']];
export const COMMISSIONS=[
 {id:1,npc:'연구원 소라',portrait:'researcher',title:'뒤섞인 전시 설명판을 고쳐 줘',exhibit:'몸의 특징 전시대',thanks:'이제 관람객이 사진과 설명을 함께 보며 동물을 비교할 수 있어!',badge:'꼼꼼한 관찰가',tool:'관찰 렌즈',missions:[
  {title:'설명판 수리',intro:'개구리와 게의 설명판이 뒤바뀌었어! 사진을 보고 맞는 설명을 골라 줘.',kind:'repair',rows:[
   row('frog-label','개구리의 설명',[['shell','단단한 껍데기로 덮여 있어'],['bare','털과 깃털 없이 맨살이 드러나 있어'],['fur','부드러운 털로 덮여 있어']],'bare','개구리의 몸 표면을 관찰했던 기록을 봐.','frog'),
   row('frog-proof','이 설명을 확인한 부분',[['eye','눈'],['skin','몸 표면'],['leg','뒷다리']],'skin','몸을 무엇이 덮고 있는지는 어디에서 확인할까?','frog'),
   row('crab-label','게의 설명',[['four','다리가 네 개 있어'],['fin','다리 대신 지느러미가 있어'],['claw','집게다리와 여러 걷는 다리가 있어']],'claw','게의 다리 관찰 기록을 다시 펼쳐 봐.','crab'),
   row('crab-proof','이 설명을 확인한 부분',[['legs','다리'],['eyes','눈'],['shell','등딱지']],'legs','집게와 걷는 다리는 몸의 어느 부분일까?','crab')]},
  {title:'새 친구 전시대',intro:'오리와 토끼 전시대를 새로 만들어. 두 동물의 같은 점과 다른 점을 골라 줘.',kind:'repair',rows:[
   row('duck','오리의 몸을 덮은 것',[['fur','털'],['feather','깃털'],['shell','껍데기']],'feather','오리의 날개와 몸 표면 기록을 확인해 봐.','duck'),
   row('rabbit','토끼의 몸을 덮은 것',[['scale','비늘'],['feather','깃털'],['fur','털']],'fur','토끼의 몸 표면 기록을 확인해 봐.','rabbit'),
   row('same','둘의 같은 점',[['web','둘 다 물갈퀴가 있어'],['legs','둘 다 다리로 땅을 디딜 수 있어'],['wing','둘 다 날개가 있어']],'legs','서로 다른 점만 보지 말고, 두 동물 모두에게 있는 부분도 찾아봐.')]},
 ],challenge:{title:'한 문장 바로잡기',intro:'안내 방송에 잘못 들어간 문장 하나를 고쳐 줘.',kind:'repair',rows:[row('fix','“개구리와 게는 둘 다 껍데기가 있다.”',[['both','둘 다 털이 있다'],['crab','게는 껍데기, 개구리는 맨살이 드러나 있다'],['frog','개구리에게만 껍데기가 있다']],'crab','몸 표면 두 기록을 나란히 비교해 봐.')]}},
 {id:2,npc:'큐레이터 준',portrait:'curator',title:'새 동물의 전시 자리를 정해 줘',exhibit:'내 기준 분류 정원',thanks:'네 기준을 따라 다른 연구원도 같은 자리에 카드를 놓았어!',badge:'공정한 분류가',tool:'관찰 렌즈',missions:[
  {title:'분류 표지판 완성',intro:'닭과 박쥐가 같은 칸에 있어. 왜 같은 칸인지 이유를 골라 줘.',kind:'repair',rows:[
   row('reason','같은 칸에 놓은 까닭',[['fly','둘 다 멀리 잘 날아서'],['wings','둘 다 몸에 날개가 있어서'],['bird','둘 다 새라서']],'wings','얼마나 잘 나는지 대신, 몸에서 확인한 부분을 떠올려 봐.','bat')]},
  {title:'내 기준으로 자리 바꾸기',intro:'이번엔 네가 나누는 기준을 정해! 몸을 보고 알 수 있는 기준으로 동물을 O·X로 나눠 줘.',kind:'own-sort',rows:[]},
 ],challenge:{title:'헷갈리는 기준 구출',intro:'“멋지게 생겼나요?”로 나눴더니 친구와 결과가 달라졌어.',kind:'repair',rows:[row('fix','누구나 확인할 수 있는 새 기준',[['cool','더 멋있나요?'],['six','다리가 여섯 개인가요?'],['scary','무서운가요?']],'six','생각이나 기분 대신 몸에서 셀 수 있는 것을 찾아봐.')]}},
 {id:3,npc:'레인저 하늘',portrait:'ranger',title:'생태 탐방 방송을 완성해 줘',exhibit:'살아 있는 생태 방송',thanks:'방문객들이 몸의 특징과 움직임을 연결하며 물가를 둘러볼 수 있게 됐어!',badge:'생태 해설가',tool:'분류 나침반',missions:[
  {title:'숲과 바다 방송',intro:'토끼와 바다 물고기를 소개하는 방송이야. 사는 곳 → 몸 → 움직이는 방법을 차례로 골라 줘.',kind:'broadcast',rows:[
   row('rabbit-place','토끼 · 사는 곳',[['forest','숲과 들'],['sea','바닷물 속'],['ice','얼음 바다']],'forest','토끼를 처음 발견한 곳의 풀과 나무를 떠올려 봐.','rabbit'),
   row('rabbit-body','토끼 · 움직일 때 쓰는 부분',[['fin','지느러미'],['leg','긴 뒷다리'],['wing','날개']],'leg','토끼의 움직임을 멈춰 기록한 장면을 떠올려 봐.','rabbit'),
   row('rabbit-life','토끼 · 움직임',[['swim','물속에서 헤엄쳐'],['fly','날아다녀'],['jump','땅을 박차고 뛰어']],'jump','긴 뒷다리로 땅을 밀면 어떻게 움직일까?','rabbit'),
   row('marine-place','바다 물고기 · 사는 곳',[['sea','바닷물 속'],['forest','풀밭'],['pond','민물 연못']],'sea','이 친구는 바다에서 만난 물고기야.','marine'),
   row('marine-body','바다 물고기 · 쓰는 부분',[['web','물갈퀴 달린 발'],['fin','지느러미와 꼬리'],['leg','긴 뒷다리']],'fin','다리 대신 몸 옆과 뒤에 있는 부분을 봐.','marine'),
   row('marine-life','바다 물고기 · 움직임',[['walk','갯벌 위를 걸어'],['swim','물속에서 헤엄쳐'],['jump','땅을 박차고 뛰어']],'swim','지느러미와 꼬리를 움직여 어디를 지나갈까?','marine')]},
  {title:'연못과 꽃밭 방송',intro:'이번엔 오리와 나비 차례야. 각 동물에게 맞는 사는 곳·몸·움직임을 골라 줘.',kind:'broadcast',rows:[
   row('duck-place','오리 · 사는 곳',[['pond','연못과 물가'],['dry','건조한 사막'],['sea','깊은 바닷속']],'pond','오리를 발견한 물가를 떠올려 봐.','duck'),
   row('duck-body','오리 · 헤엄칠 때 쓰는 부분',[['bill','부리'],['web','물갈퀴 달린 발'],['fur','털']],'web','물속에서 발을 뒤로 젓던 장면을 떠올려 봐.','duck'),
   row('duck-life','오리 · 물 위의 움직임',[['swim','발로 물을 밀며 헤엄쳐'],['fly','지느러미로 날아'],['jump','뒷다리로 물속을 뛰어']],'swim','발가락 사이의 넓은 막이 물을 밀어.','duck'),
   row('butterfly-place','나비 · 만난 곳',[['sea','바닷물 속'],['flowers','꽃이 핀 풀밭'],['ice','얼음 속']],'flowers','나비를 찾았던 숲과 들의 모습을 떠올려 봐.','butterfly'),
   row('butterfly-body','나비 · 날 때 쓰는 부분',[['wing','날개'],['fin','지느러미'],['web','물갈퀴']],'wing','나비가 위아래로 움직이는 넓은 부분은 무엇일까?','butterfly'),
   row('butterfly-life','나비 · 움직임',[['swim','물속에서 헤엄쳐'],['walk','집게로 걸어'],['fly','날개를 움직여 날아']],'fly','꽃 사이로 이동하는 장면을 떠올려 봐.','butterfly')]},
 ],challenge:{title:'다른 환경의 친구',intro:'관찰 돔에서 만난 낙타와 펭귄도 방송에 초대해 보자.',kind:'broadcast',rows:[row('camel','낙타의 넓적한 발바닥',[['sand','모래 위를 걸을 때 쓰여'],['swim','물고기처럼 헤엄칠 때 쓰여']],'sand','건조한 곳의 모래 바닥을 떠올려 봐.'),row('penguin','펭귄의 짧은 날개',[['swim','바닷물 속을 헤엄칠 때 쓰여'],['sky','하늘을 멀리 날 때 쓰여']],'swim','날개가 있다고 모두 하늘을 나는 것은 아니야.')]}},
 {id:4,npc:'기록 안내원 나라',portrait:'detective',title:'주인 잃은 기록을 돌려줘',exhibit:'동물 기록 안내소',thanks:'이름만 찍지 않고 서로 다른 근거를 함께 확인해 줬구나. 네 안내 카드라면 믿고 찾아갈 수 있어!',badge:'근거 탐정',tool:'서식지 수첩',missions:[
  {title:'물가의 기록 두 장',intro:'이름표가 떨어진 기록이야. 단서를 보고 누구의 기록인지 찾아 줘.',kind:'return',rows:[
   row('a','맨살이 드러난 몸 + 긴 뒷다리',[['duck','오리'],['frog','개구리'],['fish','금붕어']],'frog','깃털·비늘·맨살을 구별한 뒤 다리도 함께 봐.'),
   row('a-place','첫 기록이 발견된 곳',[['pond','연못과 물가'],['desert','건조한 사막'],['sea','깊은 바닷속']],'pond','개구리의 서식지 수첩을 펼쳐 봐.'),
   row('b','단단한 껍데기 + 집게다리',[['crab','게'],['rabbit','토끼'],['frog','개구리']],'crab','껍데기만 보지 말고 집게도 함께 확인해.'),
   row('b-life','두 번째 기록의 생활',[['fly','날개로 날아'],['walk','여러 다리로 갯벌을 걸어'],['jump','긴 뒷다리로 뛰어']],'walk','게가 갯벌을 지나간 장면을 떠올려 봐.')]},
  {title:'새로 도착한 두 기록',intro:'새 기록 두 장이 왔어. 단서 두 개가 모두 맞는 동물을 찾아 줘.',kind:'return',rows:[
   row('a','투명한 날개 + 여섯 개의 다리',[['bat','박쥐'],['bee','벌'],['hen','닭']],'bee','날개는 셋 모두 있지만 다리 수는 달라.'),
   row('a-proof','박쥐와 구별하는 데 쓴 단서',[['wing','날개가 있다'],['six','다리가 여섯 개다'],['cute','귀엽다']],'six','둘 다 날개가 있으니 다른 특징을 확인해야 해.'),
   row('b','나선 모양 껍데기 + 다리 없이 기어감',[['crab','게'],['snail','달팽이'],['fish','금붕어']],'snail','껍데기 모양과 이동할 때 쓰는 부분을 함께 살펴봐.'),
   row('b-proof','게와 구별하는 데 쓴 단서',[['shell','껍데기가 있다'],['legs','걷는 다리가 없다'],['small','작다']],'legs','게에게는 여러 걷는 다리가 있어.')]},
 ],challenge:{title:'단서가 모자라!',intro:'“날개가 있다”는 기록 한 줄만 남았어.',kind:'return',rows:[row('fix','지금 할 일',[['guess','바로 나비라고 정한다'],['more','다리 수나 날개 모습을 더 관찰한다'],['all','모두 같은 동물이라고 정한다']],'more','여러 동물이 같은 특징을 가질 수 있어. 하나만 남도록 더 확인해 보자.')]}},
 {id:5,npc:'기술자 도윤',portrait:'engineer',title:'네가 상상한 발명을 전시해 줘',exhibit:'우리 생활 발명품 전시',thanks:'같은 발명도 쓰는 사람과 조건에 맞게 바꿀 수 있구나. 두 시험의 근거가 붙은 네 발명품을 전시할게!',badge:'생활 발명가',tool:'특징 스캐너',missions:[
  {title:'첫 손님의 부탁',intro:'첫 발명품을 손님에게 맞게 고쳐 줘. 모양만 바꿔 두 번 시험하고 더 알맞은 것을 골라.',kind:'retest',rows:[]},
  {title:'두 번째 손님의 부탁',intro:'두 번째 발명품에도 부탁이 왔어. 시험 결과를 보고 손님에게 맞는 모양을 골라 줘.',kind:'retest',rows:[]},
 ],challenge:{title:'전시회 안내 문장',intro:'관람객에게 발명의 원리를 설명해 줘.',kind:'repair',rows:[row('fix','동물 특징을 이용한 발명이란?',[['looks','동물과 똑같은 색으로 칠하는 것'],['use','몸의 특징이 하는 일을 물건의 구조에 이용하는 것'],['magic','동물이 물건을 대신 움직여 주는 것']],'use','물갈퀴의 넓은 면과 오리발의 넓은 면이 하는 일을 연결해 봐.')]}},
];
export const SORT_KEYS={legs:'다리가 있나요?',six:'다리가 여섯 개인가요?',web:'물갈퀴가 있나요?'};
const SORT_TRUTH={legs:['hen','bat','bee'],six:['bee'],web:[]};
// The curator's own-sort needs a criterion that splits the four animals (물갈퀴 puts all of them in X).
const splitsArrivals=key=>(SORT_TRUTH[key]||[]).length>0&&(SORT_TRUTH[key]||[]).length<4;
export const RETEST={
 swim:{name:'오리발',request:'처음 배우는 친구의 부탁이야. 미는 물은 중간 이상, 드는 힘은 중간 이하인 모양을 찾아 줘.',levels:['좁은 면','중간 면','넓은 면'],metrics:['미는 물','움직이는 데 드는 힘'],values:[[1,1],[2,2],[3,3]],target:2,reason:'미는 물과 필요한 힘을 함께 비교했어.',note:'같은 횟수로 젓는 모형이야. 면이 넓으면 물을 더 밀지만 움직이는 데 드는 힘도 커져.'},
 protect:{name:'보호 덮개',request:'전시 모형의 위와 옆을 가려 줘. 뒷부분까지 덮을 재료는 부족하니, 꼭 필요한 곳만 감싸 달래.',levels:['위쪽 덮개','위와 옆 덮개','위·옆·뒤 덮개'],metrics:['가려지는 범위','쓰는 재료의 양'],values:[[1,1],[2,2],[3,3]],target:2,reason:'위와 옆을 가리면서 재료도 아낄 수 있어.',note:'같은 재료와 두께로, 덮개가 감싸는 곳만 바꿔. 더 많은 곳을 감싸면 필요한 재료도 늘어나.'},
 warm:{name:'보온 옷',request:'아주 추운 곳에서 가만히 관찰하는 친구야. 움직임이 불편해도 괜찮으니 따뜻함을 가장 잘 유지하는 모양을 부탁했어.',levels:['한 겹','두 겹','세 겹'],metrics:['따뜻함을 유지하는 정도','움직임의 불편함'],values:[[1,1],[2,2],[3,3]],target:3,reason:'추운 곳에서 가만히 관찰하므로 따뜻함을 먼저 생각했어.',note:'같은 재료와 크기를 쓰는 모형이야. 겹이 늘면 따뜻함을 더 오래 유지하지만 움직임은 불편해질 수 있어.'},
};
export const missionKey=(stage,index)=>`${stage}-${index}`;
const cleanObject=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const clone=x=>JSON.parse(JSON.stringify(x));
export function freshCampaign(previous=[]){return {version:1,grandfathered:previous.filter(id=>Number.isInteger(id)&&id>=1&&id<=5),drafts:{},records:{}};}
export function ensureCampaign(s){if(!s.campaign)s.campaign=freshCampaign(s.completed);return s.campaign;}
export function commission(stage,index){return index===2?COMMISSIONS[stage-1]?.challenge:COMMISSIONS[stage-1]?.missions[index];}
export function campaignDraft(s,stage,index){const c=ensureCampaign(s),key=missionKey(stage,index);return c.drafts[key]??=( {answers:{},seen:[],usedTool:false,trials:[],level:1,prediction:''});}
export function designProblem(s,index){return s.records?.designs?.[index]?.problem||s.designs?.[index]?.problem||'';}
export function missionRows(s,stage,index,d=campaignDraft(s,stage,index)){
 const m=commission(stage,index);if(!m)return [];
 if(m.kind==='own-sort')return ['hen','bat','bee','snail'].map((id,i)=>row(id,['닭','박쥐','벌','달팽이'][i],yesNo,SORT_TRUTH[d.answers.criterion]?.includes(id)?'yes':'no','선택한 기준에 해당하는 몸 부분을 다시 확인해 봐.',id));
 return m.rows;
}
export function campaignReady(s,stage,index,d=campaignDraft(s,stage,index)){
 if(stage===5&&index<2&&s.studioRecord)return studioReady(s.studioRecord);
 const m=commission(stage,index);if(!m)return false;
 if(m.kind==='own-sort'&&(!Object.hasOwn(SORT_KEYS,d.answers.criterion)||!splitsArrivals(d.answers.criterion)))return false;
 if(m.kind==='retest'){
  const p=designProblem(s,index),r=RETEST[p],levels=new Set(d.trials.filter(t=>t.problem===p).map(t=>t.level));
  return !!r&&levels.size>=2&&levels.has(r.target)&&d.answers.choice===String(r.target)&&d.answers.reason==='fit';
 }
 return missionRows(s,stage,index,d).every(r=>d.answers[r.key]===r.answer);
}
export function campaignHint(s,stage,index){const d=campaignDraft(s,stage,index),m=commission(stage,index);
 if(stage===5&&index<2&&s.studioRecord)return '내 발명 그리기와 작품 소개를 완성해 줘.';
 if(m.kind==='own-sort'&&!Object.hasOwn(SORT_KEYS,d.answers.criterion))return '먼저 몸에서 확인할 수 있는 분류 기준을 골라 줘.';
 if(m.kind==='retest'){const p=designProblem(s,index),r=RETEST[p];if(!r)return '먼저 두 발명품을 완성해 줘.';const tried=new Set(d.trials.filter(t=>t.problem===p).map(t=>t.level));if(tried.size<2)return '서로 다른 모양을 두 가지 이상 시험해 줘. 시험 전에 예상도 골라 봐.';if(!tried.has(r.target)||d.answers.choice!==String(r.target))return '시험 표의 두 항목과 손님의 부탁을 함께 비교해 봐. 아직 안 해 본 모양도 시험할 수 있어.';return '그 모양을 고른 이유를 손님의 부탁과 연결해 줘.';}
 const bad=missionRows(s,stage,index,d).find(r=>d.answers[r.key]!==r.answer);return bad?(d.answers[bad.key]?`${bad.label}: ${bad.hint}`:`‘${bad.label}’에 아직 기록을 놓지 않았어.`):'';
}
export const campaignDone=(s,stage,index)=>!!s.campaign?.records?.[missionKey(stage,index)];
export const restoredPlaces=s=>s.completed.filter(id=>!s.campaign||s.campaign.grandfathered.includes(id)||(campaignDone(s,id,0)&&campaignDone(s,id,1)));
export const commissionCount=s=>Object.keys(s.campaign?.records||{}).filter(k=>!k.endsWith('-2')).length;
export const requestCount=s=>COMMISSIONS.filter(c=>campaignDone(s,c.id,0)&&campaignDone(s,c.id,1)).length;
export function campaignOpen(s,stage,index){return !!commission(stage,index)&&s.completed.includes(stage)&&(index<2||(campaignDone(s,stage,0)&&campaignDone(s,stage,1)));}
// Keep the two legacy evidence keys, but validate the whole letter before awarding anything.
export function claimRequest(s,stage){
 if(!campaignOpen(s,stage,0))return {ok:false,index:0};
 const pending=[0,1].filter(i=>!campaignDone(s,stage,i));
 const index=pending.find(i=>!campaignReady(s,stage,i));
 if(index!==undefined)return {ok:false,index};
 for(const i of pending)claimCommission(s,stage,i);
 return {ok:true,fresh:pending.length>0,restored:true};
}
export function claimCommission(s,stage,index){
 if(!campaignOpen(s,stage,index)||(index===1&&!campaignDone(s,stage,0))||!campaignReady(s,stage,index))return {ok:false};
 const c=ensureCampaign(s),key=missionKey(stage,index),fresh=!c.records[key];if(fresh)c.records[key]=clone(campaignDraft(s,stage,index));return {ok:true,fresh,restored:restoredPlaces(s).includes(stage)};
}
export function chooseCommission(s,stage,index,key,value){
 if(!campaignOpen(s,stage,index))return false;const d=campaignDraft(s,stage,index),m=commission(stage,index);
 if(key==='criterion'&&m.kind==='own-sort'&&Object.hasOwn(SORT_KEYS,value)){if(d.answers.criterion!==value)d.answers={criterion:value};return true;}
 if(m.kind==='retest'&&((key==='choice'&&['1','2','3'].includes(value))||(key==='reason'&&['fit','big','looks'].includes(value)))){d.answers[key]=value;return true;}
 const r=missionRows(s,stage,index,d).find(r=>r.key===key);if(!r?.options.some(o=>o[0]===value))return false;d.answers[key]=value;return true;
}
export function runCommissionTrial(s,stage,index){const d=campaignDraft(s,stage,index),p=designProblem(s,index);if(!campaignOpen(s,stage,index)||commission(stage,index)?.kind!=='retest'||!RETEST[p]||!['more','same','less'].includes(d.prediction))return false;
 if(!d.trials.some(t=>t.problem===p&&t.level===d.level))d.trials.push({problem:p,level:d.level,prediction:d.prediction});return true;
}
export function normalizeCampaign(raw,s){
 const x=cleanObject(raw),out=freshCampaign(Array.isArray(x.grandfathered)?x.grandfathered.filter(id=>s.completed.includes(id)):[]);
 for(let stage=1;stage<=5;stage++)for(let index=0;index<=2;index++){
  const key=missionKey(stage,index);for(const area of ['drafts','records']){const input=cleanObject(cleanObject(x[area])[key]);if(!Object.keys(input).length)continue;
   const d={answers:{},seen:[],usedTool:input.usedTool===true,trials:[],level:[1,2,3].includes(input.level)?input.level:1,prediction:['more','same','less'].includes(input.prediction)?input.prediction:''};
   for(const [k,v]of Object.entries(cleanObject(input.answers)))if(/^[a-z-]{1,24}$/.test(k)&&typeof v==='string'&&v.length<32)d.answers[k]=v;
   if(stage===2&&index===0&&!d.answers.reason&&['hen','bat','bee'].every(id=>d.answers[id]==='yes')&&d.answers.snail==='no')d.answers.reason='wings';
   if(Array.isArray(input.trials))d.trials=input.trials.slice(0,9).filter(t=>t&&Object.hasOwn(RETEST,t.problem)&&[1,2,3].includes(t.level)&&['more','same','less'].includes(t.prediction)).map(t=>({problem:t.problem,level:t.level,prediction:t.prediction}));
   if(area==='drafts')out.drafts[key]=d;else if(s.completed.includes(stage)&&(index===0||out.records[missionKey(stage,index-1)])&&campaignReady(s,stage,index,d))out.records[key]=d;
  }
 }
 return out;
}
export function campaignReport(s,narrative=false){return COMMISSIONS.flatMap(c=>[0,1,2].filter(i=>campaignDone(s,c.id,i)).flatMap(i=>{if(c.id===5&&i<2&&s.studioRecord)return i===0?(narrative?[`나는 “${s.studioRecord.title}”라는 발명을 상상했어.`,'직접 그린 그림과 소개 글을 전시했어.','']:['우리 생활 발명품 전시 · '+s.studioRecord.title,'자유 발명 그림과 작품 소개를 전시했어.','']):[];const d=s.campaign.records[missionKey(c.id,i)],m=commission(c.id,i);if(narrative)return [`${c.npc}의 부탁을 도와주었어. ${m.title} 활동을 했어.`,...missionRows(s,c.id,i,d).map(r=>`${r.label}에 대해 ${withParticle('“'+(r.options.find(o=>o[0]===d.answers[r.key])?.[1]||'')+'”','이라고/라고')} 기록했어.`),...(m.kind==='own-sort'?[`나는 “${SORT_KEYS[d.answers.criterion]}” 기준으로 동물을 나눠 봤어.`]:[]),...(m.kind==='retest'?[`모양을 ${withParticle(d.trials.map(t=>RETEST[t.problem].levels[t.level-1]).join(', '),'으로/로')} 바꾸며 비교했어.`]:[]),''];return [`${c.title} · ${m.title}`, ...(m.kind==='own-sort'?[`내 기준: ${SORT_KEYS[d.answers.criterion]}`]:m.kind==='sort'?[m.criterion]:[]), ...missionRows(s,c.id,i,d).map(r=>`${r.label}: ${r.options.find(o=>o[0]===d.answers[r.key])?.[1]||''}`),...(m.kind==='retest'?[`시험: ${d.trials.map(t=>RETEST[t.problem].levels[t.level-1]).join(' / ')}`,`선택 이유: ${RETEST[designProblem(s,i)]?.reason||''}`]:[]),''];}));}
// A request is answered one card at a time: one animal's chain, one lost record, or a whole sort/test.
export const requestParts=(stage,index)=>index===2?[2]:stage===5?[1,0]:[0,1];
export function requestCards(s,stage,parts){return parts.flatMap(i=>{const m=commission(stage,i),rows=missionRows(s,stage,i);
 if(!m)return [];if(!rows.length||m.kind==='own-sort'||m.kind==='retest')return [{part:i,kind:m.kind,rows,animal:''}];
 const groups=new Map();for(const r of rows){const g=m.kind==='return'?r.key.split('-')[0]:r.animal||'common';if(!groups.has(g))groups.set(g,[]);groups.get(g).push(r);}
 return [...groups.values()].map(list=>({part:i,kind:m.kind,rows:list,animal:m.kind==='return'?'':list[0].animal||''}));});}
const answered=(d,r)=>Boolean(d.answers[r.key]);
export function cardDone(s,stage,card){const d=campaignDraft(s,stage,card.part);if(card.kind==='retest')return campaignDone(s,stage,card.part)||campaignReady(s,stage,card.part,d);if(card.kind==='own-sort'&&!d.answers.criterion)return false;return card.rows.every(r=>answered(d,r));}
export function cardProgress(s,stage,cards){let n=0,total=0;for(const c of cards){const d=campaignDraft(s,stage,c.part);if(c.kind==='retest'){total++;n+=cardDone(s,stage,c)?1:0;}else{total+=c.rows.length;n+=c.rows.filter(r=>answered(d,r)).length;}}return {answered:n,total};}
// First blank answer in display order wins over a wrong one, so "submit" always says where to look next.
export function requestGap(s,stage,parts){const pending=parts.filter(i=>!campaignDone(s,stage,i));
 for(const i of pending){const d=campaignDraft(s,stage,i),m=commission(stage,i);
  if(m.kind==='own-sort'&&!SORT_KEYS[d.answers.criterion])return {index:i,key:'criterion',missing:true,text:'먼저 몸에서 확인할 수 있는 분류 기준을 골라 줘.'};
  if(m.kind==='own-sort'&&!splitsArrivals(d.answers.criterion))return {index:i,key:'criterion',text:`‘${SORT_KEYS[d.answers.criterion]}’로 나누면 네 동물이 모두 ${(SORT_TRUTH[d.answers.criterion]||[]).length?'O':'X'} 칸이야. 두 무리로 나뉘는 기준을 골라 봐.`};
  const blank=missionRows(s,stage,i,d).find(r=>!answered(d,r));if(blank)return {index:i,key:blank.key,missing:true,text:`‘${blank.label}’ 칸이 아직 비어 있어. 그 카드로 옮겨 뒀어.`};}
 const i=pending.find(i=>!campaignReady(s,stage,i));if(i===undefined)return null;
 const d=campaignDraft(s,stage,i),bad=missionRows(s,stage,i,d).find(r=>d.answers[r.key]!==r.answer);
 return {index:i,key:bad?.key||'',missing:false,text:campaignHint(s,stage,i)};}
export function firstOpenCard(s,stage,parts){const k=requestCards(s,stage,parts).findIndex(c=>!cardDone(s,stage,c));return Math.max(0,k);}
