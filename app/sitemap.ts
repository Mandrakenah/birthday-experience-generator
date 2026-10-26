import type { MetadataRoute } from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: appUrl, changeFrequency: 'monthly', priority: 1 },
    { url: `${appUrl}/signup`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${appUrl}/login`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
