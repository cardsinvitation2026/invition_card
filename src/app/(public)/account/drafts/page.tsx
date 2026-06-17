import { MyDraftsListClient } from '@/components/drafts/MyDraftsListClient';

export const metadata = {
  title: 'My drafts',
  robots: { index: false, follow: false },
};

export default function MyDraftsPage() {
  return (
    <div className="container py-8">
      <MyDraftsListClient />
    </div>
  );
}
