export default function ProjectLoading() {
  return (
    <div className="animate-pulse mx-auto w-full max-w-7xl px-4 py-6 pb-28 md:px-8 lg:py-8 lg:pb-12 space-y-8">
      {/* Breadcrumb + title */}
      <div className="space-y-3">
        <div className="h-4 w-36 rounded-full bg-muted" />
        <div className="h-9 w-56 rounded-xl bg-muted" />
      </div>

      {/* Score card + KPI grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-4">
          <div className="h-40 w-40 rounded-full bg-muted" />
          <div className="h-6 w-32 rounded-lg bg-muted" />
          <div className="h-4 w-24 rounded-full bg-muted" />
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="h-3 w-20 rounded-full bg-muted" />
              <div className="h-7 w-16 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* History chart */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-44 rounded-lg bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
      </div>

      {/* Diagnostic lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="h-5 w-32 rounded-lg bg-muted" />
            {[0, 1, 2].map((j) => (
              <div key={j} className="h-14 rounded-xl bg-muted" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
