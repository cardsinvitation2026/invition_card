import { LoadingGrid } from '@/components/feedback/LoadingGrid';
export default function Loading() {
  return (
    <div className="container py-10">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
      <LoadingGrid />
    </div>
  );
}
