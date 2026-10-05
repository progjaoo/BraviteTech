import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { gzipSync } from 'node:zlib';
import { formatWhatsApp, phoneCaretPosition } from '../apps/web/src/lib/whatsapp.ts';
import { services } from '../apps/web/src/lib/brand.ts';

const require=createRequire(import.meta.url);
const { Module }=require('@nestjs/common');
const { NestFactory,APP_GUARD }=require('@nestjs/core');
const { ThrottlerModule,ThrottlerGuard }=require('@nestjs/throttler');
const { PublicController }=require('../apps/api/dist/presentation/controllers');
const { configureHttp,formThrottlers }=require('../apps/api/dist/presentation/http-security');
const { Database }=require('../apps/api/dist/infrastructure/database');
const { ContentService }=require('../apps/api/dist/application/content');
const { LeadsService }=require('../apps/api/dist/application/leads');
const { LeadDto,DtoPipe }=require('../apps/api/dist/presentation/dto');
const { LEAD_SERVICES }=require('../apps/api/dist/domain/lead-validation');

// This suite uses an in-memory spy, never PostgreSQL, SMTP or Resend.
delete process.env.RESEND_API_KEY;
delete process.env.SMTP_HOST;
process.env.APP_ORIGIN='http://localhost:3000';
const origin=process.env.APP_ORIGIN;
const validLead={name:"João D'Ávila",email:'joao@example.com',phone:'(24) 99911-9722',company:'Empresa & Filhos',service:'Criação de sites',message:'Quero entender as possibilidades do meu projeto.',consent:true,website:''};

async function withApp(run) {
  const captured=[];
  class TestModule {}
  Module({
    imports:[ThrottlerModule.forRoot(formThrottlers)],controllers:[PublicController],
    providers:[
      {provide:Database,useValue:{query:async()=>({rows:[]})}},
      {provide:ContentService,useValue:{}},
      {provide:LeadsService,useValue:{submit:async value=>{captured.push(value);return {id:randomUUID(),status:'received'};},intent:async()=>({id:randomUUID(),token:'a'.repeat(43)})}},
      {provide:APP_GUARD,useClass:ThrottlerGuard},
    ],
  })(TestModule);
  const app=await NestFactory.create(TestModule,{bodyParser:false,logger:false});
  configureHttp(app);
  await app.listen(0,'127.0.0.1');
  const address=app.getHttpServer().address();
  async function send(body=validLead,{headers={},raw=false,path='leads',...options}={}) {
    const response=await fetch(`http://127.0.0.1:${address.port}/api/v1/${path}`,{
      method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},
      body:raw?body:JSON.stringify(body),...options,
    });
    const payload=await response.json();
    assert.equal(typeof payload.meta?.requestId,'string');
    assert.equal(payload.success,response.ok);
    return {response,payload};
  }
  try {await run({send,captured});} finally {await app.close();}
}

test('mask formats typing, national/foreign-prefix pastes, landlines and DDD 55',()=> {
  const cases=[['',''],['2','(2'],['24','(24) '],['249999','(24) 9999'],['24999119722','(24) 99911-9722'],['2433334444','(24) 3333-4444'],['+55 (24) 99911-9722','(24) 99911-9722'],['5524999119722','(24) 99911-9722'],['55999119722','(55) 99911-9722']];
  for(const [input,expected]of cases)assert.equal(formatWhatsApp(input),expected);
  assert.equal(phoneCaretPosition('(24) 99911-9722',2,false),5);
  assert.equal(phoneCaretPosition('(24) 99911-9722',2,true),3);
});

test('server service allowlist stays aligned with the real form options',()=> {
  assert.deepEqual(LEAD_SERVICES.slice(0,-1),services.map(service=>service.title));
});

