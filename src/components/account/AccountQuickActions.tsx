import Link from 'next/link';
import { FileText, Download, CreditCard, Clapperboard, Crown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const actions = [
  {
    label: 'Create draft',
    href: '/templates',
    icon: Plus,
    description: 'Browse templates',
  },
  {
    label: 'View drafts',
    href: '/account/drafts',
    icon: FileText,
    description: 'Manage your drafts',
  },
  {
    label: 'View downloads',
    href: '/account/downloads',
    icon: Download,
    description: 'Download history',
  },
  {
    label: 'Membership plans',
    href: '/membership',
    icon: Crown,
    description: 'Purchase or renew',
  },
  {
    label: 'Render history',
    href: '/account/renders',
    icon: Clapperboard,
    description: 'Video renders',
  },
  {
    label: 'Purchases',
    href: '/account/purchases',
    icon: CreditCard,
    description: 'Order history',
  },
];

export function AccountQuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Jump to common tasks across your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <Button key={action.href} asChild variant="outline" className="h-auto justify-start p-4">
              <Link href={action.href}>
                <action.icon className="mr-3 size-5 shrink-0 text-primary" />
                <span className="text-left">
                  <span className="block font-medium">{action.label}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {action.description}
                  </span>
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
