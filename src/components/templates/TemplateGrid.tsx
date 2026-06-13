import { TemplateCard } from './TemplateCard';
import type { TemplateListItem } from '@/types/template';

export function TemplateGrid({ items }: { items: TemplateListItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((t) => (
        <TemplateCard key={t.id} template={t} />
      ))}
    </div>
  );
}
