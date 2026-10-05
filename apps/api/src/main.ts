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
import { PublicController, AuthController, AdminController, MediaController } from './presentation/controllers';
import { configureHttp, formThrottlers } from './presentation/http-security';

@Module({imports:[ThrottlerModule.forRoot(formThrottlers)],controllers:[PublicController,AuthController,AdminController,MediaController],providers:[Database,AuthService,AdminGuard,ContentService,LeadsService,{provide:APP_GUARD,useClass:ThrottlerGuard}]})
class ApplicationModule{}
async function bootstrap(){
 const app=await NestFactory.create(ApplicationModule,{bodyParser:false});
 configureHttp(app);
 const swagger=new DocumentBuilder().setTitle('Bravite API').setVersion('1.0').setDescription('API versionada para conteúdo, leads, administração e mídia. Respostas JSON usam success/data ou success/error e meta.requestId.').addCookieAuth('bravite_admin').build();
 SwaggerModule.setup('api/docs',app,SwaggerModule.createDocument(app,swagger),{jsonDocumentUrl:'api/docs-json',swaggerOptions:{persistAuthorization:false}});
 app.enableShutdownHooks();await app.listen(Number(process.env.API_PORT||4000),'127.0.0.1');
 console.log('Bravite API ready; OpenAPI: /api/docs');
}
bootstrap().catch(()=>{console.error('API could not start. Check database and environment configuration.');process.exit(1);});
