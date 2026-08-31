'use client';

// Last-resort boundary for errors thrown in the root layout itself.
// Must render its own <html>/<body> (it replaces the root layout).
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ color: '#6b7280', maxWidth: '24rem' }}>
          The app hit an unexpected error. Please refresh to continue.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            height: '2.75rem',
            padding: '0 1.25rem',
            borderRadius: '0.5rem',
            background: '#9333ea',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
