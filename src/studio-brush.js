// One brush description and curve keep the drawing board and PNG export alike.
const bound=(value,min,max,fallback=min)=>Math.max(min,Math.min(max,Number.isFinite(value)?value:fallback));
export function brushStyle(stroke={}){
 const tool=['pen','pencil','marker','eraser'].includes(stroke.tool)?stroke.tool:'pen';
 return {tool,color:tool==='eraser'?'#ffffff':/^#[0-9a-f]{6}$/i.test(stroke.color||'')?stroke.color.toLowerCase():'#294b3e',width:bound(stroke.width,1,60,10),opacity:tool==='marker'?.38:tool==='pencil'?.72:1,cap:tool==='marker'?'square':tool==='pencil'?'butt':'round',dash:tool==='pencil'?[.7,1.2]:[]};
}
function pathCommands(points){
 if(points.length<2)return [];
 const commands=[['M',points[0].x,points[0].y]];
 if(points.length===2)return [...commands,['L',points[1].x,points[1].y]];
 for(let i=1;i<points.length-1;i++){
  const point=points[i],next=points[i+1];
  commands.push(['Q',point.x,point.y,(point.x+next.x)/2,(point.y+next.y)/2]);
 }
 const last=points.at(-1);commands.push(['L',last.x,last.y]);return commands;
}
const pointsOf=stroke=>Array.isArray(stroke?.points)?stroke.points.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)):[];
export function strokeMarkup(stroke){
 const points=pointsOf(stroke);if(!points.length)return '';
 const style=brushStyle(stroke),{color,width,opacity}=style;
 if(points.length===1){const p=points[0];return style.cap==='square'?`<rect x="${p.x-width/2}" y="${p.y-width/2}" width="${width}" height="${width}" fill="${color}" opacity="${opacity}"/>`:`<circle cx="${p.x}" cy="${p.y}" r="${width/2}" fill="${color}" opacity="${opacity}"/>`;}
 const path=pathCommands(points).map(command=>command.join(' ')).join(' ');
 return `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="${style.cap}" stroke-linejoin="round" opacity="${opacity}"${style.dash.length?` stroke-dasharray="${style.dash.join(' ')}"`:''}/>`;
}
export function drawStudioStroke(ctx,stroke){
 const points=pointsOf(stroke);if(!points.length)return;
 const style=brushStyle(stroke);ctx.save();ctx.globalAlpha=style.opacity;ctx.strokeStyle=style.color;ctx.fillStyle=style.color;ctx.lineWidth=style.width;ctx.lineCap=style.cap;ctx.lineJoin='round';ctx.setLineDash(style.dash);ctx.beginPath();
 if(points.length===1){const p=points[0];if(style.cap==='square')ctx.rect(p.x-style.width/2,p.y-style.width/2,style.width,style.width);else ctx.arc(p.x,p.y,style.width/2,0,Math.PI*2);ctx.fill();}
 else {for(const [type,...args] of pathCommands(points)){if(type==='M')ctx.moveTo(...args);else if(type==='Q')ctx.quadraticCurveTo(...args);else ctx.lineTo(...args);}ctx.stroke();}
 ctx.restore();
}
// Hue is degrees; saturation and value are percentages (0–100).
export function hsvToHex(h,s,v){
 h=Number.isFinite(h)?((h%360)+360)%360:0;s=bound(s,0,100)/100;v=bound(v,0,100)/100;
 const chroma=v*s,second=chroma*(1-Math.abs(h/60%2-1)),base=v-chroma;
 const rgb=h<60?[chroma,second,0]:h<120?[second,chroma,0]:h<180?[0,chroma,second]:h<240?[0,second,chroma]:h<300?[second,0,chroma]:[chroma,0,second];
 return '#'+rgb.map(channel=>Math.round((channel+base)*255).toString(16).padStart(2,'0')).join('');
}
export function hexToHsv(hex){
 if(typeof hex!=='string'||!/^#[0-9a-f]{6}$/i.test(hex))hex='#294b3e';
 const [r,g,b]=[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
 let h=0;if(delta)h=max===r?60*((g-b)/delta%6):max===g?60*((b-r)/delta+2):60*((r-g)/delta+4);
 return {h:(h+360)%360,s:max?delta/max*100:0,v:max*100};
}
