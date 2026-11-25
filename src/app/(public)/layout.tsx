import { PublicHeader } from '@/components/layout/public-header';
import { Brand } from '@/components/layout/brand';
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      {children}
      <footer className="public-footer">
        <div className="container">
          <Brand />
          <p>Chaque candidature compte.</p>
          <span>
            © {new Date().getFullYear()} Candidly, Démonstration technique
          </span>
        </div>
      </footer>
    </>
  );
}
