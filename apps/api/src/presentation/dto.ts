import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUUID, Length, Matches, MaxLength, Equals, ValidateBy, ValidateIf } from 'class-validator';
import { plainToInstance, Transform } from 'class-transformer';
import { validate } from 'class-validator';
import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { LeadCommand,PostCommand,CaseCommand } from '../domain/contracts';
import { LEAD_SERVICES, MULTILINE_TEXT, SINGLE_LINE_TEXT, isBrazilianPhone, normalizeBrazilianPhone, normalizeText } from '../domain/lead-validation';

export class IntentDto {
 @ApiPropertyOptional() @ValidateIf((_,value)=>value!==undefined) @Transform(({value})=>normalizeText(value)) @IsString() @Length(1,80) @Matches(SINGLE_LINE_TEXT) source?:string;
}
export class LeadDto implements LeadCommand {
 @ApiProperty({minLength:2,maxLength:120}) @Transform(({value})=>normalizeText(value)) @IsString() @Length(2,120) @Matches(SINGLE_LINE_TEXT) name!:string;
 @ApiProperty({format:'email',maxLength:254}) @Transform(({value})=>normalizeText(value)) @IsString() @IsEmail() @MaxLength(254) @Matches(SINGLE_LINE_TEXT) email!:string;
 @ApiProperty({example:'(24) 99911-9722',description:'WhatsApp brasileiro com DDD; armazenado no padrão E.164 (+55).'})
 @Transform(({value})=>normalizeBrazilianPhone(value)) @IsString()
 @ValidateBy({name:'brazilianPhone',validator:{validate:isBrazilianPhone,defaultMessage:()=> 'Informe um WhatsApp brasileiro válido com DDD.'}}) phone!:string;
 @ApiPropertyOptional({maxLength:160}) @ValidateIf((_,value)=>value!==undefined) @Transform(({value})=>normalizeText(value)) @IsString() @MaxLength(160) @Matches(SINGLE_LINE_TEXT) company?:string;
 @ApiProperty({enum:LEAD_SERVICES}) @Transform(({value})=>normalizeText(value)) @IsString() @IsIn(LEAD_SERVICES,{message:'Selecione um dos serviços disponíveis.'}) service!:string;
 @ApiProperty({minLength:10,maxLength:3000}) @Transform(({value})=>normalizeText(value,true)) @IsString() @Length(10,3000) @Matches(MULTILINE_TEXT) message!:string;
 @ApiProperty() @IsBoolean() @Equals(true) consent!:boolean;
 @ApiPropertyOptional() @ValidateIf(value=>value.intentId!==undefined||value.intentToken!==undefined) @IsUUID('4') intentId?:string;
 @ApiPropertyOptional() @ValidateIf(value=>value.intentId!==undefined||value.intentToken!==undefined) @IsString() @Length(43,43) @Matches(/^[A-Za-z0-9_-]{43}$/) intentToken?:string;
 @ApiPropertyOptional({description:'Honeypot: must remain empty'}) @ValidateIf((_,value)=>value!==undefined) @IsString() @Equals('') website?:string;
}
export class LoginDto {
 @ApiProperty() @IsEmail() email!:string;
 @ApiProperty() @IsString() @Length(1,200) password!:string;
}
export class StatusDto {
 @ApiProperty({enum:['new','contacted','qualified','closed']}) @IsIn(['new','contacted','qualified','closed']) status!:string;
}
export class PostDto implements PostCommand {
 @ApiProperty() @IsString() @Length(5,200) title!:string;
 @ApiProperty() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @Length(3,160) slug!:string;
 @ApiProperty() @IsString() @Length(10,400) excerpt!:string;
 @ApiProperty() @IsString() @Length(20,100000) content!:string;
 @ApiProperty() @IsString() @Length(2,80) category!:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) cover_url?:string|null;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) cover_alt?:string;
 @ApiProperty({enum:['draft','published']}) @IsIn(['draft','published']) status!:'draft'|'published';
}
export class CaseDto implements CaseCommand {
 @ApiProperty() @IsString() @Length(5,200) title!:string;
 @ApiProperty() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @Length(3,160) slug!:string;
 @ApiProperty() @IsString() @Length(2,160) client!:string;
 @ApiProperty() @IsString() @Length(10,500) summary!:string;
 @ApiProperty() @IsString() @Length(20,100000) content!:string;
 @ApiProperty() @IsString() @Length(2,80) category!:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) cover_url?:string|null;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) cover_alt?:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) website_url?:string|null;
 @ApiProperty() @IsIn(['draft','published']) status!:'draft'|'published';
}
export class DtoPipe<T extends object> implements PipeTransform {
 constructor(private dto:new()=>T){}
 async transform(value:unknown){
  if(value===null||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).some(key=>['__proto__','constructor','prototype'].includes(key))) {
   throw new BadRequestException('Envie um objeto JSON válido com os campos do formulário.');
  }
  const object=plainToInstance(this.dto,value);
  const errors=await validate(object,{whitelist:true,forbidNonWhitelisted:true,forbidUnknownValues:true,validationError:{target:false,value:false}});
  if(errors.length) throw new BadRequestException({message:'Confira os campos informados.',details:errors.map(e=>({field:e.property,messages:Object.values(e.constraints||{})}))});
  return object;
 }
}
