import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProjectForm } from "@/features/projects/project-form";

export default function NewProjectPage() {
  return (
    <DashboardShell>
      <div className="mb-6 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nuevo proyecto</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Registrar SaaS</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Este formulario crea un registro real en PostgreSQL usando POST /saas-projects.
        </p>
      </div>
      <ProjectForm />
    </DashboardShell>
  );
}
