import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/profile',
          '/settings',
          '/sell',
          '/cart',
          '/checkout',
          '/order-confirmation',
          '/orders',
          '/offers',
          '/messages',
          '/notifications',
          '/favourites',
          '/listings/*/edit',
        ],
      },
    ],
    sitemap: 'https://www.mulligans.uk.com/sitemap.xml',
  };
}
