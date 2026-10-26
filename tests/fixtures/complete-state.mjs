// Full run (24 stars, all commissions, a saved artwork). Isolated QA/test use only.
import {campaignFixture} from './campaign-state.mjs';
import {campaignDraft,missionRows,chooseCommission,claimCommission,RETEST,runCommissionTrial} from '../../src/campaign.js';
import {createStudio} from '../../src/studio.js';
function solve(s,stage,index){
 const d=campaignDraft(s,stage,index);if(stage===2&&index===1)chooseCommission(s,stage,index,'criterion','six');
 if(stage===5&&index<2){for(const level of [1,RETEST[s.records.designs[index].problem].target]){d.level=level;d.prediction='more';runCommissionTrial(s,stage,index);}chooseCommission(s,stage,index,'choice',String(RETEST[s.records.designs[index].problem].target));chooseCommission(s,stage,index,'reason','fit');}
 else for(const r of missionRows(s,stage,index))chooseCommission(s,stage,index,r.key,r.answer);
}
export function completeFixture(){const s=campaignFixture();for(let stage=1;stage<=5;stage++)for(const i of [0,1,2]){solve(s,stage,i);claimCommission(s,stage,i);}
 s.studioRecord={...createStudio(),title:'날개 우산',audience:'비 오는 날 친구',purpose:'펼쳐서 써.',inspiration:'박쥐 날개',strokes:[{color:'#294b3e',width:8,tool:'pen',points:[{x:10,y:10},{x:200,y:200}]}]};return s;}
