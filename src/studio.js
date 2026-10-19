// An open drawing has no model answer. Keep only bounded, portable artwork data.
export const STUDIO_WIDTH=1000,STUDIO_HEIGHT=650;
export const STUDIO_LIMITS={title:48,audience:100,purpose:300,inspiration:200,strokes:160,points:250};
export const createStudio=()=>({version:1,title:'',audience:'',purpose:'',inspiration:'',strokes:[],tools:{color:'#294b3e',width:10,tool:'pen'}});
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
export function normalizeStudio(value){
  const raw=object(value),out=createStudio();
  const tools=object(raw.tools);
  if(typeof tools.color==='string'&&/^#[0-9a-f]{6}$/i.test(tools.color))out.tools.color=tools.color.toLowerCase();
  if(Number.isFinite(tools.width))out.tools.width=clamp(tools.width,1,60);
  if(['pen','pencil','marker','eraser'].includes(tools.tool))out.tools.tool=tools.tool;
  for(const key of ['title','audience','purpose','inspiration'])out[key]=typeof raw[key]==='string'?raw[key].slice(0,STUDIO_LIMITS[key]):'';
  if(Array.isArray(raw.strokes))out.strokes=raw.strokes.slice(0,STUDIO_LIMITS.strokes).map(value=>{
    const stroke=object(value),color=typeof stroke.color==='string'&&/^#[0-9a-f]{6}$/i.test(stroke.color)?stroke.color.toLowerCase():'#294d40';
    const width=Number.isFinite(stroke.width)?clamp(stroke.width,1,60):5;
    const tool=['pen','pencil','marker','eraser'].includes(stroke.tool)?stroke.tool:'pen';
    const points=Array.isArray(stroke.points)?stroke.points.slice(0,STUDIO_LIMITS.points).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:clamp(p.x,0,STUDIO_WIDTH),y:clamp(p.y,0,STUDIO_HEIGHT)})):[];
    return {color:tool==='eraser'?'#ffffff':color,width,points,tool};
  }).filter(stroke=>stroke.points.length);
  return out;
}
const hasDrawing=studio=>studio.strokes.some(stroke=>stroke.tool!=='eraser'&&stroke.color!=='#ffffff'&&stroke.points.length>0);
export function studioDrawingReady(value){const studio=normalizeStudio(value);return Boolean(studio.title.trim()&&hasDrawing(studio));}
export function studioReady(value){const studio=normalizeStudio(value);return studioDrawingReady(studio)&&['audience','purpose','inspiration'].every(key=>studio[key].trim());}
export function studioHint(value,step=2){
  const studio=normalizeStudio(value);
  if(!hasDrawing(studio))return '빈 도화지에 네 발명 아이디어를 자유롭게 그려 봐. 정해진 모양은 없어!';
  if(!studio.title.trim())return '네가 그린 발명품에 이름을 붙여 줘.';
  if(step===2)return '그림을 더 꾸며도 좋아. 준비되면 작품 소개를 써 보자.';
  if(!studio.audience.trim())return '이 발명품이 누구를 도와주는지 알려 줘.';
  if(!studio.purpose.trim())return '어떻게 쓰는 발명품인지 네 생각을 적어 줘.';
  if(!studio.inspiration.trim())return '어떤 동물의 특징에서 아이디어를 얻었는지 소개해 줘.';
  return '그림과 소개가 준비됐어! 작품을 저장하고 전시관에 보내 보자.';
}
