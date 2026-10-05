/** Bravite's company technology list, shared by the home marquee and About page. */
const catalog = [
  { name: 'OpenAI', category: 'Inteligência artificial e automação' },
  { name: 'Next.js', category: 'Desenvolvimento web' },
  { name: 'JavaScript', category: 'Desenvolvimento web' },
  { name: 'TypeScript', category: 'Desenvolvimento web' },
  { name: 'React', category: 'Desenvolvimento web' },
  { name: 'Node.js', category: 'Backend e dados' },
  { name: 'C#', category: 'Desenvolvimento backend' },
  { name: '.NET', category: 'Desenvolvimento backend' },
  { name: 'PostgreSQL', category: 'Backend e dados' },
  { name: 'SQL Server', category: 'Backend e dados' },
  { name: 'Neon DB', category: 'Backend e dados' },
  { name: 'Electron', category: 'Desktop e mobile' },
  { name: 'React Native', category: 'Desktop e mobile' },
  { name: 'Figma', category: 'Design e prototipação' },
  { name: 'Hermes Agent + n8n', category: 'Inteligência artificial e automação' },
] as const;

export const technologies = catalog.map(item => item.name);

export const technologyGroups = Array.from(new Set(catalog.map(item => item.category))).map(label => ({
  label,
  items: catalog.filter(item => item.category === label).map(item => item.name),
}));
