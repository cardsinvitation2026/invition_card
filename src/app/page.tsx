export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-2xl space-y-6 text-center">
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Stage 1 / Foundation
        </span>
        <h1 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          My Invitations
        </h1>
        <p className="text-balance text-lg text-muted-foreground">
          Architecture initialized. Next.js 15 · TypeScript · Tailwind · shadcn/ui · Prisma ·
          Zustand · React Hook Form · Zod · Vitest.
        </p>
        <p className="text-xs text-muted-foreground">
          No business features implemented yet. Awaiting Stage 2 approval.
        </p>
      </div>
    </main>
  );
}