test('valid requests normalize Unicode, whitespace and national/E.164 phones',async()=> {
  await withApp(async({send,captured})=> {
    for(const phone of ['(24) 99911-9722','24999119722','+55 (24) 99911-9722','5524999119722']) {
      assert.equal((await send({...validLead,name:"  Joa\u0303o D'Ávila  ",email:'  joao@example.com ',phone})).response.status,201);
    }
    assert.ok(captured.every(lead=>lead.name==="João D'Ávila"&&lead.phone==='+5524999119722'&&lead.email==='joao@example.com'));
    assert.equal((await send({...validLead,phone:'(24) 3333-4444'})).response.status,201);
    assert.equal(captured.at(-1).phone,'+552433334444');
  });
});

test('descriptions remain plain text, preserving legitimate punctuation',async()=> {
  await withApp(async({send,captured})=> {
    const message="O'Brien precisa de um SELECT de dados.\r\n<script>alert('x')</script>";
    const {response,payload}=await send({...validLead,message});
    assert.equal(response.status,201);
    assert.equal(captured[0].message,message.replace(/\r\n/g,'\n'));
    assert.ok(!JSON.stringify(payload).includes('<script>'));
  });
});

const invalidFields=[
  ['name after trimming',{name:'     '}],['blank message',{message:' '.repeat(15)}],
  ['name control',{name:'João\u0000'}],['company newline',{company:'Empresa\nBcc: attacker@example.com'}],
  ['email header injection',{email:'joao@example.com\r\nBcc: attacker@example.com'}],
  ['invalid DDD',{phone:'(20) 99911-9722'}],['phone SQL fragment',{phone:"24999119722;DROP TABLE leads"}],
  ['missing national DDD after explicit +55',{phone:'+55 999119722'}],['foreign phone',{phone:'+1 2025550123'}],
  ['phone newline',{phone:'+5524999119722\n'}],['short phone',{phone:'249999'}],['invalid prefix',{phone:'(24) 00000-0000'}],
  ['nested field',{name:{$ne:null}}],['non-string phone',{phone:24999119722}],
  ['unknown service',{service:'<img src=x onerror=alert(1)>'}],['missing consent',{consent:false}],['string consent',{consent:'true'}],
  ['filled honeypot',{website:'https://spam.example'}],['null honeypot',{website:null}],
  ['unexpected field',{isAdmin:true}],['oversized field',{message:'x'.repeat(3001)}],['description NUL',{message:'Descrição com \u0000 oculto'}],
  ['incomplete intent pair',{intentId:randomUUID()}],['invalid token',{intentId:randomUUID(),intentToken:'x'.repeat(44)}],
  ['token newline',{intentId:randomUUID(),intentToken:'x'.repeat(43)+'\n'}],
];
test('rejects invalid fields before reaching the lead service',async t=> {
  for(const [name,changes]of invalidFields)await t.test(name,async()=>withApp(async({send,captured})=> {
    const {response,payload}=await send({...validLead,...changes});
    assert.equal(response.status,400);
    assert.equal(captured.length,0);
    assert.ok(!JSON.stringify(payload).includes('attacker@example.com'));
    assert.ok(!JSON.stringify(payload).includes('target'));
  }));
});

test('rejects JSON arrays, null, primitives, malformed data and pollution keys',async t=> {
  const cases=[[],null,'secret-invalid-data',42,'{"name":"SECRET-PARSER-MARKER",invalid}',JSON.parse('{"__proto__":{"polluted":true}}'),{constructor:{prototype:{polluted:true}}}];
  for(const [index,value]of cases.entries())await t.test(`case ${index}`,async()=>withApp(async({send,captured})=> {
    const {response,payload}=await send(value,{raw:index===4});
    assert.equal(response.status,400);
    assert.equal(captured.length,0);
    assert.ok(!JSON.stringify(payload).includes('SECRET-PARSER-MARKER'));
    assert.equal({}.polluted,undefined);
  }));
});

