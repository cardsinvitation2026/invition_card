import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
}

function buildHref(basePath: string, sp: Record<string, string | string[] | undefined>, nextPage: number) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === 'page') continue;
    if (Array.isArray(v)) v.forEach((vv) => usp.append(k, vv));
    else if (typeof v === 'string') usp.set(k, v);
  }
  if (nextPage > 1) usp.set('page', String(nextPage));
  const qs = usp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function TemplatePagination({ page, pageCount, basePath, searchParams }: Props) {
  if (pageCount <= 1) return null;
  const prev = Math.max(1, page - 1);
  const next = Math.min(pageCount, page + 1);
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button asChild variant="outline" size="sm" disabled={page <= 1}>
        <Link href={buildHref(basePath, searchParams, prev)} aria-label="Previous page">
          <ChevronLeft className="size-4" /> Previous
        </Link>
      </Button>
      <span className="text-xs text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      <Button asChild variant="outline" size="sm" disabled={page >= pageCount}>
        <Link href={buildHref(basePath, searchParams, next)} aria-label="Next page">
          Next <ChevronRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
