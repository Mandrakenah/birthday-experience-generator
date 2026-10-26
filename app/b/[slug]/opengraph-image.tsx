import { ImageResponse } from 'next/og';
import { getPublishedProject } from '@/lib/data/experience';

export const alt = 'A birthday surprise';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Link-preview card for chat apps. Shows only the recipient's name — never
// photos or messages, which would spoil the surprise in the preview.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  const name = project?.recipient?.trim();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fce7f3 0%, #ede9fe 50%, #ffe4e6 100%)',
          color: '#581c87',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 120, display: 'flex' }}>
          <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M12 8v13" />
            <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 12 5.5 12 8c0-2.5 2.5-5 4.5-5a2.5 2.5 0 0 1 0 5" />
          </svg>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, marginTop: 24, display: 'flex', textAlign: 'center', padding: '0 60px' }}>
          {name ? `Happy Birthday, ${name}!` : 'A birthday surprise'}
        </div>
        <div style={{ fontSize: 36, marginTop: 20, color: '#7e22ce', display: 'flex' }}>
          Someone made something special for you
        </div>
      </div>
    ),
    size
  );
}
