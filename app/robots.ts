import type { MetadataRoute } from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Only the marketing pages are meant for search engines. Birthday pages
// (/b, /wish) carry personal content and also send noindex themselves.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/b/', '/wish/', '/dashboard', '/editor', '/api/', '/auth/'],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
