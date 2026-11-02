import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
export default function NotFound() {
  return (
    <main id="main-content" className="not-found">
      <p className="eyebrow">404 · UNE AUTRE DIRECTION</p>
      <h1>Cette piste ne mène nulle part.</h1>
      <p>Retrouvez votre chemin depuis l’accueil.</p>
      <Link href="/" className={buttonVariants()}>
        Revenir à l’accueil
      </Link>
    </main>
  );
}
