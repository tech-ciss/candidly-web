// Données entièrement fictives, réservées à la présentation. Aucun appel API.
export const applications = [
  {
    company: 'Atelier Horizon',
    initials: 'AH',
    role: 'Product designer',
    kind: 'Candidature spontanée',
    status: 'Entretien',
    tone: 'blue',
    date: '12 nov. — exemple',
  },
  {
    company: 'Nova Studio',
    initials: 'NS',
    role: 'Chargé de communication',
    kind: 'Réponse à une offre',
    status: 'En attente',
    tone: 'amber',
    date: '10 nov. — exemple',
  },
  {
    company: 'Kora Lab',
    initials: 'KL',
    role: 'Chef de projet junior',
    kind: 'Candidature spontanée',
    status: 'Envoyée',
    tone: 'green',
    date: '08 nov. — exemple',
  },
  {
    company: 'Maison Écho',
    initials: 'MÉ',
    role: 'Business developer',
    kind: 'Réponse à une offre',
    status: 'À préparer',
    tone: 'slate',
    date: '06 nov. — exemple',
  },
] as const;