test('requires an exact allowed Origin and rejects cross-site Fetch Metadata',async t=> {
  for(const headers of [{Origin:''},{Origin:'null'},{Origin:'https://attacker.example'},{Origin:`${origin}.attacker.example`},{'Sec-Fetch-Site':'cross-site'}]) {
    await t.test(JSON.stringify(headers),async()=>withApp(async({send,captured})=> {
      assert.equal((await send(validLead,{headers})).response.status,403);
      assert.equal(captured.length,0);
    }));
  }
});

test('rejects simple-request content types and compressed bodies',async t=> {
  for(const contentType of ['text/plain','application/x-www-form-urlencoded','multipart/form-data'])await t.test(contentType,async()=>withApp(async({send,captured})=> {
    assert.equal((await send(validLead,{headers:{'Content-Type':contentType}})).response.status,415);
    assert.equal(captured.length,0);
  }));
  await withApp(async({send})=> {
    assert.equal((await send(gzipSync(JSON.stringify(validLead)),{raw:true,headers:{'Content-Encoding':'gzip'}})).response.status,415);
  });
});

test('bounds request size even with a chunked body and no Content-Length',async()=> {
  await withApp(async({send,captured})=> {
    const data=JSON.stringify({...validLead,message:'x'.repeat(20000)});
    assert.equal((await send(data,{raw:true})).response.status,413);
    const body=Readable.from([data.slice(0,10000),data.slice(10000)]);
    assert.equal((await send(body,{raw:true,duplex:'half'})).response.status,413);
    assert.equal(captured.length,0);
  });
});

test('per-address rate limit returns 429 and Retry-After on the sixth submission',async()=> {
  await withApp(async({send,captured})=> {
    for(let i=0;i<5;i++)assert.equal((await send()).response.status,201);
    const {response}=await send();
    assert.equal(response.status,429);
    assert.ok(Number(response.headers.get('Retry-After'))>0);
    assert.equal(captured.length,5);
  });
});

test('aggregate budget cannot be bypassed by rotating forwarded addresses',async()=> {
  await withApp(async({send,captured})=> {
    for(let i=1;i<=30;i++)assert.equal((await send(validLead,{headers:{'X-Forwarded-For':`192.0.2.${i}`}})).response.status,201);
    assert.equal((await send(validLead,{headers:{'X-Forwarded-For':'192.0.2.31'},path:'LEADS/'})).response.status,429);
    assert.equal(captured.length,30);
  });
});

test('application keeps SQL attack strings bound as values in a committed transaction',async()=> {
  const calls=[];
  const client={query:async(sql,values)=>{calls.push({sql,values});return {rows:[]};},release:()=>{}};
  const service=new LeadsService({pool:{connect:async()=>client}});
  const name="O'Brien'); DROP TABLE leads; --";
  const message='Uma descrição com SQL: SELECT * FROM admin_users;';
  const dto=await new DtoPipe(LeadDto).transform({...validLead,name,message});
  await service.submit(dto);
  const insert=calls.find(call=>call.sql.startsWith('INSERT INTO leads'));
  assert.equal(insert.values[1],name);
  assert.equal(insert.values[6],message);
  assert.ok(insert.sql.includes('$1'));
  assert.ok(!calls.some(call=>call.sql.includes(name)||call.sql.includes(message)));
  assert.equal(calls.at(-1).sql,'COMMIT');
});

test('expired/reused intent is rolled back without inserting a lead or notification',async()=> {
  const calls=[];
  const client={query:async(sql)=>{calls.push(sql);return {rows:[]};},release:()=>{}};
  const service=new LeadsService({pool:{connect:async()=>client}});
  const dto=await new DtoPipe(LeadDto).transform({...validLead,intentId:randomUUID(),intentToken:'x'.repeat(43)});
  await assert.rejects(service.submit(dto),error=>error.getStatus()===400);
  assert.ok(calls.some(sql=>sql.includes("interval '30 minutes'")));
  assert.ok(!calls.some(sql=>sql.startsWith('INSERT INTO')));
  assert.equal(calls.at(-1),'ROLLBACK');
});
