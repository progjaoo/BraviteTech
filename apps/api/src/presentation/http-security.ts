import { Catch, HttpException, Injectable, type ArgumentsHost, type CallHandler, type ExceptionFilter, type ExecutionContext, type INestApplication, type NestInterceptor } from '@nestjs/common';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { json, type Request, type RequestHandler, type Response } from 'express';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { map } from 'rxjs';
import { checkOrigin } from '../application/auth';

export const formThrottlers: ThrottlerModuleOptions = [
  {name:'default',ttl:60000,limit:100},
  {
    name:'formBudget',ttl:60000,limit:60,
    // An additional site-wide budget cannot be bypassed by changing forwarded IPs.
    getTracker:()=> 'public-form',
    skipIf:(context)=> {
      const request=context.switchToHttp().getRequest<Request>();
      const path=request.path.toLowerCase().replace(/\/+$/,'');
      return request.method!=='POST'||!['/api/v1/leads','/api/v1/leads/intent'].includes(path);
    },
  },
];

/** Vercel overwrites these headers at its edge; local requests use Express' socket-aware IP. */
export function clientAddress(req:Request):string|undefined {
  if(process.env.VERCEL) {
    const forwarded=req.headers['x-vercel-forwarded-for'];
    const address=(Array.isArray(forwarded)?forwarded[0]:forwarded)?.split(',')[0]?.trim();
    return address&&isIP(address)?address:undefined;
  }
  return req.ip||req.socket.remoteAddress||undefined;
}

@Injectable()
class Envelope implements NestInterceptor {
  intercept(ctx:ExecutionContext,next:CallHandler) {
    const req=ctx.switchToHttp().getRequest<Request>();
    return next.handle().pipe(map(data=>({success:true,data,meta:{requestId:req.headers['x-request-id']}})));
  }
}

@Catch()
class Errors implements ExceptionFilter {
  catch(error:unknown,host:ArgumentsHost) {
    const ctx=host.switchToHttp(),req=ctx.getRequest<Request>(),res=ctx.getResponse<Response>();
    const pgCode=(error as {code?:string})?.code;
    const status=error instanceof HttpException?error.getStatus():pgCode==='23505'?409:500;
    const payload=error instanceof HttpException?error.getResponse():null;
    const info=typeof payload==='object'&&payload?payload as {message?:string|string[];details?:unknown}:null;
    const message=status===429?(req.path.toLowerCase().endsWith('/login')?'Muitas tentativas. Aguarde antes de tentar novamente.':'Muitos envios. Aguarde um minuto e tente novamente.'):status===409?'Este endereço já está em uso. Escolha outro slug.':status===500?'Não foi possível concluir a solicitação.':info?.message||(typeof payload==='string'?payload:'Solicitação inválida.');
    if(status===500)console.error('API error:',error instanceof Error?error.name:'Unknown');
    res.status(status).json({success:false,error:{code:`HTTP_${status}`,message,details:info?.details},meta:{requestId:req.headers['x-request-id']}});
  }
}

function boundedJson(limit:string):RequestHandler {
  const parser=json({limit,strict:true,inflate:false});
  return (req,res,next)=>parser(req,res,(error?:{type?:string})=> {
    if(!error)return next();
    if(error.type==='entity.too.large')return next(new HttpException('O formulário excedeu o tamanho permitido.',413));
    if(error.type==='encoding.unsupported'||error.type==='charset.unsupported')return next(new HttpException('Formato de requisição não suportado.',415));
    // Never return the parser's diagnostic: it can contain parts of the submitted body.
    return next(new HttpException('Envie um objeto JSON válido.',400));
  });
}

/** Nest must be created with bodyParser:false so these limits run before parsing. */
export function configureHttp(app:INestApplication) {
  const express=app.getHttpAdapter().getInstance();
  express.disable('x-powered-by');
  express.set('trust proxy','loopback');
  app.use((req:Request,res:Response,next:()=>void)=> {
    req.headers['x-request-id']=randomUUID();
    res.setHeader('X-Content-Type-Options','nosniff');
    if(req.method!=='GET'||req.path.toLowerCase().startsWith('/api/v1/admin'))res.setHeader('Cache-Control','no-store');
    next();
  });
  app.use('/api/v1/leads',(req:Request,_res:Response,next:()=>void)=> {
    if(req.method==='POST') {
      checkOrigin(req);
      if(!req.is('application/json'))throw new HttpException('Envie o formulário como application/json.',415);
    }
    next();
  });
  app.use('/api/v1/leads',boundedJson('16kb'));
  // Editorial endpoints accept larger Markdown documents; multipart uploads keep their own limits.
  app.use(boundedJson('512kb'));
  app.use(cookieParser());
  app.useGlobalInterceptors(new Envelope());
  app.useGlobalFilters(new Errors());
}
