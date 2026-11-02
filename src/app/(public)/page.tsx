import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Layers3,
  UsersRound,
  Compass,
  Check,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductPreview } from '@/components/shared/product-preview';
export default function HomePage() {
  return (
    <main id="main-content">
      <section className="hero container">
        <div className="hero-copy">
          <Badge variant="outline">
            <span className="blue-dot" /> VOTRE CARRIÈRE, AVEC INTENTION
          </Badge>
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
            <Link className={buttonVariants({ size: 'lg' })} href="/dashboard">
              Découvrir mon futur espace <ArrowUpRight aria-hidden="true" />
            </Link>
            <a href="#approche" className="text-link">
              Comprendre l’approche <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <p className="demo-hint">
            <Check size={14} aria-hidden="true" /> Démonstration libre · sans
            inscription · données fictives
          </p>
        </div>
        <div id="apercu">
          <ProductPreview />
        </div>
      </section>
      <section className="principles-strip">
        <div className="container">
          <span>
            UN PEU D’ORDRE.
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
            <p className="eyebrow">UNE DÉMARCHE PLUS SEREINE</p>
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
              title: 'Tout retrouver. Simplement.',
              text: 'Entreprises, candidatures et documents : une place pour chaque élément de votre parcours.',
            },
            {
              icon: UsersRound,
              n: '02',
              title: 'Des relations qui durent.',
              text: 'Gardez le fil de vos échanges et donnez du sens à votre réseau professionnel.',
            },
            {
              icon: Compass,
              n: '03',
              title: 'Savoir quel pas faire ensuite.',
              text: 'Une vue claire des prochaines actions pour avancer sans laisser une piste de côté.',
            },
          ].map((v) => (
            <article key={v.n} className="value-card">
              <div className="value-top">
                <v.icon size={24} aria-hidden="true" />
                <span>{v.n}</span>
              </div>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="closing-section container">
        <div>
          <p className="eyebrow">L’AVENIR SE PRÉPARE, PAS À PAS</p>
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
