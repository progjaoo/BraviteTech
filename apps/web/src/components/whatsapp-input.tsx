"use client";

import type { ChangeEvent } from 'react';
import { formatWhatsApp, nationalPhoneDigits, phoneCaretPosition } from '@/lib/whatsapp';

export function WhatsAppInput() {
  function mask(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const raw = input.value;
    const beforeCaret = raw.slice(0, input.selectionStart ?? raw.length);
    const countryRemoved = raw.replace(/\D/g, '').startsWith('55') &&
      (raw.trimStart().startsWith('+55') || raw.replace(/\D/g, '').length > 11);
    const digitsBeforeCaret = Math.max(0, beforeCaret.replace(/\D/g, '').length - (countryRemoved ? 2 : 0));
    const formatted = formatWhatsApp(raw);
    const deleting = (event.nativeEvent as InputEvent).inputType?.startsWith('delete') ?? false;
    input.value = formatted;
    const position = phoneCaretPosition(formatted, Math.min(digitsBeforeCaret, nationalPhoneDigits(raw).length), deleting);
    input.setSelectionRange(position, position);
  }

  return <input
    name="phone"
    type="tel"
    inputMode="tel"
    autoComplete="tel-national"
    required
    minLength={14}
    maxLength={25}
    pattern={String.raw`\([1-9][0-9]\) (?:[2-5][0-9]{3}-[0-9]{4}|9[0-9]{4}-[0-9]{4})`}
    placeholder="(24) 99911-9722"
    title="Informe um WhatsApp válido com DDD, como (24) 99911-9722."
    onChange={mask}
  />;
}
