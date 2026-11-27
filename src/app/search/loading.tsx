export default function Loading() {
  return (
    <div className="container-page py-10" role="status" aria-live="polite">
      <div className="h-8 w-64 animate-pulse rounded bg-navy-800" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-[var(--radius-card)] bg-navy-850" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
