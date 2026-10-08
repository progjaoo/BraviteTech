import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Inject, UseGuards, Req, Res, ParseUUIDPipe, UseInterceptors, UploadedFile, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Database } from '../infrastructure/database';
import { ContentService } from '../application/content';
import { isMailConfigured, LeadsService } from '../application/leads';
import { MediaService } from '../application/media';
import { MediaStorage } from '../infrastructure/media-storage';
import { MAX_IMAGE_BYTES } from '../domain/media';
import { AuthService, AdminGuard, adminDatabaseContext, checkOrigin, sessionCookie } from '../application/auth';
import { IntentDto, LeadDto, PostDto, CaseDto, LoginDto, StatusDto, DtoPipe } from './dto';
import { clientAddress } from './http-security';

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
  checkOrigin(req);const token=await this.auth.login(dto.email,dto.password,clientAddress(req));
  res.cookie(sessionCookie,token,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/api',maxAge:8*60*60*1000});return {authenticated:true};
 }
 @Get('session') async session(@Req()req:Request){const user=await this.auth.session(req.cookies?.[sessionCookie]);return {authenticated:!!user,user};}
 @Post('logout') async logout(@Req()req:Request,@Res({passthrough:true})res:Response){checkOrigin(req);await this.auth.logout(req.cookies?.[sessionCookie]);res.clearCookie(sessionCookie,{path:'/api'});return {authenticated:false};}
}
@ApiTags('Administration') @ApiCookieAuth() @UseGuards(AdminGuard) @Controller('api/v1/admin')
export class AdminController {
 constructor(@Inject(Database)private db:Database,@Inject(ContentService)private content:ContentService,@Inject(MediaStorage)private mediaStorage:MediaStorage){}
 @Get('overview') async overview(@Req()req:Request){
  const {rows}=await this.db.queryWithContext(adminDatabaseContext(req),"SELECT (SELECT count(*)::int FROM leads WHERE status<>'intent') AS leads, (SELECT count(*)::int FROM leads WHERE status='intent') AS intents, (SELECT count(*)::int FROM posts WHERE status='published') AS posts, (SELECT count(*)::int FROM cases WHERE status='published') AS cases, (SELECT count(*)::int FROM notification_outbox WHERE status IN ('pending','processing')) AS pending_notifications");
  return {...rows[0],mail_configured:isMailConfigured(),media_provider:this.mediaStorage.provider};
 }
 @Get('leads') async leads(@Req()req:Request){return (await this.db.queryWithContext(adminDatabaseContext(req),"SELECT id,name,email,phone,company,service,message,status,created_at FROM leads WHERE status<>'intent' ORDER BY created_at DESC LIMIT 200")).rows;}
 @Patch('leads/:id') @ApiBody({type:StatusDto}) async status(@Param('id',ParseUUIDPipe)id:string,@Body(new DtoPipe(StatusDto))dto:StatusDto,@Req()req:Request){const {rows}=await this.db.queryWithContext(adminDatabaseContext(req),"UPDATE leads SET status=$1,updated_at=now() WHERE id=$2 AND status<>'intent' RETURNING id,status",[dto.status,id]);if(!rows[0])throw new NotFoundException();return rows[0];}
 @Delete('leads/:id') async deleteLead(@Param('id',ParseUUIDPipe)id:string,@Req()req:Request){await this.db.queryWithContext(adminDatabaseContext(req),'DELETE FROM leads WHERE id=$1',[id]);return {deleted:true};}
 @Get('posts') posts(@Req()req:Request){return this.content.list('posts',true,adminDatabaseContext(req));}
 @Post('posts') @ApiBody({type:PostDto}) post(@Body(new DtoPipe(PostDto))dto:PostDto,@Req()req:Request){return this.content.save('posts',dto,undefined,adminDatabaseContext(req));}
 @Put('posts/:id') @ApiBody({type:PostDto}) editPost(@Param('id',ParseUUIDPipe)id:string,@Body(new DtoPipe(PostDto))dto:PostDto,@Req()req:Request){return this.content.save('posts',dto,id,adminDatabaseContext(req));}
 @Delete('posts/:id') deletePost(@Param('id',ParseUUIDPipe)id:string,@Req()req:Request){return this.content.remove('posts',id,adminDatabaseContext(req));}
 @Get('cases') cases(@Req()req:Request){return this.content.list('cases',true,adminDatabaseContext(req));}
 @Post('cases') @ApiBody({type:CaseDto}) createCase(@Body(new DtoPipe(CaseDto))dto:CaseDto,@Req()req:Request){return this.content.save('cases',dto,undefined,adminDatabaseContext(req));}
 @Put('cases/:id') @ApiBody({type:CaseDto}) editCase(@Param('id',ParseUUIDPipe)id:string,@Body(new DtoPipe(CaseDto))dto:CaseDto,@Req()req:Request){return this.content.save('cases',dto,id,adminDatabaseContext(req));}
 @Delete('cases/:id') deleteCase(@Param('id',ParseUUIDPipe)id:string,@Req()req:Request){return this.content.remove('cases',id,adminDatabaseContext(req));}
}
@ApiTags('Media') @Controller('api/v1/media')
export class MediaController {
 constructor(@Inject(MediaService)private media:MediaService){}
 @Post('upload') @UseGuards(AdminGuard) @UseInterceptors(FileInterceptor('file',{limits:{fileSize:MAX_IMAGE_BYTES,files:1}}))
 async upload(@UploadedFile()file:Express.Multer.File,@Req()req:Request){
  if(!file)throw new BadRequestException('Selecione uma imagem.');
  return this.media.upload(file.buffer,adminDatabaseContext(req));
 }
 @Get('files/:name') async file(@Param('name')name:string,@Res()res:Response){
  if(!/^[a-f0-9-]{36}\.(png|jpg|webp|avif)$/.test(name))throw new NotFoundException();
  try{const bytes=await readFile(resolve(process.cwd(),'../../.local/uploads',name));res.setHeader('Cache-Control','public, max-age=31536000, immutable');res.setHeader('X-Content-Type-Options','nosniff');res.type(name.split('.').pop()!).send(bytes);}catch{throw new NotFoundException('Imagem não encontrada.');}
 }
}

@ApiTags('Internal') @Controller('api/v1/internal/notifications')
export class NotificationsController {
 constructor(@Inject(LeadsService)private leads:LeadsService){}
 @Get('flush') async flush(@Req()req:Request){
  const secret=process.env.CRON_SECRET;
  const authorization=req.headers.authorization||'';
  const expected=secret?`Bearer ${secret}`:'';
  const authorized=Boolean(secret&&authorization.length===expected.length&&timingSafeEqual(Buffer.from(authorization),Buffer.from(expected)));
  if(!authorized)throw new UnauthorizedException();
  return this.leads.flush();
 }
}
