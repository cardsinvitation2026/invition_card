'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { openMembershipCheckout } from '@/lib/payments/checkout';

interface MembershipCheckoutButtonProps {
  planId: string;
  planName: string;
  onComplete: () => void;
}

export function MembershipCheckoutButton({
  planId,
  planName,
  onComplete,
}: MembershipCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await openMembershipCheckout({
        planId,
        planName,
        onSuccess: () => {
          toast.success('Membership activated successfully');
          onComplete();
        },
        onError: (message) => {
          if (message !== 'Payment cancelled') {
            toast.error(message);
          }
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button className="w-full" onClick={() => void handleClick()} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Processing…
        </>
      ) : (
        'Buy now'
      )}
    </Button>
  );
}
