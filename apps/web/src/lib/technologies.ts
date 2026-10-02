/** Technologies used by this application and its development workflow. */
export const technologyGroups=[
 {label:'Interface',items:['Next.js','React','TypeScript','Tailwind CSS']},
 {label:'Interação',items:['GSAP','Motion','Three.js','Lenis']},
 {label:'Backend e dados',items:['Node.js','NestJS','PostgreSQL']},
 {label:'Contratos e validação',items:['OpenAPI','Swagger','Zod','class-validator']},
 {label:'Entrega e infraestrutura',items:['Git','GitHub','Docker','Cloudflare']},
] as const;
export const technologies=technologyGroups.flatMap(group=>[...group.items]);
