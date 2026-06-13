'use client';
import { useEffect } from 'react';
import { ErrorState } from '@/components/feedback/ErrorState';

export default function PublicError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container py-16">
      <ErrorState description={error.message} onRetry={reset} />
    </div>
  );
}
