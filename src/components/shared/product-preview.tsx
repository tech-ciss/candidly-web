import { Badge } from '@/components/ui/badge';
import { applications } from './demo-data';
export function ProductPreview() {
  const dossier = applications[0];
  return (
    <section className="preview-stage" aria-labelledby="preview-title">
      <div className="preview-title">
        <span>Candidly / Mon espace</span>
      </div>
      <div className="preview-heading">
        <h2 id="preview-title">Le fil d’une candidature</h2>
        <p>Un dossier, ses échanges, sa prochaine action.</p>
      </div>
      <div className="preview-dossier">
        <div>
          <strong>{dossier.company}</strong>
          <p>{dossier.role}</p>
        </div>
        <Badge variant="outline" className={'tone-' + dossier.tone}>
          {dossier.status}
        </Badge>
      </div>
      <h3 className="preview-thread-title">Le fil des échanges fictifs</h3>
      <ol className="preview-thread">
        <li>
          <time dateTime="2026-11-18">18 nov.</time>
          <span>Candidature envoyée</span>
        </li>
        <li>
          <time dateTime="2026-11-19">19 nov.</time>
          <span>Premier échange RH</span>
        </li>
      </ol>
      <div className="preview-note">
        <h3>Prochaine action fictive</h3>
        <strong>Relancer le contact RH</strong>
        <p>
          <time dateTime="2026-11-24">24 novembre</time>, exemple de suivi
        </p>
      </div>
      <div className="preview-stats" aria-label="Statistiques fictives">
        <div>
          <span>Candidatures</span>
          <strong>24</strong>
          <small>+4 ce mois-ci</small>
        </div>
        <div>
          <span>Entretiens</span>
          <strong>03</strong>
        </div>
      </div>
      <p className="preview-caption">
        Données et dates fictives. Illustration du futur CRM, sans donnée
        utilisateur réelle.
      </p>
    </section>
  );
}
