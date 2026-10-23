import {STORAGE_KEY,VERSION,freshExpedition,restoreExpedition} from './expedition.js';

// A failed read must never replace a student's original string with a new save.
export function inspectRecord(raw){
 if(raw===null)return {status:'empty',state:freshExpedition(),raw};
 let value;try{value=JSON.parse(raw);}catch{return {status:'corrupt',raw};}
 if(!value||typeof value!=='object'||Array.isArray(value)||!Number.isInteger(value.version))return {status:'corrupt',raw};
 if(![1,3,VERSION].includes(value.version))return {status:'unsupported',raw,version:value.version};
 if(!Array.isArray(value.observed)||!Array.isArray(value.completed)||value.version!==1&&!Array.isArray(value.activities))return {status:'corrupt',raw};
 try{return {status:'ok',raw,state:restoreExpedition(raw,{strict:true})};}catch{return {status:'corrupt',raw};}
}
export function createRecordStorage(storage){
 let lastRaw=null,blocked=false;
 const api={status:'empty',raw:null,
  read(){try{const result=inspectRecord(storage.getItem(STORAGE_KEY));lastRaw=result.raw;api.raw=result.raw;blocked=!['ok','empty'].includes(result.status);api.status=result.status;return result;}catch{blocked=true;api.status='unavailable';return {status:api.status};}},
  write(state,{replace=false}={}){
   if(blocked&&!replace)return false;
   try{
    const current=storage.getItem(STORAGE_KEY);
    if(current!==lastRaw){blocked=true;api.raw=current;api.status='conflict';return false;}
    const next=JSON.stringify(state);storage.setItem(STORAGE_KEY,next);
    lastRaw=next;api.raw=next;blocked=false;api.status='ok';return true;
   }catch(error){api.status=error?.name==='QuotaExceededError'?'quota':'unavailable';return false;}
  },
 };
 return api;
}
export function recordBackup(state,now=new Date()){
 return JSON.stringify({format:'animal-record-recovery-backup',formatVersion:1,exportedAt:now.toISOString(),includes:'진도·관찰·첫 응답과 도움 후 기록·주민 답장·사진·그림·발명 소개·소리 설정. 앱의 공통 그림·영상·음악 파일은 제외.',state},null,2);
}
export function openRecordBackup(text){
 const value=JSON.parse(text);
 if(value?.format!=='animal-record-recovery-backup'||value.formatVersion!==1)throw new Error('이 앱의 탐험 기록 백업 파일을 골라 줘.');
 const result=inspectRecord(JSON.stringify(value.state));
 if(result.status!=='ok')throw new Error(result.status==='unsupported'?'이 백업은 다른 버전의 앱에서 만들어졌어. 원본 파일을 보관하고 선생님에게 알려 줘.':'백업 내용을 읽지 못했어. 원본 파일을 보관해 줘.');
 return result.state;
}
export function saveRecordFile(text,name){
 const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export const storageMessage=status=>({corrupt:'저장된 기록을 읽지 못했어. 원본을 보존하고 자동 저장을 멈췄어.',unsupported:'다른 버전의 기록이 있어. 원본을 보존하고 자동 저장을 멈췄어.',conflict:'다른 창에서 기록이 바뀌었어. 덮어쓰지 않고 자동 저장을 멈췄어.',quota:'저장 공간이 부족해. 마지막 저장 기록은 그대로야. 이 창의 새 기록은 백업 파일로 보관해 줘.',unavailable:'브라우저 저장소에 접근할 수 없어. 원본을 덮어쓰지 않았어. 이 창을 닫기 전에 기록 보존 안내를 열어 줘.'}[status]||'');
