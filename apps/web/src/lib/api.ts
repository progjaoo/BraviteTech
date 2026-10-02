import type { Envelope } from '@bravite/shared';
export class ContentError extends Error {constructor(message:string,public status:number){super(message);}}
export async function request<T>(path:string,options:RequestInit={}):Promise<T>{
 const response=await fetch(`/api/v1/${path}`,{...options,headers:options.body instanceof FormData?options.headers:{'Content-Type':'application/json',...options.headers}});
 const payload=await response.json() as Envelope<T>;
 if(!payload.success)throw new Error(typeof payload.error.message==='string'?payload.error.message:'Não foi possível concluir a solicitação.');
 if(!response.ok)throw new Error('Não foi possível concluir a solicitação.');return payload.data;
}
export async function content<T>(path:string):Promise<T>{
 const response=await fetch(`${process.env.API_URL||'http://127.0.0.1:4000'}/api/v1/${path}`,{cache:'no-store',signal:AbortSignal.timeout(5000)});
 const payload=await response.json() as Envelope<T>;
 if(!payload.success)throw new ContentError(payload.error.message,response.status);return payload.data;
}
