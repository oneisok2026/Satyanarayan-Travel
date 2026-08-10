'use client';

/**
 * Last-resort boundary for failures in the root layout itself.
 * It must render its own <html>/<body> because the layout has failed,
 * and cannot rely on globals.css having loaded — hence inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          background: '#fdfcfa',
          color: '#2b2926',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            Something went wrong
          </h1>
          <p style={{ lineHeight: 1.6, color: '#6b6862', marginBottom: '1.5rem' }}>
            The application failed to load. Please refresh the page.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#a3a099', marginBottom: '1.5rem' }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: '#c2562f',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.75rem 1.75rem',
              fontSize: '0.9375rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
