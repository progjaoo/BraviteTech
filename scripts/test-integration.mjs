import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile,unlink } from 'node:fs/promises';
import pg from 'pg';

// These tests create isolated records and delete them. Never run against production.
const origin=process.env.APP_ORIGIN?.split(',')[0]||'http://localhost:3000';
const target=new URL(origin);
if(!['localhost','127.0.0.1'].includes(target.hostname))throw new Error('Integration tests require a local server.');
if(process.env.RESEND_API_KEY||process.env.SMTP_HOST||process.env.CLOUDFLARE_IMAGES_TOKEN)throw new Error('Use local storage and disable external delivery when testing.');
let cookie='';
async function api(path,{method='GET',body,authenticated=false,expected=200,requestOrigin=origin}={}){
 const response=await fetch(`${origin}/api/v1/${path}`,{method,headers:{'Content-Type':'application/json',Origin:requestOrigin,...(authenticated?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();
 assert.equal(response.status,expected,`${method} ${path}: ${response.status}`);
 assert.equal(data.success,expected<400);
 assert.equal(typeof data.meta?.requestId,'string');
 return {response,data:data.success?data.data:data.error};
}
test('lead consent, sessions, publishing, uploads and API contracts',async()=>{
 const cleanup=[];
 let uploadedMedia;
 const suffix=randomUUID().slice(0,8);
 try{
  await api('health');
  await api('admin/posts',{expected:401});
  await api('admin/login',{method:'POST',body:{email:process.env.ADMIN_EMAIL,password:'deliberately-incorrect'},expected:401});
  const login=await api('admin/login',{method:'POST',body:{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD},expected:201});
  const session=login.response.headers.getSetCookie()[0];
  assert.match(session,/HttpOnly/i);assert.match(session,/SameSite=Strict/i);
  cookie=session.split(';')[0];
  assert.equal((await api('admin/session',{authenticated:true})).data.authenticated,true);
  await api('admin/posts',{method:'POST',authenticated:true,body:{},requestOrigin:'https://untrusted.invalid',expected:403});
  const intent=(await api('leads/intent',{method:'POST',body:{source:'integration-test'},expected:201})).data;
  cleanup.push(['leads',intent.id]);
  const lead={name:'Verificação automatizada',email:`qa-${suffix}@example.invalid`,phone:'24999999999',company:'Teste local',service:'Criação de sites',message:'Pedido criado apenas para validar o fluxo local.',consent:true,intentId:intent.id,intentToken:intent.token,website:''};
  await api('leads',{method:'POST',body:{...lead,consent:false},expected:400});
  const submitted=(await api('leads',{method:'POST',body:lead,expected:201})).data;
  assert.equal(submitted.id,intent.id);
  const stored=(await api('admin/leads',{authenticated:true})).data.find(x=>x.id===submitted.id);
  assert.equal(stored.email,lead.email);assert.equal(stored.status,'new');
  await api(`admin/leads/${submitted.id}`,{method:'PATCH',authenticated:true,body:{status:'qualified'}});
  assert.equal((await api('admin/leads',{authenticated:true})).data.find(x=>x.id===submitted.id).status,'qualified');
  const post={title:'Verificação de publicação local',slug:`qa-post-${suffix}`,excerpt:'Conteúdo temporário para conferir rascunho, publicação e validação.',content:'# Verificação\n\nEste registro existe somente durante a execução do teste.',category:'Teste',cover_url:null,cover_alt:'',status:'draft'};
  const created=(await api('admin/posts',{method:'POST',authenticated:true,body:post,expected:201})).data;
  cleanup.push(['posts',created.id]);
  await api(`posts/${post.slug}`,{expected:404});
  await api('admin/posts',{method:'POST',authenticated:true,body:post,expected:409});
  await api(`admin/posts/${created.id}`,{method:'PUT',authenticated:true,body:{...post,status:'published'}});
  assert.equal((await api(`posts/${post.slug}`)).data.id,created.id);
  await api(`admin/posts/${created.id}`,{method:'PUT',authenticated:true,body:{...post,status:'published',cover_url:'https://untrusted.invalid/image.png',cover_alt:'Não permitido'},expected:400});
  const record={title:'Verificação de case local',slug:`qa-case-${suffix}`,client:'Teste local temporário',summary:'Este conteúdo é removido ao terminar a verificação.',content:'# Case temporário\n\nVerificação do fluxo de publicação do painel.',category:'Teste',cover_url:null,cover_alt:'',website_url:'https://example.com',status:'draft'};
  const createdCase=(await api('admin/cases',{method:'POST',authenticated:true,body:record,expected:201})).data;
  cleanup.push(['cases',createdCase.id]);
  await api(`cases/${record.slug}`,{expected:404});
  await api(`admin/cases/${createdCase.id}`,{method:'PUT',authenticated:true,body:{...record,status:'published'}});
  assert.equal((await api(`cases/${record.slug}`)).data.id,createdCase.id);
  await api(`admin/cases/${createdCase.id}`,{method:'PUT',authenticated:true,body:{...record,website_url:'javascript:alert(1)'},expected:400});
  const badImage=new FormData();badImage.set('file',new Blob(['<svg></svg>'],{type:'image/svg+xml'}),'unsafe.svg');
  const rejected=await fetch(`${origin}/api/v1/media/upload`,{method:'POST',headers:{Origin:origin,Cookie:cookie},body:badImage});
  assert.equal(rejected.status,400);
  const png=await readFile(new URL('../midia-kit/04-web/icones/favicon-32.png',import.meta.url));
  const image=new FormData();image.set('file',new Blob([png],{type:'image/png'}),'favicon.png');
  const uploaded=await fetch(`${origin}/api/v1/media/upload`,{method:'POST',headers:{Origin:origin,Cookie:cookie},body:image});
  assert.equal(uploaded.status,201);const media=(await uploaded.json()).data;uploadedMedia=media;
  const delivered=await fetch(new URL(media.url,origin));assert.equal(delivered.status,200);assert.match(delivered.headers.get('Content-Type'),/image\/png/);
  const spec=await(await fetch(`${origin}/api/docs-json`)).json();
  assert.ok(spec.paths['/api/v1/leads']);assert.ok(spec.components.schemas.LeadDto.properties.consent);
 }finally{
  if(uploadedMedia){const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});try{await pool.query('DELETE FROM media WHERE id=$1',[uploadedMedia.id]);await unlink(new URL(`../.local/uploads/${uploadedMedia.url.split('/').pop()}`,import.meta.url));}finally{await pool.end();}}
  for(const [kind,id]of cleanup.reverse())await api(`admin/${kind}/${id}`,{method:'DELETE',authenticated:true});
  if(cookie){await api('admin/logout',{method:'POST',authenticated:true,expected:201});await api('admin/posts',{authenticated:true,expected:401});}
 }
});
