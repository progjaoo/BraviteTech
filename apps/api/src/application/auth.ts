import { Injectable, Inject, UnauthorizedException, CanActivate, ExecutionContext, ForbiddenException, HttpException } from '@nestjs/common';
import { randomBytes, createHash, createHmac, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import { Database } from '../infrastructure/database';
import type { DatabaseContext } from '../infrastructure/database';
import type { Request } from 'express';
export const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
export const sessionCookie='bravite_admin';
@Injectable()
export class AuthService {
 constructor(@Inject(Database) private db:Database){}
 private async consumeLoginLimit(scope:'ip'|'email',value:string,window:string,limit:number){
  const secret=process.env.LOGIN_RATE_LIMIT_SECRET;
  if(!secret||Buffer.byteLength(secret)<32)throw new Error('LOGIN_RATE_LIMIT_SECRET must contain at least 32 bytes.');
  const keyHash=createHmac('sha256',secret).update(`${scope}:${value}`).digest('hex');
  const {rows}=await this.db.query<{attempts:number|string}>('INSERT INTO admin_login_rate_limits(scope,key_hash,window_started_at,attempts,updated_at) VALUES($1,$2,clock_timestamp(),1,clock_timestamp()) ON CONFLICT(scope,key_hash) DO UPDATE SET attempts=CASE WHEN admin_login_rate_limits.window_started_at<=clock_timestamp()-$3::interval THEN 1 ELSE admin_login_rate_limits.attempts+1 END,window_started_at=CASE WHEN admin_login_rate_limits.window_started_at<=clock_timestamp()-$3::interval THEN clock_timestamp() ELSE admin_login_rate_limits.window_started_at END,updated_at=clock_timestamp() RETURNING attempts',[scope,keyHash,window]);
  if(Number(rows[0]?.attempts)>limit)throw new HttpException('Muitas tentativas. Aguarde antes de tentar novamente.',429);
 }
 private async enforceLoginLimits(email:string,ip?:string){
  const checks=[this.consumeLoginLimit('email',email,'15 minutes',10)];
  if(ip&&ip!=='unknown')checks.push(this.consumeLoginLimit('ip',ip,'1 minute',5));
  await Promise.all(checks);
  // Expire old, irreversible HMAC keys occasionally so random addresses cannot grow the table forever.
  if(randomInt(100)===0)void this.db.query("DELETE FROM admin_login_rate_limits WHERE updated_at<now()-interval '24 hours'").catch(()=>{});
 }
 async login(email:string,password:string,ip?:string){
  const normalizedEmail=email.normalize('NFC').trim().toLowerCase();
  await this.enforceLoginLimits(normalizedEmail,ip);
  const {rows}=await this.db.queryWithContext({loginEmail:normalizedEmail},'SELECT * FROM admin_users WHERE email=$1',[normalizedEmail]);
  // Equal-cost derivation also for unknown emails; avoid account enumeration.
  const [salt,encoded]=(rows[0]?.password_hash||'00000000000000000000000000000000:'+Buffer.alloc(64).toString('hex')).split(':');
  const derived=scryptSync(password,salt,64),hash=Buffer.from(encoded,'hex');
  if(!timingSafeEqual(derived,hash)||!rows[0]) throw new UnauthorizedException('E-mail ou senha incorretos.');
  const token=randomBytes(32).toString('base64url');
  await this.db.queryWithContext({loginUserId:rows[0].id},"INSERT INTO admin_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",[digest(token),rows[0].id]);
  return token;
 }
 async session(token?:string){
  if(!token) return null;
  const {rows}=await this.db.queryWithContext({sessionTokenHash:digest(token)},'SELECT u.id,u.email FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[digest(token)]);
  return rows[0]||null;
 }
 async logout(token?:string){if(token) await this.db.queryWithContext({sessionTokenHash:digest(token)},'DELETE FROM admin_sessions WHERE token_hash=$1',[digest(token)]);}
}
type SessionRequest = Request & { braviteSessionTokenHash?: string };
export function adminDatabaseContext(req:Request):DatabaseContext {
 const sessionTokenHash=(req as SessionRequest).braviteSessionTokenHash;
 if(!sessionTokenHash)throw new UnauthorizedException('Entre no painel para continuar.');
 return {sessionTokenHash};
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
  const token=req.cookies?.[sessionCookie];
  const session=await this.auth.session(token);
  if(!session) throw new UnauthorizedException('Entre no painel para continuar.');
  (req as SessionRequest).braviteSessionTokenHash=digest(token);
  return true;
 }
}
