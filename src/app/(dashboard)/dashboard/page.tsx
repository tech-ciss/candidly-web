import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  MessageCircle,
  CalendarDays,
  Building2,
  ArrowRight,
  Circle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DemoApplications } from '@/components/shared/demo-applications';
import { StateDemo } from '@/components/shared/state-demo';
export const metadata: Metadata = {
  title: 'Dashboard de démonstration',
  robots: { index: false, follow: false },
};
export default function DashboardPage() {
  return (
    <>
      <div className="demo-banner">
        <span>
          <strong>Vous explorez une démonstration.</strong> Toutes les
          entreprises, candidatures et actions présentées sont fictives.
        </span>
        <Badge variant="outline">Aucun compte requis</Badge>
      </div>
      <div className="dashboard-title">
        <div>
          <h1>
            Faites place à la suite<span className="blue-text">.</span>
          </h1>
          <p>Un aperçu clair de vos démarches et de vos prochaines étapes.</p>
        </div>
        <span className="period-label">
          Vue d’ensemble <ArrowUpRight size={16} aria-hidden="true" />
        </span>
      </div>
      <div className="stats-grid">
        {[
          {
            label: 'Candidatures',
            value: '24',
            note: '+4 ce mois-ci',
            icon: BriefcaseBusiness,
            tone: 'blue',
          },
          {
            label: 'Réponses reçues',
            value: '06',
            note: 'Des échanges à poursuivre',
            icon: MessageCircle,
            tone: 'green',
          },
          {
            label: 'Entretiens',
            value: '03',
            note: 'De nouvelles perspectives',
            icon: CalendarDays,
            tone: 'amber',
          },
          {
            label: 'Entreprises suivies',
            value: '12',
            note: 'Un réseau qui se construit',
            icon: Building2,
            tone: 'slate',
          },
        ].map((s) => (
          <Card key={s.label} className="stat-card">
            <CardContent>
              <div className="stat-top">
                <span>{s.label}</span>
                <s.icon size={18} aria-hidden="true" />
              </div>
              <strong className="stat-value">{s.value}</strong>
              <p
                className={
                  'stat-note ' + (s.tone === 'blue' ? 'blue-text' : '')
                }
              >
                {s.note}
              </p>
              <span className="stat-fiction">Statistique fictive</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="dashboard-columns">
        <DemoApplications />
        <section
          id="prochaines-actions"
          className="panel actions-panel"
          aria-labelledby="actions-title"
        >
          <div className="panel-heading">
            <div>
              <h2 id="actions-title">La prochaine étape</h2>
              <p>Deux exemples, pour garder le cap.</p>
            </div>
            <ArrowUpRight size={20} aria-hidden="true" />
          </div>
          <div className="action-item">
            <span className="action-day">
              <strong>12</strong>NOV.
            </span>
            <div>
              <Badge className="tone-blue">Entretien fictif</Badge>
              <h3>Préparer la rencontre</h3>
              <p>Atelier Horizon</p>
              <small>Exemple, 10 h 00</small>
            </div>
          </div>
          <div className="action-item">
            <span className="action-day">
              <strong>14</strong>NOV.
            </span>
            <div>
              <Badge variant="secondary">Relance fictive</Badge>
              <h3>Reprendre contact</h3>
              <p>Nova Studio</p>
              <small>Exemple, À votre rythme</small>
            </div>
          </div>
          <div className="action-reminder">
            <Circle size={16} aria-hidden="true" />
            <p>
              Rien n’est planifié réellement.
              <br />
              Ces actions illustrent le futur espace.
            </p>
          </div>
        </section>
      </div>
      <section className="dashboard-callout">
        <span className="callout-icon">
          <ArrowUpRight size={25} aria-hidden="true" />
        </span>
        <div>
          <h2>Une carrière, bien plus que des candidatures.</h2>
          <p>
            Des pistes, des rencontres, des étapes. Un seul endroit pour garder
            le fil.
          </p>
        </div>
        <Link href="/#approche">
          L’approche Candidly <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
      <StateDemo />
    </>
  );
}
