'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  normaliseLanguage,
  type LanguageCode,
} from '@/lib/i18n/language';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]!) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function useLanguage(): [LanguageCode, (next: LanguageCode) => void] {
  const [lang, setLang] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = normaliseLanguage(readCookie(LANGUAGE_COOKIE));
    setLang(stored);
  }, []);

  const change = useCallback((next: LanguageCode) => {
    writeCookie(LANGUAGE_COOKIE, next);
    setLang(next);
  }, []);

  return [lang, change];
}
