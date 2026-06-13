'use client';

import { Languages } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/language';

export function LanguageSwitcher() {
  const [lang, setLang] = useLanguage();
  return (
    <Select value={lang} onValueChange={(v) => setLang(v as LanguageCode)}>
      <SelectTrigger className="h-8 w-[120px] gap-2 text-xs" aria-label="Select language">
        <Languages className="size-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code} className="text-xs">
            {l.native}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
