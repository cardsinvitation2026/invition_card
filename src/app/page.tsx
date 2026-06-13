// Stage-3 home page: pretty landing + auth status. No business features yet.
import Link from 'next/link';
import { Sparkles, ShieldCheck, KeyRound, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Badge } from '@/components/ui/badge';
import { getServerSession } from '@/lib/auth/server';
import {
  hasDatabaseUrl,
  hasFirebaseAdminConfig,
  hasFirebaseClientConfig,
  isAuthDevModeServer,
} from '@/lib/auth/dev-mode';

function IntegrationRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2 text-sm">
      <span>{label}</span>
      <Badge variant={ok ? 'default' : 'secondary'} className={ok ? '' : 'opacity-70'}>
        {ok ? 'configured' : 'placeholder'}
      </Badge>
    </li>
  );
}

export default async function HomePage() {
  const session = await getServerSession();
  return (
    <>
      <SiteHeader />
      <main className="container py-14">
        <section className="mx-auto max-w-3xl space-y-6 text-center">
          <Badge variant="outline">Stage 3 · Authentication</Badge>
          <h1 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            My Invitations
          </h1>
          <p className="text-balance text-lg text-muted-foreground">
            Architecture for auth, sessions, roles and middleware is in place. Drop in your Firebase
            + Neon credentials whenever you are ready — nothing in the UI changes.
          </p>
          <div className="flex justify-center gap-3">
            {session ? (
              <Button asChild size="lg">
                <Link href="/dashboard">
                  <Sparkles className="mr-2 size-4" /> Go to dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href="/login">
                  <KeyRound className="mr-2 size-4" /> Sign in
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline">
              <Link href="/templates">Browse templates</Link>
            </Button>
          </div>
        </section>

        <section className="mt-14 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="space-y-2">
              <ShieldCheck className="size-5 text-primary" />
              <CardTitle className="text-base">Session security</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              HS256 JWT in an HttpOnly cookie. Edge-safe verification in middleware. Firebase
              Admin verifies real Google tokens server-side.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-2">
              <Database className="size-5 text-primary" />
              <CardTitle className="text-base">DB-backed users</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              First login upserts a User row via Prisma. No DATABASE_URL yet? An in-memory store
              keeps the preview alive, swap by setting one env var.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-2">
              <KeyRound className="size-5 text-primary" />
              <CardTitle className="text-base">Role architecture</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <code>USER</code> and <code>SUPER_ADMIN</code> roles flow through the JWT; middleware
              gates <code>/admin</code> automatically.
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto mt-14 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integration status</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <IntegrationRow label="AUTH_DEV_MODE" ok={isAuthDevModeServer()} />
                <IntegrationRow label="PostgreSQL (Neon) DATABASE_URL" ok={hasDatabaseUrl()} />
                <IntegrationRow label="Firebase Web (NEXT_PUBLIC_FIREBASE_*)" ok={hasFirebaseClientConfig()} />
                <IntegrationRow label="Firebase Admin (service account)" ok={hasFirebaseAdminConfig()} />
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
