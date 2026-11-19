import { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/messages/',
          '/inquiries/',
          '/profile/',
          '/checkout/',
          '/payment/',
          '/account/',
          '/agreements/',
          '/bookings/',
          '/disputes/',
          '/favorites/',
          '/receipts/',
          '/saved-searches/',
          '/*?*minRent=*',
          '/*?*maxRent=*',
          '/*?*sortBy=*',
        ],
      },
      {
        userAgent: ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Bingbot'],
        allow: ['/', '/properties/', '/rentals/', '/areas/', '/guides/'],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/messages/',
          '/inquiries/',
          '/profile/',
          '/checkout/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
