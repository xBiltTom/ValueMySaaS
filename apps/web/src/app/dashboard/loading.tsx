export default function DashboardLoading() {
  return (
    <div className="animate-pulse mx-auto w-full max-w-7xl px-4 py-6 pb-28 md:px-8 lg:py-8 lg:pb-12 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-5 w-28 rounded-full bg-muted" />
        <div className="h-10 w-80 rounded-xl bg-muted" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded-full bg-muted" />
              <div className="h-9 w-9 rounded-xl bg-muted" />
            </div>
            <div className="h-8 w-24 rounded-lg bg-muted" />
            <div className="h-3 w-32 rounded-full bg-muted" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="h-5 w-44 rounded-lg bg-muted" />
          <div className="h-56 rounded-xl bg-muted" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <div className="h-5 w-36 rounded-lg bg-muted" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-2">
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-4 w-40 rounded-full bg-muted" />
              <div className="h-3 w-full rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 2-col */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="h-5 w-36 rounded-lg bg-muted" />
            {[0, 1].map((j) => (
              <div key={j} className="rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded-full bg-muted" />
                  <div className="h-3 w-24 rounded-full bg-muted" />
                </div>
                <div className="h-6 w-12 rounded-full bg-muted shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
