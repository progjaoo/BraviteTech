/** Format Brazilian national numbers, including pastes/autofill with +55. */
export function nationalPhoneDigits(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('55') && (value.trimStart().startsWith('+55') || digits.length > 11)) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 11);
}

export function formatWhatsApp(value: string) {
  const digits = nationalPhoneDigits(value);
  if (!digits) return '';
  if (digits.length < 2) return `(${digits}`;
  const area = digits.slice(0, 2);
  const number = digits.slice(2);
  const split = number.length > 8 ? 5 : 4;
  return `(${area}) ${number.slice(0, split)}${number.length > split ? `-${number.slice(split)}` : ''}`;
}

/** Keep edits in the middle of the field from jumping to the end of the mask. */
export function phoneCaretPosition(masked: string, digitsBeforeCaret: number, deleting: boolean) {
  if (digitsBeforeCaret <= 0) return masked.startsWith('(') ? 1 : 0;
  let digits = 0;
  let position = 0;
  for (; position < masked.length; position++) {
    if (/\d/.test(masked[position]) && ++digits === digitsBeforeCaret) {
      position++;
      break;
    }
  }
  if (!deleting) {
    while (position < masked.length && !/\d/.test(masked[position])) position++;
  }
  return position;
}
