import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Layers3,
  UsersRound,
  Compass,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { ProductPreview } from '@/components/shared/product-preview';
export default function HomePage() {
  return (
    <main id="main-content">
      <section className="hero container">
        <div className="hero-copy">
          <h1>
            Chaque candidature
            <br />
            compte<span className="blue-text">.</span>
          </h1>
          <p className="hero-lead">
            Moins de pistes éparpillées.
            <br />
            Plus de place pour votre avenir.
          </p>
          <p className="hero-description">
            Candidly rassemble vos candidatures et vos relations
            professionnelles dans un espace simple. Pour avancer avec clarté, à
            votre rythme.
          </p>
          <div className="hero-actions">
            <Link className={buttonVariants({ size: 'lg' })} href="/register">
              Créer mon espace gratuitement <ArrowUpRight aria-hidden="true" />
            </Link>
            <a href="#approche" className="text-link">
              Comprendre l’approche <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <p className="demo-hint">
            <Link href="/dashboard">Explorer la démo sans inscription</Link>
            <span>Données fictives</span>
          </p>
        </div>
        <div id="apercu">
          <ProductPreview />
        </div>
      </section>
      <section className="principles-strip">
        <div className="container">
          <span>
            Un peu d’ordre.
            <br />
            <strong>Beaucoup de perspectives.</strong>
          </span>
          <p>Vos démarches, au même endroit.</p>
          <p>Vos relations, dans la durée.</p>
          <p>Votre prochaine étape, en vue.</p>
        </div>
      </section>
      <section className="approach container" id="approche">
        <div className="section-heading">
          <div>
            <h2>
              De la première piste
              <br />
              au prochain chapitre.
            </h2>
          </div>
          <p>
            La recherche d’emploi a déjà ses défis.
            <br />
            L’organisation ne devrait pas en être un.
          </p>
        </div>
        <div className="value-grid">
          {[
            {
              icon: Layers3,
              n: '01',
              title: 'Tout retrouver simplement.',
              text: 'Entreprises, candidatures et documents : vos dossiers au même endroit.',
            },
            {
              icon: UsersRound,
              n: '02',
              title: 'Garder le fil des relations.',
              text: 'Retrouvez vos échanges et entretenez vos contacts professionnels.',
            },
            {
              icon: Compass,
              n: '03',
              title: 'Voir la prochaine action.',
              text: 'Relance, rendez-vous ou suivi : sachez quelle étape préparer.',
            },
          ].map((v) => (
            <article key={v.n} className="value-card">
              <div className="value-top">
                <v.icon size={24} aria-hidden="true" />
              </div>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="closing-section container">
        <div>
          <h2>
            Faites de la place
            <br />à la suite.
          </h2>
          <p>Explorez l’interface. Imaginez votre prochain chapitre.</p>
        </div>
        <Link className={buttonVariants({ size: 'lg' })} href="/dashboard">
          Explorer la démonstration <ArrowUpRight aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
