import {STAGES,freshExpedition,OBSERVATIONS,OBSERVE_PAIRS,COMPARES,SORT_ANIMALS,ANIMALS,DISCOVERIES,LINKS,CASES,PROBLEMS,claimTask,recordTrial} from '../../src/expedition.js';
import {addExperimentTrial} from '../../src/inquiry.js';
import {freshCampaign} from '../../src/campaign.js';
// Completed exploration only, with no commissions awarded. Used on an isolated
// localhost origin; never loaded by the shipping app or the user's saved game.
export function campaignFixture(problems=['swim','protect']){
 const s=freshExpedition();s.introSeen=true;
 for(let stage=1;stage<=5;stage++)for(let step=0;step<STAGES[stage-1].tasks.length;step++){
  const r=Math.floor(step/2);
  if(stage===1){if(step%2===0)s.observed.push(...OBSERVE_PAIRS[r].flatMap(id=>OBSERVATIONS[id].map(o=>o.id)));else for(const q of COMPARES[r])s.compares[r][q.key]=`${q.key}-${q.answer}`;}
  if(stage===2){const key=r?'web':'wings';s.criteria[r]=key;if(step%2===0)for(const id of SORT_ANIMALS)s.sorts[r][id]=ANIMALS[id][key]?'yes':'no';else if(r){s.inquiry.verify[1].checked=key;s.inquiry.reclass[1]={prediction:'yes',revealed:true};}else s.inquiry.verify[0]={ran:true,cause:'opinion',fix:key,checked:key};}
  if(stage===3){if(step%2===0)for(const d of DISCOVERIES.slice(r*3,r*3+3)){s.discovered.push(d.id);s.inquiry.motion[d.animal]=1;}else{const id=r?'crab':'frog';for(const [i,key]of ['environment','body','life'].entries())s.links[id][key]=LINKS[id].answer[i];}}
  if(stage===4){const c=CASES[r],g=[['place','cover'],['place','move'],['place','paws']][r];Object.assign(s.cases[r],{opened:g,grounds:g,candidate:c.animal,habitat:c.habitat,reason:c.reason});}
  if(stage===5){const p=problems[r],d=s.designs[r];Object.assign(d,{problem:p,feature:PROBLEMS[p].feature,structure:PROBLEMS[p].structure,spot:{swim:'toe',protect:'top',warm:'body'}[p],name:PROBLEMS[p].product});d.experiment.sourceSeen=true;if(step%2){recordTrial(s,r);d.experiment.prediction='more';for(const level of [1,3]){d.experiment.level=level;addExperimentTrial(d);}d.experiment.reflection='changed';d.experiment.note='바꾼 부분과 두 결과를 비교했어.';d.explanation='match';}}
  if(!claimTask(s,stage,step).ok)throw Error(`Invalid exploration fixture ${stage}-${step}`);
 }
 s.campaign=freshCampaign();s.stage=1;s.mapPosition='1';return s;
}
