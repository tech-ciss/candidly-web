import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/account',
        '/login',
        '/register',
        '/verify-email',
        '/forgot-password',
        '/reset-password',
      ],
    },
  };
}
