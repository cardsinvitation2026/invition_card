'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { CategoryWithCount } from '@/types/category';

interface Props {
  categories: CategoryWithCount[];
  showCategory?: boolean;
}

export function TemplateFilterBar({ categories, showCategory = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(sp.get('search') ?? '');

  useEffect(() => {
    setSearch(sp.get('search') ?? '');
  }, [sp]);

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === '' || v === 'all') next.delete(k);
        else next.set(k, v);
      }
      next.delete('page'); // reset pagination on any filter change
      startTransition(() => router.replace(`${pathname}?${next.toString()}`));
    },
    [router, pathname, sp],
  );

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    update({ search: search || null });
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <form onSubmit={onSearchSubmit} className="relative w-full md:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates"
          className="pl-9 pr-9"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
            onClick={() => {
              setSearch('');
              update({ search: null });
            }}
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {showCategory && (
          <Select
            value={sp.get('categorySlug') ?? 'all'}
            onValueChange={(v) => update({ categorySlug: v === 'all' ? null : v })}
          >
            <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={sp.get('type') ?? 'all'} onValueChange={(v) => update({ type: v === 'all' ? null : v })}>
          <SelectTrigger className="h-9 w-[120px] text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All formats</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="PDF_SINGLE">PDF</SelectItem>
            <SelectItem value="PDF_MULTI">PDF Set</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sp.get('language') ?? 'all'} onValueChange={(v) => update({ language: v === 'all' ? null : v })}>
          <SelectTrigger className="h-9 w-[120px] text-xs"><SelectValue placeholder="Language" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            <SelectItem value="EN">English</SelectItem>
            <SelectItem value="HI">हिंदी</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sp.get('sort') ?? 'featured'} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="popular">Best sellers</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
