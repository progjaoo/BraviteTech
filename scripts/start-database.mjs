import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from 'node:timers/promises';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(path.join(root,".local"),{recursive:true});
const envPath=path.join(root,".env.local");
const externalDatabase=process.env.DATABASE_URL && !['localhost','127.0.0.1','::1'].includes(new URL(process.env.DATABASE_URL).hostname);
if(!existsSync(envPath)) {
 const password=randomBytes(24).toString("hex"), admin=randomBytes(24).toString("base64url");
 const databaseConfig=externalDatabase?"":`DATABASE_URL=postgresql://bravite:${password}@127.0.0.1:5432/bravite\nBRAVITE_DB_PASSWORD=${password}\n`;
 writeFileSync(envPath,`${databaseConfig}ADMIN_EMAIL=bravitetech@gmail.com\nADMIN_PASSWORD=${admin}\nAPI_PORT=4000\nAPI_URL=http://127.0.0.1:4000\nAPP_ORIGIN=http://localhost:3000\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\nLEAD_NOTIFICATION_EMAIL=bravitetech@gmail.com\n`,{mode:0o600});
 console.log("Configuração local e credenciais exclusivas salvas em .env.local (não versionado).");
}
if(externalDatabase){console.log("DATABASE_URL usa o PostgreSQL gerenciado da plataforma; Docker local foi ignorado.");process.exit(0);}
const match=readFileSync(envPath,"utf8").match(/^BRAVITE_DB_PASSWORD=(.+)$/m);
if(!match) throw new Error("Configure BRAVITE_DB_PASSWORD em .env.local para o banco local.");
const dockerEnv=path.join(root,".local/postgres.env");
writeFileSync(dockerEnv,`POSTGRES_USER=bravite\nPOSTGRES_DB=bravite\nPOSTGRES_PASSWORD=${match[1].trim()}\n`,{mode:0o600});
const run=(args)=> { const r=spawnSync("docker",args,{stdio:"inherit"});if(r.status!==0)process.exit(r.status||1); };
const found=spawnSync("docker",["inspect","bravite-postgres"],{stdio:"ignore"}).status===0;
if(found) run(["start","bravite-postgres"]);
else run(["run","-d","--name","bravite-postgres","--env-file",dockerEnv,"-p","127.0.0.1:5432:5432","-v","bravite-postgres-data:/var/lib/postgresql/data","--health-cmd","pg_isready -U bravite -d bravite","--health-interval","2s","--health-timeout","3s","--health-retries","20","postgres:16-alpine"]);
let ready=false;
for(let attempt=0;attempt<30;attempt++){
 if(spawnSync('docker',['exec','bravite-postgres','pg_isready','-U','bravite','-d','bravite'],{stdio:'ignore'}).status===0){ready=true;break;}
 await setTimeout(1000);
}
if(!ready)throw new Error('PostgreSQL não ficou pronto; verifique o container bravite-postgres.');
console.log("PostgreSQL iniciado em 127.0.0.1:5432; dados persistidos no volume bravite-postgres-data.");
