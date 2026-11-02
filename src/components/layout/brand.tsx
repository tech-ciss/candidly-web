import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Candidly — accueil">
      <span className="brand-mark">
        <ArrowUpRight aria-hidden="true" size={24} />
      </span>
      Candidly<span className="brand-dot">.</span>
    </Link>
  );
}
