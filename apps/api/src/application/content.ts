import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Database } from '../infrastructure/database';
import type { PostCommand, CaseCommand } from '../domain/contracts';
function mediaURL(value?:string|null){
 if(!value)return null;
 if(/^\/api\/v1\/media\/files\/[a-f0-9-]+\.(png|jpe?g|webp|avif)$/.test(value)||/^https:\/\/imagedelivery\.net\/[A-Za-z0-9/_-]+$/.test(value))return value;
 throw new BadRequestException('Utilize uma imagem enviada pelo painel.');
}
@Injectable()
export class ContentService {
 constructor(@Inject(Database)private db:Database){}
 async list(kind:'posts'|'cases',admin=false){return (await this.db.query(`SELECT * FROM ${kind} ${admin?'':"WHERE status='published'"} ORDER BY created_at DESC`)).rows;}
 async one(kind:'posts'|'cases',slug:string){
  const {rows}=await this.db.query(`SELECT * FROM ${kind} WHERE slug=$1 AND status='published'`,[slug]);
  if(!rows[0])throw new NotFoundException('Conteúdo não encontrado.');return rows[0];
 }
 async save(kind:'posts'|'cases',dto:PostCommand|CaseCommand,id?:string){
  if(dto.status==='published' && dto.cover_url && !dto.cover_alt?.trim())throw new BadRequestException('Informe a descrição da imagem antes de publicar.');
  const values:Record<string,unknown>={...dto,cover_url:mediaURL(dto.cover_url),cover_alt:dto.cover_alt||''};
  if(kind==='posts')values.published_at=dto.status==='published'?new Date():null;
  if(kind==='cases'){
   const link=(dto as CaseCommand).website_url;
   if(link){try{const url=new URL(link);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error();}catch{throw new BadRequestException('Informe um endereço válido para o projeto.');}}
   values.website_url=link||null;
  }
  const columns=Object.keys(values),args=Object.values(values);
  if(id){
   const {rows}=await this.db.query(`UPDATE ${kind} SET ${columns.map((c,i)=>`${c}=$${i+1}`).join(',')},updated_at=now() WHERE id=$${columns.length+1} RETURNING *`,[...args,id]);
   if(!rows[0])throw new NotFoundException('Conteúdo não encontrado.');return rows[0];
  }
  const {rows}=await this.db.query(`INSERT INTO ${kind}(id,${columns.join(',')}) VALUES($1,${columns.map((_,i)=>`$${i+2}`).join(',')}) RETURNING *`,[randomUUID(),...args]);return rows[0];
 }
 async remove(kind:'posts'|'cases',id:string){const result=await this.db.query(`DELETE FROM ${kind} WHERE id=$1`,[id]);if(!result.rowCount)throw new NotFoundException();return {deleted:true};}
}
