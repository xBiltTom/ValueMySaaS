import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProjectForm } from "@/features/projects/project-form";

export default function NewProjectPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl py-6 md:py-12">
        <div className="mb-10 text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Comienza aquí</p>
          <h1 className="mt-2 font-display text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
            Registra tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">SaaS</span>
          </h1>
          <p className="mt-4 text-base md:text-lg leading-relaxed text-muted-foreground max-w-2xl">
            Cuéntanos sobre tu idea o proyecto. Nuestro motor de IA analizará tu modelo, mercado y propuesta de valor para darte feedback accionable.
          </p>
        </div>
        <ProjectForm />
      </div>
    </DashboardShell>
  );
}
