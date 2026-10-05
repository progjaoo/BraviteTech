import type { IconType } from 'react-icons';
import {
  SiCloudflare, SiDocker, SiElectron, SiFigma, SiGsap, SiJavascript,
  SiN8N, SiNeon, SiNestjs, SiNextdotjs, SiNodedotjs, SiPostgresql,
  SiReact, SiTailwindcss, SiThreedotjs, SiTypescript, SiZod,
} from 'react-icons/si';
import { technologies } from './technologies';

export interface Technology {
  name: string;
  /** Official Simple Icon component, or a specific initials badge. */
  icon: IconType | string;
  color: string;
}

// The company catalog is confirmed in technologies.ts and the carousel documentation.
// OpenAI and SQL Server are absent from react-icons/si 5.7.0; use explicit badges.
// SiHermes represents the fashion brand, not Hermes Agent. n8n identifies the automation tool.
const companyIcons = {
  'OpenAI': { icon: 'OAI', color: 'var(--white)' },
  'Next.js': { icon: SiNextdotjs, color: 'var(--white)' },
  'JavaScript': { icon: SiJavascript, color: '#F7DF1E' },
  'TypeScript': { icon: SiTypescript, color: '#3178C6' },
  'React': { icon: SiReact, color: '#61DAFB' },
  'Node.js': { icon: SiNodedotjs, color: '#5FA04E' },
  'PostgreSQL': { icon: SiPostgresql, color: '#4169E1' },
  'SQL Server': { icon: 'SQL', color: '#CC2927' },
  'Neon DB': { icon: SiNeon, color: '#00E599' },
  'Electron': { icon: SiElectron, color: '#47848F' },
  'React Native': { icon: SiReact, color: '#61DAFB' },
  'Figma': { icon: SiFigma, color: '#F24E1E' },
  'Hermes Agent + n8n': { icon: SiN8N, color: '#EA4B71' },
} satisfies Record<(typeof technologies)[number], Pick<Technology, 'icon' | 'color'>>;

/** Company tools plus dependencies/infrastructure verified in this repository. */
export const defaultTechnologies: readonly Technology[] = [
  ...technologies.map(name => ({ name, ...companyIcons[name] })),
  { name: 'NestJS', icon: SiNestjs, color: '#E0234E' },
  { name: 'Tailwind CSS', icon: SiTailwindcss, color: '#06B6D4' },
  { name: 'Docker', icon: SiDocker, color: '#2496ED' },
  { name: 'GSAP', icon: SiGsap, color: '#0AE448' },
  { name: 'Motion', icon: 'M', color: '#FFF312' },
  { name: 'Three.js', icon: SiThreedotjs, color: 'var(--white)' },
  { name: 'Lenis', icon: 'L', color: 'var(--white)' },
  { name: 'Zod', icon: SiZod, color: '#3E67B1' },
  { name: 'Cloudflare', icon: SiCloudflare, color: '#F38020' },
];
