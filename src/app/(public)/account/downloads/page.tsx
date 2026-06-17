import { MyDownloadsListClient } from '@/components/downloads/MyDownloadsListClient';

export const metadata = {
  title: 'My downloads',
  robots: { index: false, follow: false },
};

export default function MyDownloadsPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My downloads</h1>
        <p className="mt-2 text-muted-foreground">
          View your download history and access your rendered invitation videos.
        </p>
      </div>
      <MyDownloadsListClient />
    </div>
  );
}
