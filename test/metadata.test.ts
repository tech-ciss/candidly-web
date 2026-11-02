import { describe, it, expect } from 'vitest';
import manifest from '@/app/manifest';
import robots from '@/app/robots';
import { metadata } from '@/app/(dashboard)/dashboard/page';
describe('fondation PWA et indexation', () => {
  it('déclare un manifest cohérent avec des icônes adaptées', () => {
    const value = manifest();
    expect(value.start_url).toBe('/');
    expect(value.scope).toBe('/');
    expect(value.display).toBe('standalone');
    expect(value.icons?.map((icon) => icon.sizes)).toEqual([
      '192x192',
      '512x512',
      '512x512',
    ]);
    expect(value.icons?.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });
  it('exclut le dashboard des moteurs', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(robots().rules).toMatchObject({ disallow: '/dashboard' });
  });
});
