import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const esbuild=process.env.ENGINE_ESBUILD_PATH ? await import(pathToFileURL(process.env.ENGINE_ESBUILD_PATH).href) : await import('esbuild');
const directory=await mkdtemp(join(tmpdir(),'drevene-terasy-academy-'));
try {
  const output=join(directory,'tests.cjs');
  const entry=join(root,'scripts/test-academy.ts');
  const result=await esbuild.build({stdin:{contents:await readFile(entry,'utf8'),sourcefile:entry,resolveDir:dirname(entry),loader:'ts'},
    absWorkingDir:root,tsconfigRaw:{compilerOptions:{}},write:false,bundle:true,platform:'node',format:'cjs',target:'node22',logLevel:'warning',
    plugins:[{name:'engine-typescript-files',setup(build){
      build.onResolve({filter:/^\./},async args=>{
        const target=resolve(args.resolveDir,args.path);
        for(const candidate of [target,`${target}.ts`,join(target,'index.ts')]){
          try{if((await stat(candidate)).isFile())return {path:candidate,namespace:'engine-files'};}catch{}
        }
        return {errors:[{text:`Missing engine source: ${target}`}]};
      });
      build.onLoad({filter:/.*/,namespace:'engine-files'},async args=>({contents:await readFile(args.path,'utf8'),loader:args.path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}));
    }}]});
  await writeFile(output,result.outputFiles[0].contents);
  const child=spawnSync(process.execPath,[output],{stdio:'inherit'});
  process.exitCode=child.status ?? 1;
} finally {
  // Only the explicitly created temporary directory is removed.
  await rm(directory,{recursive:true,force:true});
}
