'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TemplateListItem } from '@/types/template';

export function TemplateCard({ template }: { template: TemplateListItem }) {
  return (
    <Link href={`/templates/${template.slug}`} className="group block">
      <Card className="overflow-hidden border-border/60 transition hover:shadow-xl">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={template.thumbnail}
            alt={template.name}
            className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {template.featured && <Badge className="bg-amber-500 hover:bg-amber-500">Featured</Badge>}
            {template.trending && <Badge className="bg-rose-500 hover:bg-rose-500">Trending</Badge>}
            {template.bestSeller && <Badge className="bg-emerald-500 hover:bg-emerald-500">Best</Badge>}
          </div>
          <Badge variant="outline" className="absolute right-2 top-2 bg-background/80 backdrop-blur">
            {template.type === 'VIDEO' ? 'Video' : template.type === 'PDF_SINGLE' ? 'PDF' : 'PDF Set'}
          </Badge>
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-1 font-medium leading-tight">{template.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {template.category.name} · {template.language === 'HI' ? 'हिंदी' : 'English'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
