// Authoring only: turns the generated relay-stage originals (image/relay-20261117/*.png, kept on the SSD, not in Git)
// into the WebP files the stage loads from assets/relay/. Pass the installed sharp package path as argv[2].
// Sheets of several props are split at their transparent gaps, so each prop becomes its own trimmed picture.
import {createRequire} from 'node:module';
import {mkdir,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const sharp=createRequire(import.meta.url)(process.argv[2]||'sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),from=path.join(root,'image/relay-20261117'),to=path.join(root,'assets/relay');
await mkdir(to,{recursive:true});
const has=async f=>access(f).then(()=>true,()=>false),out=name=>path.join(to,name+'.webp');
const webp={quality:82,alphaQuality:90,effort:5};
// Backdrops: the scene shows a wide strip from the sky down to the near meadow, so keep the top 36% of the width as height
// (the plain bottom of the picture would sit behind the playfield anyway).
for(const name of ['backdrop-forest','backdrop-pond','backdrop-coast']){const f=path.join(from,name+'.png');if(!await has(f))continue;
  const {width}=await sharp(f).metadata(),band=Math.round(width*.36);
  await sharp(f).extract({left:0,top:0,width,height:band}).resize(1536,553).webp(webp).toFile(out(name));console.log(name);}
// The sand and mud came out more orange than the rest of the app; calm them so the animals stay the brightest things on screen.
const tone={'tile-sand':{saturation:.5,brightness:1.1},'tile-mud':{saturation:.75,brightness:1.05}};
for(const name of ['tile-grass','tile-mud','tile-sand','tile-hedge']){const f=path.join(from,name+'.png');if(!await has(f))continue;let img=sharp(f).resize(512,512);if(tone[name])img=img.modulate(tone[name]);await img.webp(webp).toFile(out(name));console.log(name);}
// Columns that hold clearly opaque pixels form runs; the widest runs are the props, left to right.
// The generator leaves a pale glow around each prop: keep only fully painted pixels, then peel two pixels off the rim.
// keyWhite names props whose leaf gaps the glow filled with opaque white (trees have nothing white of their own).
async function split(file,names,height=512,keyWhite=[]){
  if(!await has(file))return;
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true}),runs=[],at=(x,y)=>(y*info.width+x)*4+3;let start=-1;
  if(!data.some((v,i)=>i%4===3&&v<16))throw new Error(file+' has no transparent background');
  for(let i=3;i<data.length;i+=4)data[i]=data[i]>=236?255:0;
  for(let x=0;x<=info.width;x++){let any=false;if(x<info.width)for(let y=0;y<info.height;y++)if(data[at(x,y)]){any=true;break;}
    if(any&&start<0)start=x;if(!any&&start>=0){runs.push([start,x]);start=-1;}}
  const picked=runs.filter(([a,b])=>b-a>info.width*.04).sort((p,q)=>(q[1]-q[0])-(p[1]-p[0])).slice(0,names.length).sort((p,q)=>p[0]-q[0]);
  if(picked.length!==names.length)throw new Error(`${file}: found ${picked.length} props, wanted ${names.length}`);
  for(const [i,[a,b]] of picked.entries())if(keyWhite.includes(names[i]))for(let y=0;y<info.height;y++)for(let x=a;x<b;x++){const k=at(x,y);if(Math.min(data[k-3],data[k-2],data[k-1])>214)data[k]=0;}
  for(let pass=0;pass<2;pass++){const rim=[];for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[at(x,y)]&&(!x||!y||x===info.width-1||y===info.height-1||!data[at(x-1,y)]||!data[at(x+1,y)]||!data[at(x,y-1)]||!data[at(x,y+1)]))rim.push(at(x,y));for(const i of rim)data[i]=0;}
  const clean=()=>sharp(data,{raw:{width:info.width,height:info.height,channels:4}});
  for(const [i,[a,b]] of picked.entries()){let top=info.height,bottom=0;for(let y=0;y<info.height;y++)for(let x=a;x<b;x++)if(data[at(x,y)]){top=Math.min(top,y);bottom=Math.max(bottom,y);break;}
    await clean().extract({left:a,top,width:b-a,height:bottom-top+1}).resize({height,withoutEnlargement:true}).webp(webp).toFile(out(names[i]));console.log(names[i],b-a,bottom-top+1);}
}
await split(path.join(from,'props-trees.png'),['prop-pine','prop-oak','prop-bush'],512,['prop-pine','prop-oak']);
await split(path.join(from,'props-shore.png'),['prop-boulder','prop-searock','prop-kelp','prop-flowers'],384);
await split(path.join(from,'prop-arch.png'),['prop-arch'],640);
