import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CategoryWithCount } from '@/types/category';

export function CategoryCard({ category }: { category: CategoryWithCount }) {
  return (
    <Link href={`/categories/${category.slug}`} className="group block">
      <Card className="relative overflow-hidden border-border/60 transition hover:shadow-xl">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {category.thumbnail && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={category.thumbnail}
              alt={category.name}
              className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-xl font-semibold">{category.name}</h3>
                <p className="text-xs text-white/80">{category.templateCount} templates</p>
              </div>
              <Badge variant="secondary" className="gap-1 bg-white/20 text-white backdrop-blur">
                Browse <ArrowRight className="size-3" />
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
