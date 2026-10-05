import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { randomUUID, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import { Database } from '../infrastructure/database';
import { digest } from './auth';
import type { LeadCommand } from '../domain/contracts';

function mailConfiguration() {
 const resendKey=process.env.RESEND_API_KEY?.trim();
 if(resendKey){
  return {
   from:process.env.RESEND_FROM?.trim()||'Bravite <site@resend.grupogtf.com.br>',
   transport:{host:'smtp.resend.com',port:465,secure:true,auth:{user:'resend',pass:resendKey},connectionTimeout:10000,socketTimeout:15000},
  };
 }
 if(!process.env.SMTP_HOST||!process.env.SMTP_FROM)return null;
 const port=Number(process.env.SMTP_PORT||587);
 return {
  from:process.env.SMTP_FROM,
  transport:{host:process.env.SMTP_HOST,port,secure:port===465,auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}:undefined,connectionTimeout:10000,socketTimeout:15000},
 };
}

export function isMailConfigured(){return mailConfiguration()!==null;}

@Injectable()
export class LeadsService implements OnModuleInit,OnModuleDestroy {
 private timer?:NodeJS.Timeout;
 private processing=false;
 constructor(@Inject(Database)private db:Database){}
 async intent(source='site'){
  const id=randomUUID(),token=randomBytes(32).toString('base64url');
  await this.db.query('INSERT INTO leads(id,intent_token_hash,source) VALUES($1,$2,$3)',[id,digest(token),source]);
  return {id,token};
 }
 async submit(dto:LeadCommand){
  const client=await this.db.pool.connect();
  try{
   await client.query('BEGIN');let id:string|undefined;
   if(dto.intentId&&dto.intentToken){
    const updated=await client.query("UPDATE leads SET name=$1,email=$2,phone=$3,company=$4,service=$5,message=$6,status='new',consent_at=now(),consent_version='2026-10',intent_token_hash=NULL,updated_at=now() WHERE id=$7 AND intent_token_hash=$8 AND status='intent' RETURNING id",[dto.name.trim(),dto.email.toLowerCase(),dto.phone,dto.company||null,dto.service,dto.message.trim(),dto.intentId,digest(dto.intentToken)]);id=updated.rows[0]?.id;
   }
   if(!id){id=randomUUID();await client.query("INSERT INTO leads(id,name,email,phone,company,service,message,status,consent_at,consent_version,source) VALUES($1,$2,$3,$4,$5,$6,$7,'new',now(),'2026-10','form')",[id,dto.name.trim(),dto.email.toLowerCase(),dto.phone,dto.company||null,dto.service,dto.message.trim()]);}
   await client.query('INSERT INTO notification_outbox(id,lead_id) VALUES($1,$2)',[randomUUID(),id]);
   await client.query('COMMIT');void this.flush();return {id,status:'received'};
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }
 async flush(){
  const configuration=mailConfiguration();
  if(!configuration||this.processing)return;
  this.processing=true;
  try{
   const mail=nodemailer.createTransport(configuration.transport);
   const {rows}=await this.db.query("SELECT o.id AS notification_id,l.* FROM notification_outbox o JOIN leads l ON l.id=o.lead_id WHERE o.status='pending' AND o.attempts<5 ORDER BY o.created_at LIMIT 5");
   for(const lead of rows){
    try{
     await mail.sendMail({from:configuration.from,to:process.env.LEAD_NOTIFICATION_EMAIL||'bravitetech@gmail.com',replyTo:lead.email,subject:'Bravite — novo pedido de análise',text:`Nome: ${lead.name}\nE-mail: ${lead.email}\nWhatsApp: ${lead.phone}\nEmpresa: ${lead.company||'Não informada'}\nServiço: ${lead.service}\n\n${lead.message}`});
     await this.db.query("UPDATE notification_outbox SET status='sent',sent_at=now(),error=NULL WHERE id=$1",[lead.notification_id]);
    }catch{await this.db.query("UPDATE notification_outbox SET attempts=attempts+1,error='Falha no provedor de e-mail; verificar configuração e tentativas' WHERE id=$1",[lead.notification_id]);}
   }
  }catch{console.error('Notification queue unavailable.');}finally{this.processing=false;}
 }
 onModuleInit(){this.timer=setInterval(()=>void this.flush(),30000);this.timer.unref();}
 onModuleDestroy(){if(this.timer)clearInterval(this.timer);}
}
