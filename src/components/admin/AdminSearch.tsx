'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function AdminSearch({
  value,
  onChange,
  placeholder = 'Search…',
  'aria-label': ariaLabel = 'Search',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
}) {
  return (
    <div className="relative max-w-sm flex-1">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label={ariaLabel}
      />
    </div>
  );
}
