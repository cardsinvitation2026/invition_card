import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Heart, Play, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { TemplateGrid } from '@/components/templates/TemplateGrid';
import { categoryService } from '@/features/categories';
import { templateService } from '@/features/templates';
import { buildOpenGraph, buildTwitter } from '@/config/seo';
import { appConfig } from '@/config/app.config';

export const revalidate = 60;

export const metadata: Metadata = {
  title: `${appConfig.name} — AI-animated invitations for every celebration`,
  description: appConfig.description,
  openGraph: buildOpenGraph({ title: appConfig.name, description: appConfig.description }),
  twitter: buildTwitter({ title: appConfig.name, description: appConfig.description }),
};

const HERO_IMG =
  'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjB3ZWRkaW5nJTIwY2VsZWJyYXRpb258ZW58MHx8fHwxNzgxMzU5ODMwfDA&ixlib=rb-4.1.0&q=85';

export default async function HomePage() {
  const [categories, featured, trending] = await Promise.all([
    categoryService.listActive(),
    templateService.featured(6),
    templateService.trending(6),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMG} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="container relative py-20 md:py-28">
          <div className="max-w-2xl space-y-6">
            <Badge variant="outline" className="bg-background/70 backdrop-blur">
              <Sparkles className="mr-1 size-3" /> Premium animated invitations
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Invitations as beautiful as the
              <span className="block bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 bg-clip-text text-transparent">
                celebration itself.
              </span>
            </h1>
            <p className="max-w-xl text-balance text-lg text-muted-foreground">
              Pick a template, personalise it in minutes, and share a video invitation your family
              will never forget. Weddings, engagements, birthdays, anniversaries and Griha Pravesh.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/templates">
                  Browse templates <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-background/70 backdrop-blur">
                <Link href="/categories">Explore categories</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Browse by occasion</h2>
            <p className="mt-1 text-sm text-muted-foreground">Crafted templates for every kind of celebration.</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/categories">All categories <ArrowRight className="ml-1 size-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      {/* Featured templates */}
      <section className="container py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Featured templates</h2>
            <p className="mt-1 text-sm text-muted-foreground">Hand-picked by our design team.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/templates?featured=true">See all <ArrowRight className="ml-1 size-4" /></Link>
          </Button>
        </div>
        <TemplateGrid items={featured} />
      </section>

      {/* Trending */}
      <section className="container py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Trending now</h2>
            <p className="mt-1 text-sm text-muted-foreground">Loved by families this season.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/templates?trending=true">See all <ArrowRight className="ml-1 size-4" /></Link>
          </Button>
        </div>
        <TemplateGrid items={trending} />
      </section>

      {/* Value props */}
      <section className="container py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <ValueCard icon={<Wand2 className="size-5" />} title="Personalise in minutes" body="Type your details, drop in a photo, done. No design skills required." />
          <ValueCard icon={<Play className="size-5" />} title="HD video output" body="Beautiful 1080p video invitations rendered in the cloud, ready to share." />
          <ValueCard icon={<Heart className="size-5" />} title="Made for India" body="Hindi + English templates with culturally authentic designs." />
        </div>
      </section>

      {/* CTA strip */}
      <section className="container my-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-amber-500 to-rose-600 p-10 text-white shadow-xl">
          <h3 className="text-2xl font-semibold md:text-3xl">Ready to invite the world?</h3>
          <p className="mt-2 max-w-xl text-white/90">Sign in to save drafts, personalise templates and download in HD.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">Get started — it’s free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link href="/templates">Browse templates</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function ValueCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
