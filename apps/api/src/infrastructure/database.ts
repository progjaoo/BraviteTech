import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID, randomBytes, scryptSync } from 'node:crypto';

@Injectable()
export class Database implements OnModuleInit, OnModuleDestroy {
  readonly pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 });
  async query<T extends QueryResultRow = QueryResultRow>(sql:string, values:unknown[] = []) { return this.pool.query<T>(sql, values); }
  async onModuleInit() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be configured.');
    await this.query(await readFile(resolve(process.cwd(), '../../packages/database/migrations/001-init.sql'), 'utf8'));
    const email=process.env.ADMIN_EMAIL, password=process.env.ADMIN_PASSWORD;
    if(email && password) {
      const salt=randomBytes(16).toString('hex');
      const hash=scryptSync(password,salt,64).toString('hex');
      await this.query('INSERT INTO admin_users(id,email,password_hash) VALUES($1,$2,$3) ON CONFLICT(email) DO NOTHING',[randomUUID(),email.toLowerCase(),`${salt}:${hash}`]);
    }
    await this.query('DELETE FROM admin_sessions WHERE expires_at < now()');
    await this.seedEditorial();
  }
  async seedEditorial() {
    const client=await this.pool.connect();
    try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(20261002)');
    const applied=await client.query('SELECT 1 FROM schema_migrations WHERE version=2');
    if(applied.rowCount){await client.query('COMMIT');return;}
    const existing=await client.query('SELECT 1 FROM posts LIMIT 1');
    const posts=[
      {slug:'antes-do-primeiro-commit', title:'Antes do primeiro commit, a pergunta certa.', category:'Estratégia', excerpt:'Entender o negócio vem antes de escolher uma tecnologia. Conheça as perguntas que orientam um projeto digital.', content:'# O ponto de partida é o negócio\n\nUma aplicação pode ser bem construída e, ainda assim, resolver o problema errado. Por isso, nosso processo começa com a análise do contexto, do público e dos objetivos.\n\n## Três perguntas para começar\n\n1. Qual problema precisa ser resolvido?\n2. Quem vai usar a solução e em qual contexto?\n3. Como vamos reconhecer uma boa entrega?\n\nAs respostas ajudam a definir prioridades, escopo e critérios de aceite. Só então faz sentido discutir interface, integrações e infraestrutura.\n\n## Tecnologia com intenção\n\nA escolha de ferramentas deve acompanhar as necessidades do projeto: segurança, operação, manutenção, orçamento e capacidade de evolução. Uma tecnologia conhecida não é, por si só, a melhor solução para todos os negócios.\n\nNa Bravite, coragem para criar começa com clareza sobre o que construir.'},
      {slug:'site-ou-sistema-web', title:'Seu negócio precisa de um site ou de um sistema?', category:'Desenvolvimento', excerpt:'Presença digital e operação são necessidades diferentes. A escolha começa pelo objetivo, não pela ferramenta.', content:'# Presença e operação\n\nUm site apresenta sua empresa, organiza a oferta e ajuda as pessoas a entrar em contato. Um sistema web permite executar atividades: acompanhar pedidos, organizar dados ou integrar uma operação.\n\n## Quando um site faz sentido\n\n- Apresentar serviços e posicionamento.\n- Publicar conteúdo e projetos.\n- Receber pedidos de contato ou análise.\n\n## Quando um sistema é necessário\n\n- Há processos que precisam de acompanhamento.\n- Diferentes pessoas usam dados e permissões.\n- É preciso conectar ferramentas ou automatizar tarefas.\n\nAs duas soluções podem trabalhar juntas. Antes de definir o escopo, descreva a jornada de quem vai usar a aplicação e quais resultados espera obter.'},
      {slug:'automacao-com-criterio', title:'Automação começa pelo processo, não pelo bot.', category:'Automação & IA', excerpt:'O que vale automatizar? Um roteiro para identificar tarefas, limites e pontos de intervenção humana.', content:'# Automação com critério\n\nUma tarefa repetitiva pode ser uma boa candidata à automação, mas isso não elimina a necessidade de entender o processo. Entradas, regras, exceções e responsabilidades precisam estar claros.\n\n## Um roteiro inicial\n\n1. Mapeie a atividade e os dados utilizados.\n2. Identifique decisões previsíveis e exceções.\n3. Defina quando uma pessoa deve intervir.\n4. Estabeleça como acompanhar erros e resultados.\n\n## Onde a inteligência artificial entra\n\nBots podem ajudar a organizar informação, orientar jornadas e conectar ferramentas. Quando a solução usa IA, os limites e a revisão humana precisam acompanhar o contexto do negócio.\n\nO objetivo é construir uma ferramenta útil e acompanhável, com critérios de qualidade definidos antes da implementação.'}
    ];
    if(!existing.rowCount) for(const post of posts) await client.query('INSERT INTO posts(id,slug,title,excerpt,content,category,status,published_at) VALUES($1,$2,$3,$4,$5,$6,$7,now()) ON CONFLICT(slug) DO NOTHING',[randomUUID(),post.slug,post.title,post.excerpt,post.content,post.category,'published']);
    await client.query('INSERT INTO schema_migrations(version) VALUES(2) ON CONFLICT DO NOTHING');
    await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }
  async onModuleDestroy(){ await this.pool.end(); }
}
