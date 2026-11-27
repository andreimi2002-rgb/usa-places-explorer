"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page py-20" role="alert">
      <p className="eyebrow">Error</p>
      <h1 className="mt-2 text-4xl">Something went wrong</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        The page could not be loaded. In database mode this usually means PostgreSQL is not running or DATABASE_READER_URL is wrong.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted">digest {error.digest}</p>}
      <button type="button" onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
