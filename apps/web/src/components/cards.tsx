import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { Post,CaseStudy } from '@bravite/shared';
import { ArticleVisual } from './visuals';
export function PostCard({post,index=0}:{post:Post;index?:number}){return <Link href={`/blog/${post.slug}`} className="post-card" data-reveal>{post.cover_url?<div className="post-image"><Image src={post.cover_url} alt={post.cover_alt} fill sizes="(max-width: 700px) 100vw, 33vw"/></div>:<ArticleVisual index={index}/>}<div className="post-meta"><span>{post.category}</span><ArrowUpRight size={18}/></div><h3>{post.title}</h3><p>{post.excerpt}</p><span className="post-read">Ler perspectiva <ArrowUpRight size={14}/></span></Link>;}
export function CaseCard({project,index=0}:{project:CaseStudy;index?:number}){return <Link href={`/cases/${project.slug}`} className="case-card" data-reveal>{project.cover_url?<div className="case-image"><Image src={project.cover_url} alt={project.cover_alt} fill sizes="(max-width:700px) 100vw,50vw"/></div>:<ArticleVisual index={index}/>}<div className="post-meta"><span>{project.category}</span><ArrowUpRight size={20}/></div><h3>{project.title}</h3><p>{project.summary}</p></Link>;}
