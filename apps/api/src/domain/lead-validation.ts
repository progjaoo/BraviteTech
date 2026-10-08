// Keep these values aligned with the options offered by the public form.
export const LEAD_SERVICES = [
  'Criação de sites',
  'Sistemas web & plataformas',
  'E-commerces',
  'Automação & inteligência artificial',
  'Análise de dados para negócios',
  'Ainda preciso entender a melhor solução',
];

const BRAZILIAN_AREA_CODES = new Set([
  '11','12','13','14','15','16','17','18','19','21','22','24','27','28',
  '31','32','33','34','35','37','38','41','42','43','44','45','46','47','48','49',
  '51','53','54','55','61','62','63','64','65','66','67','68','69','71','73','74','75','77','79',
  '81','82','83','84','85','86','87','88','89','91','92','93','94','95','96','97','98','99',
]);

export function normalizeText(value: unknown, multiline = false): unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.normalize('NFC');
  return (multiline ? normalized.replace(/\r\n?/g, '\n') : normalized).trim();
}

export function normalizeBrazilianPhone(value: unknown): unknown {
  if (typeof value !== 'string' || value.length > 25 || !/^\+?[0-9 ()-]+$/.test(value) || /[\r\n]/.test(value)) return value;
  const digits = value.replace(/\D/g, '');
  if (value.startsWith('+')) {
    return (digits.length === 12 || digits.length === 13) && digits.startsWith('55') ? `+${digits}` : value;
  }
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) return `+${digits}`;
  return value;
}

export function isBrazilianPhone(value: unknown): boolean {
  if (typeof value !== 'string' || /[\r\n]/.test(value)) return false;
  const match = /^\+55([0-9]{2})(?:9[0-9]{8}|[2-5][0-9]{7})$/.exec(value);
  return Boolean(match && BRAZILIAN_AREA_CODES.has(match[1]));
}

export const SINGLE_LINE_TEXT = /^[^\u0000-\u001f\u007f-\u009f]*$/u;
// Free-form descriptions may contain newlines and tabs; no other C0/C1 controls.
export const MULTILINE_TEXT = /^[^\u0000-\u0008\u000b-\u001f\u007f-\u009f]*$/u;
