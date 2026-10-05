import type { IconType } from 'react-icons';
import {
  SiCloudflare, SiDocker, SiElectron, SiFigma, SiJavascript, SiN8N,
  SiNeon, SiNestjs, SiNextdotjs, SiNodedotjs, SiPostgresql, SiReact,
  SiDotnet, SiTypescript,
} from 'react-icons/si';
import {
  CSharpIcon,
  MotionIcon,
  OpenAiIcon,
  SqlServerIcon,
} from '@/components/icons/technology-assets';
import { technologies } from './technologies';

export interface Technology {
  name: string;
  icon: IconType;
  color: string;
}

const companyIcons = {
  'OpenAI': { icon: OpenAiIcon, color: 'var(--white)' },
  'Next.js': { icon: SiNextdotjs, color: 'var(--white)' },
  'JavaScript': { icon: SiJavascript, color: '#F7DF1E' },
  'TypeScript': { icon: SiTypescript, color: '#3178C6' },
  'React': { icon: SiReact, color: '#61DAFB' },
  'Node.js': { icon: SiNodedotjs, color: '#5FA04E' },
  'C#': { icon: CSharpIcon, color: '#9B4F96' },
  '.NET': { icon: SiDotnet, color: '#512BD4' },
  'PostgreSQL': { icon: SiPostgresql, color: '#4169E1' },
  'SQL Server': { icon: SqlServerIcon, color: '#CC2927' },
  'Neon DB': { icon: SiNeon, color: '#00E599' },
  'Electron': { icon: SiElectron, color: '#47848F' },
  'React Native': { icon: SiReact, color: '#61DAFB' },
  'Figma': { icon: SiFigma, color: '#F24E1E' },
  'Hermes Agent + n8n': { icon: SiN8N, color: '#EA4B71' },
} satisfies Record<(typeof technologies)[number], Pick<Technology, 'icon' | 'color'>>;

/** The requested company catalog plus the listed application tools. */
export const defaultTechnologies: readonly Technology[] = [
  ...technologies.map(name => ({ name, ...companyIcons[name] })),
  { name: 'NestJS', icon: SiNestjs, color: '#E0234E' },
  { name: 'Docker', icon: SiDocker, color: '#2496ED' },
  { name: 'Cloudflare', icon: SiCloudflare, color: '#F38020' },
  { name: 'Motion', icon: MotionIcon, color: '#FFF312' },
];
