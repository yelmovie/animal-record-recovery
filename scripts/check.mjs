import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const folder of ['src','scripts'])for(const name of await readdir(folder)){
  if(!/\.(m?js)$/.test(name))continue;
  const file=`${folder}/${name}`,result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0){process.stderr.write(result.stderr);process.exit(result.status||1);}
}
console.log('JavaScript syntax checks passed.');
