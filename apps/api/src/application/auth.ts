import { Injectable, Inject, UnauthorizedException, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { Database } from '../infrastructure/database';
import type { Request } from 'express';
export const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
export const sessionCookie='bravite_admin';
@Injectable()
export class AuthService {
 constructor(@Inject(Database) private db:Database){}
 async login(email:string,password:string){
  const {rows}=await this.db.query('SELECT * FROM admin_users WHERE email=$1',[email.toLowerCase()]);
  // Equal-cost derivation also for unknown emails; avoid account enumeration.
  const [salt,encoded]=(rows[0]?.password_hash||'00000000000000000000000000000000:'+Buffer.alloc(64).toString('hex')).split(':');
  const derived=scryptSync(password,salt,64),hash=Buffer.from(encoded,'hex');
  if(!timingSafeEqual(derived,hash)||!rows[0]) throw new UnauthorizedException('E-mail ou senha incorretos.');
  const token=randomBytes(32).toString('base64url');
  await this.db.query("INSERT INTO admin_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",[digest(token),rows[0].id]);
  return token;
 }
 async session(token?:string){
  if(!token) return null;
  const {rows}=await this.db.query('SELECT u.id,u.email FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[digest(token)]);
  return rows[0]||null;
 }
 async logout(token?:string){if(token) await this.db.query('DELETE FROM admin_sessions WHERE token_hash=$1',[digest(token)]);}
}
export function checkOrigin(req:Request){
 const origin=req.headers.origin;
 const allowed=new Set((process.env.APP_ORIGIN||'http://localhost:3000').split(',').map(v=>v.trim()));
 if(req.method!=='GET' && req.method!=='HEAD' && (!origin||!allowed.has(origin))) throw new ForbiddenException('Origem não autorizada.');
 if(req.method!=='GET' && req.method!=='HEAD' && req.headers['sec-fetch-site']==='cross-site') throw new ForbiddenException('Origem não autorizada.');
}
@Injectable()
export class AdminGuard implements CanActivate {
 constructor(@Inject(AuthService) private auth:AuthService){}
 async canActivate(ctx:ExecutionContext){
  const req=ctx.switchToHttp().getRequest<Request>();
  checkOrigin(req);
  const session=await this.auth.session(req.cookies?.[sessionCookie]);
  if(!session) throw new UnauthorizedException('Entre no painel para continuar.');
  return true;
 }
}
