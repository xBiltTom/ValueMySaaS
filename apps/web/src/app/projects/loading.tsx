export default function ProjectsLoading() {
  return (
    <div className="animate-pulse mx-auto w-full max-w-7xl px-4 py-6 pb-28 md:px-8 lg:py-8 lg:pb-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <div className="h-5 w-24 rounded-full bg-muted" />
          <div className="h-10 w-52 rounded-xl bg-muted" />
        </div>
        <div className="h-12 w-40 rounded-xl bg-muted" />
      </div>

      {/* Project cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-6 w-36 rounded-lg bg-muted" />
                <div className="h-4 w-full rounded-full bg-muted" />
                <div className="h-4 w-3/4 rounded-full bg-muted" />
              </div>
              <div className="h-6 w-16 rounded-full bg-muted shrink-0" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-muted" />
              <div className="h-6 w-20 rounded-full bg-muted" />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="h-6 w-24 rounded-lg bg-muted" />
              <div className="h-4 w-20 rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
