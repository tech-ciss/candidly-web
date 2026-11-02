import { ArrowUpRight, Check, Circle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { applications } from './demo-data';
export function ProductPreview() {
  return (
    <div className="preview-stage">
      <div className="product-preview">
        <div className="preview-chrome">
          <span className="window-dots">
            <i />
            <i />
            <i />
          </span>
          <span>Candidly / Mon espace</span>
          <Badge variant="secondary">Démo</Badge>
        </div>
        <div className="preview-body">
          <div className="preview-heading">
            <span className="eyebrow">VOTRE PROCHAIN CHAPITRE</span>
            <Sparkles size={19} aria-hidden="true" />
            <h3>Chaque piste mérite sa place.</h3>
            <p>Une vue d’ensemble. L’esprit plus libre.</p>
          </div>
          <div className="preview-stats">
            <div>
              <span>Candidatures</span>
              <strong>
                24 <small>+4 ce mois-ci</small>
              </strong>
            </div>
            <div>
              <span>Entretiens</span>
              <strong>
                03 <ArrowUpRight size={20} aria-hidden="true" />
              </strong>
            </div>
          </div>
          <div className="preview-list">
            <p className="mini-heading">
              DERNIÈRES CANDIDATURES <span>Fictives</span>
            </p>
            {applications.slice(0, 3).map((a) => (
              <div className="preview-row" key={a.company}>
                <span className={'company-logo tone-' + a.tone}>
                  {a.initials}
                </span>
                <div>
                  <strong>{a.company}</strong>
                  <small>{a.role}</small>
                </div>
                <span className={'mini-status tone-' + a.tone}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="preview-note">
        <span>
          <Check size={17} aria-hidden="true" />
        </span>
        <div>
          <strong>Une prochaine étape, toujours en vue.</strong>
          <small>Relance fictive · Atelier Horizon</small>
        </div>
        <Circle size={17} aria-hidden="true" />
      </div>
      <p className="preview-caption">
        Aperçu illustratif · données de démonstration
      </p>
    </div>
  );
}
