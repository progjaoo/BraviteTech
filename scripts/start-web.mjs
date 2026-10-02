import { cp,access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const web=path.join(root,'apps/web');
const output=path.join(web,'.next/standalone/apps/web');
try{await access(path.join(output,'server.js'));}catch{throw new Error('Execute npm run build antes de npm start.');}
await cp(path.join(web,'public'),path.join(output,'public'),{recursive:true,force:true});
await cp(path.join(web,'.next/static'),path.join(output,'.next/static'),{recursive:true,force:true});
const child=spawn(process.execPath,[path.join(output,'server.js')],{cwd:output,stdio:'inherit',env:{...process.env,HOSTNAME:'0.0.0.0',PORT:process.env.PORT||'3000'}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code||0));
