'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
export function ActiveLink({
  href,
  children,
  section = false,
}: {
  href: string;
  children: ReactNode;
  section?: boolean;
}) {
  const pathname = usePathname();
  const current =
    pathname === href || (section && pathname.startsWith(href + '/'));
  return (
    <Link href={href} aria-current={current ? 'page' : undefined}>
      {children}
    </Link>
  );
}
