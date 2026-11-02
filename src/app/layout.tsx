import type { Metadata, Viewport } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@/styles/globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'Candidly — Chaque candidature compte.',
    template: '%s | Candidly',
  },
  description:
    'Un espace clair pour organiser vos candidatures, entretenir vos relations professionnelles et préparer votre prochaine étape.',
  applicationName: 'Candidly',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Candidly' },
  openGraph: {
    title: 'Candidly — Chaque candidature compte.',
    description: 'Votre carrière avance. Votre organisation aussi.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Candidly',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Candidly — Chaque candidature compte.',
      },
    ],
  },
};
export const viewport: Viewport = {
  themeColor: '#172554',
  width: 'device-width',
  initialScale: 1,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <a className="skip-link" href="#main-content">
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
