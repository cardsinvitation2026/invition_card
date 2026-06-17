import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'destructive' | 'muted';

const VARIANTS: Record<Variant, string> = {
  default: '',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  destructive: 'border-red-200 bg-red-50 text-red-800',
  muted: 'border-muted bg-muted text-muted-foreground',
};

export function AdminStatusBadge({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: Variant;
}) {
  return (
    <Badge variant="outline" className={cn('font-normal', VARIANTS[variant])}>
      {label}
    </Badge>
  );
}
