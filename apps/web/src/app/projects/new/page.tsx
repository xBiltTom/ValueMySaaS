import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProjectForm } from "@/features/projects/project-form";
import { TerminalSquare } from "lucide-react";
import { TutorialTrigger } from "@/features/tutorial/components/tutorial-trigger";

export default function NewProjectPage() {
  return (
    <DashboardShell>
      <TutorialTrigger modules={["newProject"]} />
      <div className="mx-auto max-w-4xl py-6 md:py-12 relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none -z-10" />
        
        <div className="mb-8 md:mb-12 text-center md:text-left border-2 border-border/60 bg-card/40 backdrop-blur-md p-5 md:p-8 rounded-2xl shadow-[8px_8px_0_rgba(0,0,0,0.2)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-4 right-4 text-muted-foreground/30 font-mono text-[10px] hidden md:block">
            <p>SYS_VER: 1.0.4</p>
            <p>MEM: OK</p>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
            <div className="h-10 w-10 bg-primary/20 text-primary border-2 border-primary/50 rounded-[8px] flex items-center justify-center shadow-[2px_2px_0_rgba(var(--primary),0.3)]">
              <TerminalSquare className="h-5 w-5" />
            </div>
            <p className="text-[12px] font-black uppercase tracking-widest text-primary font-mono">
              /sys/init_project
            </p>
          </div>
          
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground mb-4">
            REGISTRO DE NÚCLEO <span className="text-primary">SAAS</span>
          </h1>
          
          <p className="text-[13px] md:text-[14px] font-mono leading-relaxed text-muted-foreground max-w-2xl uppercase">
            &gt; Ingresa los parámetros base de tu plataforma. Nuestro motor de IA procesará el modelo de datos para generar un análisis de viabilidad, arquitectura de negocio y métricas clave.
          </p>
        </div>
        
        <ProjectForm />
      </div>
    </DashboardShell>
  );
}
