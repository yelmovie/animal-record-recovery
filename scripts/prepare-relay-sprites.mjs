// Authoring only: turns the generated motion sheets (image/relay-sprites-20261118/<id>-sheet.png, kept on the SSD,
// not in Git) into the four-frame strips the 3D paths load from assets/relay/sprite-<id>.webp.
// Each sheet is a 2×2 grid of one movement, drawn at one scale. A frame keeps that scale and is pinned to the part of
// the animal that should stay still while it moves (the head of a hopper, the waterline of a duck, the centre of a crab).
// Pass the installed sharp package path as argv[2]. Prints the numbers relay3d.js / link-run3d.js need.
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const sharp=createRequire(import.meta.url)(process.argv[2]||'sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),from=path.join(root,'image/relay-sprites-20261118'),to=path.join(root,'assets/relay');
// x/y: which edge of each frame lines up from frame to frame.
const SHEETS={rabbit:{x:'right',y:'bottom'},frog:{x:'right',y:'bottom'},duck:{x:'right',y:'top'},marine:{x:'right',y:'middle'},crab:{x:'middle',y:'bottom'},butterfly:{x:'middle',y:'middle'}};
const HEIGHT=360,webp={quality:84,alphaQuality:90,effort:5};
for(const [id,pin] of Object.entries(SHEETS)){
 const {data,info}=await sharp(path.join(from,id+'-sheet.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const W=info.width,H=info.height,cw=Math.floor(W/2),ch=Math.floor(H/2);
 // Keep only clearly painted pixels, then peel one pixel off the rim (the generator leaves a coloured fringe there).
 const a=new Uint8Array(W*H);for(let i=0;i<W*H;i++)a[i]=data[i*4+3]>=128?1:0;
 for(let i=0;i<W*H;i++){const x=i%W,y=(i/W)|0;const keep=a[i]&&x>0&&y>0&&x<W-1&&y<H-1&&a[i-1]&&a[i+1]&&a[i-W]&&a[i+W];data[i*4+3]=keep?data[i*4+3]:0;}
 // Bounding box of each cell; a row or column needs a few painted pixels, so a stray speck does not count.
 const boxes=[0,1,2,3].map(n=>{const ox=(n%2)*cw,oy=(n>>1)*ch,cols=new Array(cw).fill(0),rows=new Array(ch).fill(0);
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(data[((oy+y)*W+ox+x)*4+3]){cols[x]++;rows[y]++;}
  const first=v=>v.findIndex(c=>c>2),last=v=>v.length-1-[...v].reverse().findIndex(c=>c>2);
  return {x0:ox+first(cols),x1:ox+last(cols),y0:oy+first(rows),y1:oy+last(rows)};});
 const fw=Math.max(...boxes.map(b=>b.x1-b.x0+1)),fh=Math.max(...boxes.map(b=>b.y1-b.y0+1)),pad=Math.round(fh*.03),cellW=fw+pad*2,cellH=fh+pad*2;
 const raw=await sharp(data,{raw:{width:W,height:H,channels:4}}).png().toBuffer();
 const parts=await Promise.all(boxes.map(async(b,n)=>{const w=b.x1-b.x0+1,h=b.y1-b.y0+1;
  const left=n*cellW+pad+(pin.x==='right'?fw-w:pin.x==='middle'?Math.round((fw-w)/2):0),top=pad+(pin.y==='bottom'?fh-h:pin.y==='middle'?Math.round((fh-h)/2):0);
  return {input:await sharp(raw).extract({left:b.x0,top:b.y0,width:w,height:h}).toBuffer(),left,top};}));
 const scale=HEIGHT/cellH,outW=Math.round(cellW*4*scale);
 const strip=await sharp({create:{width:cellW*4,height:cellH,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts).png().toBuffer();
 await sharp(strip).resize(outW,HEIGHT).webp(webp).toFile(path.join(to,`sprite-${id}.webp`));
 // aspect: one frame's width over its height. body: the first frame's painted height as a share of the frame height.
 const b0=boxes[0];
 console.log(id,JSON.stringify({aspect:+(cellW/cellH).toFixed(3),body:+((b0.y1-b0.y0+1)/cellH).toFixed(3),foot:+(pad/cellH).toFixed(3)}));
}
