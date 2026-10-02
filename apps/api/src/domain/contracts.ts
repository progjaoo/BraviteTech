// Application contracts do not depend on HTTP decorators or Nest DTOs.
export interface LeadCommand {
 name:string;email:string;phone:string;company?:string;service:string;message:string;
 consent:boolean;intentId?:string;intentToken?:string;website?:string;
}
export interface PostCommand {
 title:string;slug:string;excerpt:string;content:string;category:string;
 cover_url?:string|null;cover_alt?:string;status:'draft'|'published';
}
export interface CaseCommand {
 title:string;slug:string;client:string;summary:string;content:string;category:string;
 cover_url?:string|null;cover_alt?:string;website_url?:string|null;status:'draft'|'published';
}
