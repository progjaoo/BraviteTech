"use client";
import { useState,useId } from 'react';
import { AnimatePresence,motion } from 'motion/react';
import { Plus,Minus } from 'lucide-react';
const questions=[
 ['Por onde começamos?','Pelo seu negócio. A análise inicial ajuda a entender o contexto, o público-alvo e os objetivos antes de definir escopo e tecnologia.'],
 ['A análise gratuita já é uma proposta?','É uma avaliação inicial para orientar possibilidades e próximos passos. Escopo, investimento e prazos de um projeto são definidos depois, em uma proposta específica.'],
 ['Vocês também ajudam com design e identidade?','Sim. O processo verifica a identidade existente e define o design da experiência. Quando necessário, a criação ou adequação da marca faz parte do escopo acordado.'],
 ['Como são escolhidas as tecnologias e a hospedagem?','As decisões consideram a necessidade do projeto, segurança, custo, operação e evolução. A infraestrutura é definida com o cliente, conforme o escopo.'],
];
export function Faq(){const [active,setActive]=useState<number|null>(null);const id=useId();return <section className="faq-section section-pad"><div className="container faq-layout"><div data-reveal><p className="eyebrow">DÚVIDAS, COM CLAREZA</p><h2>Antes da<br/><span>próxima conversa.</span></h2></div><div>{questions.map(([q,a],i)=><div className="faq-row" key={q}><h3><button aria-expanded={active===i} aria-controls={`${id}-${i}`} onClick={()=>setActive(active===i?null:i)}>{q}{active===i?<Minus size={20}/>:<Plus size={20}/>}</button></h3><AnimatePresence initial={false}>{active===i&&<motion.div id={`${id}-${i}`} initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.22}} className="faq-answer"><p>{a}</p></motion.div>}</AnimatePresence></div>)}</div></div></section>;}
