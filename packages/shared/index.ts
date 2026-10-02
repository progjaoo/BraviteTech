export type LeadStatus = "intent" | "new" | "contacted" | "qualified" | "closed";
export interface Lead { id:string; name:string|null; email:string|null; phone:string|null; company:string|null; service:string|null; message:string|null; status:LeadStatus; created_at:string; }
export interface Post { id:string; slug:string; title:string; excerpt:string; content:string; category:string; cover_url:string|null; cover_alt:string; status:"draft"|"published"; created_at:string; published_at:string|null; }
export interface CaseStudy { id:string; slug:string; title:string; client:string; summary:string; content:string; cover_url:string|null; cover_alt:string; website_url:string|null; category:string; status:"draft"|"published"; }
export type Envelope<T> = { success:true; data:T; meta:{requestId:string} } | { success:false; error:{code:string;message:string;details?:unknown}; meta:{requestId:string} };
