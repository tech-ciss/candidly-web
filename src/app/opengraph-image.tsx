import { ImageResponse } from 'next/og';
export const alt = 'Candidly — Chaque candidature compte.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: '#172554',
        color: 'white',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '90px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ fontSize: 34, color: '#93c5fd', marginBottom: 45 }}>
        CANDIDLY ↗
      </div>
      <div style={{ fontSize: 80, fontWeight: 700, lineHeight: 1.1 }}>
        Chaque candidature
      </div>
      <div style={{ fontSize: 80, fontWeight: 700, lineHeight: 1.1 }}>
        compte.
      </div>
      <div style={{ fontSize: 25, color: '#cbd5e1', marginTop: 40 }}>
        Votre carrière avance. Votre organisation aussi.
      </div>
    </div>,
    size,
  );
}
