import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from 'node:timers/promises';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(path.join(root,".local"),{recursive:true});
const envPath=path.join(root,".env.local");
const isLocalDatabase=(value)=>Boolean(value&&['localhost','127.0.0.1','::1'].includes(new URL(value).hostname));
if(!existsSync(envPath)) {
 const password=randomBytes(24).toString("hex"), admin=randomBytes(24).toString("base64url");
 const externalEnvironmentDatabase=process.env.DATABASE_URL&&!isLocalDatabase(process.env.DATABASE_URL);
 const databaseConfig=externalEnvironmentDatabase?"":`DATABASE_URL=postgresql://bravite:${password}@127.0.0.1:5432/bravite\n`;
 const migrationConfig=databaseConfig?`DATABASE_MIGRATION_URL=postgresql://bravite:${password}@127.0.0.1:5432/bravite\nBRAVITE_DB_PASSWORD=${password}\n`:"";
 writeFileSync(envPath,`${databaseConfig}${migrationConfig}DATABASE_RUNTIME_PASSWORD=${randomBytes(32).toString("hex")}\nCRON_SECRET=${randomBytes(32).toString("hex")}\nADMIN_EMAIL=bravitetech@gmail.com\nADMIN_PASSWORD=${admin}\nADMIN_PANEL_PATH=${randomBytes(32).toString("hex")}\nLOGIN_RATE_LIMIT_SECRET=${randomBytes(32).toString("hex")}\nAPI_PORT=4000\nAPI_HOST=127.0.0.1\nAPI_URL=http://127.0.0.1:4000\nAPP_ORIGIN=http://localhost:3000\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\nLEAD_NOTIFICATION_EMAIL=bravitetech@gmail.com\n`,{mode:0o600});
 console.log("Configuração local e credenciais exclusivas salvas em .env.local (não versionado).");
}
{
 let env=readFileSync(envPath,"utf8");
 let changed=false;
 for(const [name,bytes,valid] of [["ADMIN_PANEL_PATH",32,/^[a-f0-9]{64}$/], ["LOGIN_RATE_LIMIT_SECRET",32,/^[a-f0-9]{64}$/], ["DATABASE_RUNTIME_PASSWORD",32,/^[a-f0-9]{64,}$/], ["CRON_SECRET",32,/^[a-f0-9]{64,}$/]]) {
  const line=new RegExp(`^${name}=.*$`,`m`), current=env.match(line)?.[0].slice(name.length+1);
  if(current&&valid.test(current)) continue;
  const replacement=`${name}=${randomBytes(bytes).toString("hex")}`;
  env=line.test(env)?env.replace(line,replacement):`${env}${env.endsWith("\n")?"":"\n"}${replacement}\n`;
  changed=true;
 }
 const configuredUrl=process.env.DATABASE_URL||env.match(/^DATABASE_URL=(.+)$/m)?.[1];
 if(isLocalDatabase(configuredUrl)&&!/^DATABASE_MIGRATION_URL=/m.test(env)) {
  const directUrl=new URL(configuredUrl);
  directUrl.searchParams.delete('sslmode');
  env+=`${env.endsWith("\n")?"":"\n"}DATABASE_MIGRATION_URL=${directUrl.toString()}\n`;
  changed=true;
 }
 if(changed)writeFileSync(envPath,env,{mode:0o600});
}
const localUrl=process.env.DATABASE_URL||readFileSync(envPath,"utf8").match(/^DATABASE_URL=(.+)$/m)?.[1];
const externalDatabase=Boolean(localUrl&&!isLocalDatabase(localUrl));
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
