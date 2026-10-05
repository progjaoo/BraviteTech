import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Inject, UseGuards, Req, Res, ParseUUIDPipe, UseInterceptors, UploadedFile, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Database } from '../infrastructure/database';
import { ContentService } from '../application/content';
import { isMailConfigured, LeadsService } from '../application/leads';
import { AuthService, AdminGuard, checkOrigin, sessionCookie } from '../application/auth';
import { IntentDto, LeadDto, PostDto, CaseDto, LoginDto, StatusDto, DtoPipe } from './dto';

@ApiTags('Public') @Controller('api/v1')
export class PublicController {
 constructor(@Inject(Database)private db:Database,@Inject(ContentService)private content:ContentService,@Inject(LeadsService)private leads:LeadsService){}
 @Get('health') async health(){await this.db.query('SELECT 1');return {status:'ok',database:'ready'};}
 @Get('posts') posts(){return this.content.list('posts');}
 @Get('posts/:slug') post(@Param('slug')slug:string){return this.content.one('posts',slug);}
 @Get('cases') cases(){return this.content.list('cases');}
 @Get('cases/:slug') case(@Param('slug')slug:string){return this.content.one('cases',slug);}
 @Post('leads/intent') @Throttle({default:{limit:15,ttl:60000}}) @ApiBody({type:IntentDto})
 @ApiOperation({summary:'Register an anonymous CTA intent without identifying the visitor'})
 intent(@Body(new DtoPipe(IntentDto))dto:IntentDto,@Req()req:Request){checkOrigin(req);return this.leads.intent(dto.source);}
 @Post('leads') @Throttle({default:{limit:5,ttl:60000},formBudget:{limit:30,ttl:60000}}) @ApiBody({type:LeadDto})
 @ApiOperation({summary:'Save a consented analysis request and enqueue an owner notification'})
 lead(@Body(new DtoPipe(LeadDto))dto:LeadDto,@Req()req:Request){checkOrigin(req);return this.leads.submit(dto);}
}
@ApiTags('Authentication') @Controller('api/v1/admin')
export class AuthController {
 constructor(@Inject(AuthService)private auth:AuthService){}
 @Post('login') @Throttle({default:{limit:5,ttl:60000}}) @ApiBody({type:LoginDto})
 async login(@Body(new DtoPipe(LoginDto))dto:LoginDto,@Req()req:Request,@Res({passthrough:true})res:Response){
  checkOrigin(req);const token=await this.auth.login(dto.email,dto.password);
  res.cookie(sessionCookie,token,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/api',maxAge:8*60*60*1000});return {authenticated:true};
 }
 @Get('session') async session(@Req()req:Request){const user=await this.auth.session(req.cookies?.[sessionCookie]);return {authenticated:!!user,user};}
 @Post('logout') async logout(@Req()req:Request,@Res({passthrough:true})res:Response){checkOrigin(req);await this.auth.logout(req.cookies?.[sessionCookie]);res.clearCookie(sessionCookie,{path:'/api'});return {authenticated:false};}
}
@ApiTags('Administration') @ApiCookieAuth() @UseGuards(AdminGuard) @Controller('api/v1/admin')
export class AdminController {
 constructor(@Inject(Database)private db:Database,@Inject(ContentService)private content:ContentService){}
 @Get('overview') async overview(){
  const {rows}=await this.db.query("SELECT (SELECT count(*)::int FROM leads WHERE status<>'intent') AS leads, (SELECT count(*)::int FROM leads WHERE status='intent') AS intents, (SELECT count(*)::int FROM posts WHERE status='published') AS posts, (SELECT count(*)::int FROM cases WHERE status='published') AS cases, (SELECT count(*)::int FROM notification_outbox WHERE status='pending') AS pending_notifications");
  return {...rows[0],mail_configured:isMailConfigured(),media_provider:process.env.CLOUDFLARE_IMAGES_TOKEN?'cloudflare':'local'};
 }
 @Get('leads') async leads(){return (await this.db.query("SELECT id,name,email,phone,company,service,message,status,created_at FROM leads WHERE status<>'intent' ORDER BY created_at DESC LIMIT 200")).rows;}
 @Patch('leads/:id') @ApiBody({type:StatusDto}) async status(@Param('id',ParseUUIDPipe)id:string,@Body(new DtoPipe(StatusDto))dto:StatusDto){const {rows}=await this.db.query("UPDATE leads SET status=$1,updated_at=now() WHERE id=$2 AND status<>'intent' RETURNING id,status",[dto.status,id]);if(!rows[0])throw new NotFoundException();return rows[0];}
 @Delete('leads/:id') async deleteLead(@Param('id',ParseUUIDPipe)id:string){await this.db.query('DELETE FROM leads WHERE id=$1',[id]);return {deleted:true};}
 @Get('posts') posts(){return this.content.list('posts',true);}
 @Post('posts') @ApiBody({type:PostDto}) post(@Body(new DtoPipe(PostDto))dto:PostDto){return this.content.save('posts',dto);}
 @Put('posts/:id') @ApiBody({type:PostDto}) editPost(@Param('id',ParseUUIDPipe)id:string,@Body(new DtoPipe(PostDto))dto:PostDto){return this.content.save('posts',dto,id);}
 @Delete('posts/:id') deletePost(@Param('id',ParseUUIDPipe)id:string){return this.content.remove('posts',id);}
 @Get('cases') cases(){return this.content.list('cases',true);}
 @Post('cases') @ApiBody({type:CaseDto}) createCase(@Body(new DtoPipe(CaseDto))dto:CaseDto){return this.content.save('cases',dto);}
 @Put('cases/:id') @ApiBody({type:CaseDto}) editCase(@Param('id',ParseUUIDPipe)id:string,@Body(new DtoPipe(CaseDto))dto:CaseDto){return this.content.save('cases',dto,id);}
 @Delete('cases/:id') deleteCase(@Param('id',ParseUUIDPipe)id:string){return this.content.remove('cases',id);}
}
@ApiTags('Media') @Controller('api/v1/media')
export class MediaController {
 constructor(@Inject(Database)private db:Database){}
 @Post('upload') @UseGuards(AdminGuard) @UseInterceptors(FileInterceptor('file',{limits:{fileSize:8*1024*1024,files:1}}))
 async upload(@UploadedFile()file:Express.Multer.File){
  if(!file)throw new BadRequestException('Selecione uma imagem.');
  const b=file.buffer;
  let type:string|undefined;
  if(b.length>8&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))type='png';
  else if(b.length>3&&b[0]===255&&b[1]===216&&b[2]===255)type='jpg';
  else if(b.length>12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')type='webp';
  else if(b.length>12&&b.toString('ascii',4,8)==='ftyp'&&['avif','avis'].includes(b.toString('ascii',8,12)))type='avif';
  if(!type)throw new BadRequestException('Envie uma imagem PNG, JPEG, WebP ou AVIF válida.');
  const id=randomUUID();let url:string,provider='local';
  if(process.env.CLOUDFLARE_ACCOUNT_ID&&process.env.CLOUDFLARE_IMAGES_TOKEN){
   const data=new FormData();data.append('file',new Blob([new Uint8Array(b)],{type:type==='jpg'?'image/jpeg':`image/${type}`}),`${id}.${type}`);
   const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,{method:'POST',headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_IMAGES_TOKEN}`},body:data,signal:AbortSignal.timeout(30000)});
   const result=await response.json() as {success:boolean;result?:{variants?:string[]}};
   const variant=result.result?.variants?.find(v=>v.startsWith('https://imagedelivery.net/'));
   if(!response.ok||!result.success||!variant)throw new BadRequestException('Não foi possível enviar a imagem para a CDN.');
   url=variant;provider='cloudflare';
  }else{
   const directory=resolve(process.cwd(),'../../.local/uploads');await mkdir(directory,{recursive:true});await writeFile(resolve(directory,`${id}.${type}`),b);url=`/api/v1/media/files/${id}.${type}`;
  }
  await this.db.query('INSERT INTO media(id,url,provider) VALUES($1,$2,$3)',[id,url,provider]);return {id,url,provider};
 }
 @Get('files/:name') async file(@Param('name')name:string,@Res()res:Response){
  if(!/^[a-f0-9-]{36}\.(png|jpg|webp|avif)$/.test(name))throw new NotFoundException();
  try{const bytes=await readFile(resolve(process.cwd(),'../../.local/uploads',name));res.setHeader('Cache-Control','public, max-age=31536000, immutable');res.setHeader('X-Content-Type-Options','nosniff');res.type(name.split('.').pop()!).send(bytes);}catch{throw new NotFoundException('Imagem não encontrada.');}
 }
}
