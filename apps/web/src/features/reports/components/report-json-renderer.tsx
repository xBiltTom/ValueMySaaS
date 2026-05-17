import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { displayValue, humanizeKey } from "@/features/reports/utils";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function PrimitiveRow({ name, value }: { name: string; value: unknown }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-white p-3 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-sm font-semibold text-muted-foreground">{humanizeKey(name)}</span>
      <span className="max-w-2xl text-sm leading-6 text-foreground">{displayValue(value)}</span>
    </div>
  );
}

function ArrayRenderer({ name, value }: { name: string; value: unknown[] }) {
  if (!value.length) {
    return <PrimitiveRow name={name} value="Sin elementos" />;
  }

  if (value.every((item) => !isRecord(item) && !Array.isArray(item))) {
    return (
      <div className="rounded-md border border-border bg-white p-4">
        <h4 className="font-semibold">{humanizeKey(name)}</h4>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          {value.map((item, index) => (
            <li key={`${name}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{displayValue(item)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">{humanizeKey(name)}</h4>
      <div className="grid gap-3 md:grid-cols-2">
        {value.map((item, index) => (
          <Card key={`${name}-${index}`} className="p-4">
            {isRecord(item) ? <ObjectRenderer value={item} compact /> : <span className="text-sm">{displayValue(item)}</span>}
          </Card>
        ))}
      </div>
    </div>
  );
}

function ObjectRenderer({ value, compact = false }: { value: Record<string, unknown>; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {Object.entries(value).map(([key, nested]) => {
        if (Array.isArray(nested)) return <ArrayRenderer key={key} name={key} value={nested} />;
        if (isRecord(nested)) {
          return (
            <div key={key} className="rounded-md border border-border bg-[#fffdf8] p-4">
              <h4 className="mb-3 font-semibold">{humanizeKey(key)}</h4>
              <ObjectRenderer value={nested} compact />
            </div>
          );
        }
        return <PrimitiveRow key={key} name={key} value={nested} />;
      })}
    </div>
  );
}

export function ReportJsonRenderer({ content }: { content: Record<string, unknown> | null }) {
  if (!content) {
    return (
      <Card className="p-5">
        <p className="text-sm text-muted-foreground">El reporte no tiene contenido disponible.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {Object.entries(content).map(([key, value]) => {
        if (key === "kind") {
          return (
            <Badge key={key} className="bg-primary/10 text-primary">
              {displayValue(value)}
            </Badge>
          );
        }
        if (Array.isArray(value)) {
          return (
            <section key={key} className="rounded-lg border border-border bg-card p-5">
              <ArrayRenderer name={key} value={value} />
            </section>
          );
        }
        if (isRecord(value)) {
          return (
            <section key={key} className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-4 font-display text-2xl font-semibold">{humanizeKey(key)}</h3>
              <ObjectRenderer value={value} />
            </section>
          );
        }
        return (
          <section key={key} className="rounded-lg border border-border bg-card p-5">
            <PrimitiveRow name={key} value={value} />
          </section>
        );
      })}
    </div>
  );
}
