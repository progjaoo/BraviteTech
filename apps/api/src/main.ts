import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Database } from './infrastructure/database';
import { AuthService, AdminGuard } from './application/auth';
import { ContentService } from './application/content';
import { LeadsService } from './application/leads';
import { MediaService } from './application/media';
import { MediaStorage } from './infrastructure/media-storage';
import { PublicController, AuthController, AdminController, MediaController, NotificationsController } from './presentation/controllers';
import { configureHttp, formThrottlers } from './presentation/http-security';
import type { Request, Response } from 'express';

@Module({imports:[ThrottlerModule.forRoot(formThrottlers)],controllers:[PublicController,AuthController,AdminController,MediaController,NotificationsController],providers:[Database,AuthService,AdminGuard,ContentService,LeadsService,MediaService,MediaStorage,{provide:APP_GUARD,useClass:ThrottlerGuard}]})
class ApplicationModule{}
export async function createApplication(){
 const app=await NestFactory.create(ApplicationModule,{bodyParser:false});
 configureHttp(app);
 if(process.env.NODE_ENV!=='production') {
  const swagger=new DocumentBuilder().setTitle('Bravite API').setVersion('1.0').setDescription('API versionada para conteúdo, leads, administração e mídia. Respostas JSON usam success/data ou success/error e meta.requestId.').addCookieAuth('bravite_admin').build();
  SwaggerModule.setup('api/docs',app,SwaggerModule.createDocument(app,swagger),{jsonDocumentUrl:'api/docs-json',swaggerOptions:{persistAuthorization:false}});
 }
 app.enableShutdownHooks();
 await app.init();
 return app;
}
let serverlessApplication: ReturnType<typeof createApplication> | undefined;
export default async function vercelHandler(request:Request,response:Response){
 try{
  serverlessApplication??=createApplication();
  const app=await serverlessApplication;
  return app.getHttpAdapter().getInstance()(request,response);
 }catch{
  serverlessApplication=undefined;
  console.error('API could not initialize. Check database and environment configuration.');
  if(!response.headersSent)return response.status(503).json({success:false,error:{code:'SERVICE_UNAVAILABLE',message:'Serviço temporariamente indisponível.'}});
  return response.end();
 }
}
async function bootstrap(){
 const app=await createApplication();
 const port=Number(process.env.PORT||process.env.API_PORT||4000);
 if(process.env.VERCEL)await app.listen(port);
 else await app.listen(port,process.env.API_HOST||'127.0.0.1');
 console.log(process.env.NODE_ENV==='production'?'Bravite API ready.':'Bravite API ready; OpenAPI: /api/docs');
}
if(require.main===module)bootstrap().catch(()=>{console.error('API could not start. Check database and environment configuration.');process.exit(1);});
