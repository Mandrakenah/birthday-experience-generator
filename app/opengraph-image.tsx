import { ImageResponse } from 'next/og';

export const alt = 'Birthday Experience — cinematic birthday surprises';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Link-preview card for the marketing site.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 55%, #fce7f3 100%)',
          color: '#0f172a',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700, color: '#7c3aed', display: 'flex' }}>
          Birthday Experience
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginTop: 24, display: 'flex' }}>
          Give them a birthday they can step into
        </div>
        <div style={{ fontSize: 34, color: '#475569', marginTop: 28, display: 'flex' }}>
          Photos · music · friends&apos; wishes · candles they blow out · fireworks
        </div>
      </div>
    ),
    size
  );
}
