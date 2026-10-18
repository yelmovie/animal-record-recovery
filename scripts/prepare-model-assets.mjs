// Error-bounded reduction preserving UV seams. Usage: node scripts/prepare-model-assets.mjs rabbit duck
// Dev-only dependencies: npm install --prefix node_modules/model-tools --no-save
// @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions meshoptimizer sharp
import {NodeIO} from '../node_modules/model-tools/node_modules/@gltf-transform/core/dist/index.js';
import {ALL_EXTENSIONS} from '../node_modules/model-tools/node_modules/@gltf-transform/extensions/dist/index.js';
import {simplify,textureCompress} from '../node_modules/model-tools/node_modules/@gltf-transform/functions/dist/index.js';
import {MeshoptSimplifier} from '../node_modules/model-tools/node_modules/meshoptimizer/index.js';
import {createRequire} from 'node:module';
const sharp=createRequire(new URL('../node_modules/model-tools/package.json',import.meta.url))('sharp');
import {stat,writeFile} from 'node:fs/promises';
const models={
 frog:['Meshy_AI_Emerald_Marsh_Frog_1018084948_texture.glb',100000],
 crab:['Meshy_AI_Copper_Crab_1018085005_texture.glb',120000],
 rabbit:['Meshy_AI_Curious_Brown_Rabbit_1018085258_texture.glb',150000],
 marine:['Meshy_AI_Silverfin_Glide_1018085024_texture.glb',60000],
 duck:['Meshy_AI_Mallard_Duck_1018091911_texture.glb',100000],
 camel:['Meshy_AI_Camel_1018091849_texture.glb',80000],
 penguin:['Meshy_AI_Regal_Emperor_Penguin_1018091859_texture.glb',90000],
 butterfly:['Meshy_AI_Swallowtail_Butterfly_1018094451_image-to-3d-texture.glb',120000],
};
const selected=process.argv.slice(2);if(!selected.length)throw new Error('Specify animal IDs: '+Object.keys(models).join(', '));
for(const animal of selected){
if(!models[animal])throw new Error('Unknown animal: '+animal);
const [filename,budget]=models[animal],source='assets/models/source/20261018/'+filename,output='assets/models/'+animal+'.glb';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),doc=await io.read(source);
const triangles=()=>doc.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((n,p)=>n+p.getIndices().getCount()/3,0),0);
const before=triangles();console.log('Loaded',before,'triangles');
await doc.transform(simplify({simplifier:MeshoptSimplifier,ratio:budget/before,error:.001}));
console.log('Simplified',triangles(),'triangles');
await doc.transform(textureCompress({encoder:sharp,targetFormat:'webp',resize:[2048,2048],quality:92}));
await io.write(output,doc);
const report={animal,source,sourceBytes:(await stat(source)).size,runtimeBytes:(await stat(output)).size,trianglesBefore:before,trianglesAfter:triangles(),textureLimit:2048,textureQuality:92,simplifier:'meshoptimizer',maxRelativeError:.001};
await writeFile('assets/models/source/20261018/'+animal+'-conversion.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
}
