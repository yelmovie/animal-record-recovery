// Authoring-only optimization. Pass the installed sharp package path as argv[2].
// Originals remain untouched for later image-to-3D work.
import {createRequire} from 'node:module';
import {readdir,stat} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const sharp=require(process.argv[2] || 'sharp');
for(const folder of ['assets','assets/generated']) {
  for(const name of await readdir(folder)) {
    if(!name.endsWith('.png')) continue;
    const input=path.join(folder,name), output=input.replace(/\.png$/,'.webp');
    const meta=await sharp(input).metadata();
    await sharp(input).webp({quality:90,alphaQuality:100,effort:5}).toFile(output);
    console.log(`${output} ${meta.width}x${meta.height} alpha=${!!meta.hasAlpha} ${Math.round((await stat(output)).size/1024)} KB`);
  }
}
