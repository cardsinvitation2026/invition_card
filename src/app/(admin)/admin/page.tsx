import Link from 'next/link';
import { FolderOpen, FileImage, ListTree, Music } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { adminRoutes } from '@/lib/admin/routes';

const SECTIONS = [
  {
    href: adminRoutes.categories,
    title: 'Categories',
    description: 'Manage invitation categories and SEO metadata.',
    icon: FolderOpen,
  },
  {
    href: adminRoutes.templates,
    title: 'Templates',
    description: 'Create and publish invitation templates.',
    icon: FileImage,
  },
  {
    href: adminRoutes.templateFields,
    title: 'Template Fields',
    description: 'Configure dynamic fields per template.',
    icon: ListTree,
  },
  {
    href: adminRoutes.templateMusic,
    title: 'Template Music',
    description: 'Manage background music library.',
    icon: Music,
  },
] as const;

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Welcome to the My Invitations admin panel."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="block transition-opacity hover:opacity-90">
              <Card>
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{s.title}</CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-primary">Open →</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
