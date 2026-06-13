import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { footerLegal, primaryNav } from '@/config/navigation';
import { appConfig } from '@/config/app.config';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-muted/30">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" /> {appConfig.name}
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{appConfig.description}</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {primaryNav.map((it) => (
              <li key={it.href}>
                <Link href={it.href} className="hover:text-foreground">{it.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {footerLegal.map((it) => (
              <li key={it.href}>
                <Link href={it.href} className="hover:text-foreground">{it.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {appConfig.name}. All rights reserved.</p>
          <p>Made with care for India’s biggest celebrations.</p>
        </div>
      </div>
    </footer>
  );
}
