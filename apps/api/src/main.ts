import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Catch, ExceptionFilter, ArgumentsHost, HttpException, Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { map } from 'rxjs';
import type { Request,Response } from 'express';
import { Database } from './infrastructure/database';
import { AuthService, AdminGuard } from './application/auth';
import { ContentService } from './application/content';
import { LeadsService } from './application/leads';
import { PublicController, AuthController, AdminController, MediaController } from './presentation/controllers';

@Injectable() class Envelope implements NestInterceptor {
 intercept(ctx:ExecutionContext,next:CallHandler){const req=ctx.switchToHttp().getRequest<Request>();return next.handle().pipe(map(data=>({success:true,data,meta:{requestId:req.headers['x-request-id']}})));}
}
@Catch() class Errors implements ExceptionFilter {
 catch(error:unknown,host:ArgumentsHost){
  const ctx=host.switchToHttp(),req=ctx.getRequest<Request>(),res=ctx.getResponse<Response>();
  const pgCode=(error as {code?:string})?.code;
  const status=error instanceof HttpException?error.getStatus():pgCode==='23505'?409:500;
  const payload=error instanceof HttpException?error.getResponse():null;
  const info=typeof payload==='object'&&payload?payload as {message?:string|string[];details?:unknown}:null;
  const message=status===409?'Este endereço já está em uso. Escolha outro slug.':status===500?'Não foi possível concluir a solicitação.':info?.message||(typeof payload==='string'?payload:'Solicitação inválida.');
  if(status===500)console.error('API error:',error instanceof Error?error.name:'Unknown');
  res.status(status).json({success:false,error:{code:`HTTP_${status}`,message,details:info?.details},meta:{requestId:req.headers['x-request-id']}});
 }
}
@Module({imports:[ThrottlerModule.forRoot([{ttl:60000,limit:100}])],controllers:[PublicController,AuthController,AdminController,MediaController],providers:[Database,AuthService,AdminGuard,ContentService,LeadsService,{provide:APP_GUARD,useClass:ThrottlerGuard}]})
class ApplicationModule{}
async function bootstrap(){
 const app=await NestFactory.create(ApplicationModule);
 app.getHttpAdapter().getInstance().set('trust proxy',1);
 app.use(cookieParser());
 app.use((req:Request,res:Response,next:()=>void)=>{req.headers['x-request-id']=randomUUID();res.setHeader('X-Content-Type-Options','nosniff');next();});
 app.useGlobalInterceptors(new Envelope());app.useGlobalFilters(new Errors());
 const swagger=new DocumentBuilder().setTitle('Bravite API').setVersion('1.0').setDescription('API versionada para conteúdo, leads, administração e mídia. Respostas JSON usam success/data ou success/error e meta.requestId.').addCookieAuth('bravite_admin').build();
 SwaggerModule.setup('api/docs',app,SwaggerModule.createDocument(app,swagger),{jsonDocumentUrl:'api/docs-json',swaggerOptions:{persistAuthorization:false}});
 app.enableShutdownHooks();await app.listen(Number(process.env.API_PORT||4000),'127.0.0.1');
 console.log('Bravite API ready; OpenAPI: /api/docs');
}
bootstrap().catch(()=>{console.error('API could not start. Check database and environment configuration.');process.exit(1);});
