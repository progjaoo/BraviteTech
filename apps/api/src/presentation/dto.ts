import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUUID, Length, Matches, MaxLength, Equals } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { LeadCommand,PostCommand,CaseCommand } from '../domain/contracts';

export class IntentDto {
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) source?:string;
}
export class LeadDto implements LeadCommand {
 @ApiProperty() @IsString() @Length(2,120) name!:string;
 @ApiProperty() @IsEmail() @MaxLength(254) email!:string;
 @ApiProperty() @IsString() @Matches(/^(?=(?:\D*\d){10,15}\D*$)\+?[\d\s()\-]{10,25}$/) phone!:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) company?:string;
 @ApiProperty() @IsString() @MaxLength(100) service!:string;
 @ApiProperty() @IsString() @Length(10,3000) message!:string;
 @ApiProperty() @IsBoolean() @Equals(true) consent!:boolean;
 @ApiPropertyOptional() @IsOptional() @IsUUID() intentId?:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(128) intentToken?:string;
 @ApiPropertyOptional({description:'Honeypot: must remain empty'}) @IsOptional() @IsString() @Equals('') website?:string;
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
  const object=plainToInstance(this.dto,value);
  const errors=await validate(object,{whitelist:true,forbidNonWhitelisted:true,forbidUnknownValues:true});
  if(errors.length) throw new BadRequestException({message:'Confira os campos informados.',details:errors.map(e=>({field:e.property,messages:Object.values(e.constraints||{})}))});
  return object;
 }
}
