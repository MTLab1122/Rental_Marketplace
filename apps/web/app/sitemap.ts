import { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/seo';
import { PESHAWAR_LOCALITIES, EDITORIAL_GUIDES } from '../lib/seo-data';
import { getProperties } from '../lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  // 1. Core Static Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/properties`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/guides`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/for-landlords`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/students`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/families`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/referrals`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // 2. Programmatic Locality & Category Hubs
  const localityRoutes: MetadataRoute.Sitemap = [];
  for (const loc of PESHAWAR_LOCALITIES) {
    localityRoutes.push(
      {
        url: `${SITE_URL}/rentals/peshawar/${loc.slug}`,
        lastModified: currentDate,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/rentals/peshawar/${loc.slug}/students`,
        lastModified: currentDate,
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/rentals/peshawar/${loc.slug}/families`,
        lastModified: currentDate,
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/areas/${loc.slug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
    );
  }

  // 3. Editorial AEO Guides
  const guideRoutes: MetadataRoute.Sitemap = EDITORIAL_GUIDES.map((guide) => ({
    url: `${SITE_URL}/guides/${guide.slug}`,
    lastModified: guide.updatedDate || guide.publishedDate || currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 4. Approved & Available Property Pages
  const propertyRoutes: MetadataRoute.Sitemap = [];
  try {
    const propertyResponse = await getProperties({ limit: 200 });
    if (propertyResponse && Array.isArray(propertyResponse.items)) {
      for (const item of propertyResponse.items) {
        // Enforce rule: Only APPROVED and AVAILABLE properties enter sitemap
        const isApproved = (item as any).status ? (item as any).status === 'APPROVED' : true;
        const isAvailable = item.isAvailable !== false;

        if (isApproved && isAvailable) {
          propertyRoutes.push({
            url: `${SITE_URL}/properties/${item.slug || item.id}`,
            lastModified: (item as any).updatedAt || (item as any).createdAt || currentDate,
            changeFrequency: 'daily',
            priority: 0.8,
          });
        }
      }
    }
  } catch {
    // API not reachable during static build or offline mode - safely continue with static sitemap
  }

  return [...staticRoutes, ...localityRoutes, ...guideRoutes, ...propertyRoutes];
}
