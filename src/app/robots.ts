import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/admin', '/dashboard', '/api', '/checkout', '/account', '/drafts'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
