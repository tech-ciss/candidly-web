'use client';
import { useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { applications } from './demo-data';
import { InterfaceState } from './interface-state';
export function DemoApplications() {
  const [query, setQuery] = useState('');
  const visible = applications.filter((a) =>
    (a.company + ' ' + a.role)
      .toLocaleLowerCase('fr')
      .includes(query.toLocaleLowerCase('fr')),
  );
  return (
    <section
      id="candidatures"
      className="panel applications-panel"
      aria-labelledby="applications-title"
    >
      <div className="panel-heading">
        <div>
          <h2 id="applications-title">Vos candidatures</h2>
          <p>Des pistes à cultiver, un pas après l’autre.</p>
        </div>
        <Badge variant="secondary">Données fictives</Badge>
      </div>
      <div className="search-wrap">
        <Search size={17} aria-hidden="true" />
        <label className="sr-only" htmlFor="demo-search">
          Rechercher dans les candidatures fictives
        </label>
        <Input
          id="demo-search"
          placeholder="Rechercher dans la démo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="search-note">{visible.length} exemples</span>
      </div>
      <div className="application-columns" aria-hidden="true">
        <span>Entreprise et poste</span>
        <span>Statut</span>
        <span>Dernière activité</span>
      </div>
      <ul className="application-list">
        {visible.map((a) => (
          <li key={a.company}>
            <div className={'company-logo tone-' + a.tone}>{a.initials}</div>
            <div className="application-name">
              <strong>{a.company}</strong>
              <p>{a.role}</p>
              <small>{a.kind}</small>
            </div>
            <Badge className={'status-badge tone-' + a.tone}>{a.status}</Badge>
            <span className="application-date">{a.date}</span>
            <ArrowUpRight size={17} className="row-arrow" aria-hidden="true" />
          </li>
        ))}
      </ul>
      {!visible.length && <InterfaceState status="empty" />}
      <div className="panel-footer">
        <span>4 candidatures fictives · aucune donnée enregistrée</span>
        <span className="live-dot">Aperçu local</span>
      </div>
    </section>
  );
}
