// Language helpers — architecture for EN/HI switch. No translation strings yet.
export type LanguageCode = 'EN' | 'HI';

export const LANGUAGE_COOKIE = 'mi_lang';
export const DEFAULT_LANGUAGE: LanguageCode = 'EN';
export const SUPPORTED_LANGUAGES: ReadonlyArray<{ code: LanguageCode; label: string; native: string }> = [
  { code: 'EN', label: 'English', native: 'English' },
  { code: 'HI', label: 'Hindi', native: 'हिन्दी' },
];

export function isLanguageCode(v: unknown): v is LanguageCode {
  return v === 'EN' || v === 'HI';
}

export function normaliseLanguage(v: unknown): LanguageCode {
  return isLanguageCode(v) ? v : DEFAULT_LANGUAGE;
}
