import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "./styles/driver-theme.css";
import { TutorialModule } from "./store";

const defaultDriverOptions = {
  showProgress: true,
  animate: true,
  smoothScroll: true,
  allowClose: true,
  overlayColor: "#000000",
  overlayOpacity: 0.85,
  nextBtnText: "Siguiente >",
  prevBtnText: "< Atrás",
  doneBtnText: "Finalizar",
  progressText: "Paso {{current}} de {{total}}",
};

export const globalSteps: DriveStep[] = [
  {
    popover: {
      title: "SYS_INIT: Bienvenido al Núcleo",
      description: "Bienvenido a ValueMySaaS. Tu command center para auditar proyectos, evaluar viabilidad y analizar métricas. Empecemos el tour rápido.",
      align: "center",
      side: "bottom",
    }
  },
  {
    element: "nav#tour-nav a[href='/dashboard']",
    popover: {
      title: "Módulo: Dashboard",
      description: "Tu centro de control principal. Aquí verás métricas agregadas de todos tus proyectos, puntajes globales y alertas de mejoras priorizadas por IA.",
      side: "right",
      align: "start"
    }
  },
  {
    element: "nav#tour-nav a[href='/projects']",
    popover: {
      title: "Módulo: Proyectos",
      description: "Tu biblioteca de despliegues. Accede al detalle individual de cada SaaS, revisa sus métricas específicas y consulta reportes detallados generados por la IA.",
      side: "right",
      align: "start"
    }
  },
  {
    element: "nav#tour-nav a[href='/settings/ai-keys']",
    popover: {
      title: "Módulo: AI Keys (BYOK)",
      description: "Conecta tus propias claves de API (OpenAI, Anthropic) para correr análisis ilimitados. Esto reduce tus costos y mantiene tus datos bajo tu control.",
      side: "right",
      align: "start"
    }
  },
  {
    element: "#tour-deploy-btn",
    popover: {
      title: "Deploy App / Instanciar",
      description: "El botón de oro. Aquí registras nuevos proyectos y dejas que nuestro motor de IA audite tus ideas antes de escribir una sola línea de código.",
      side: "bottom",
      align: "end"
    }
  },
  {
    element: "#tour-topbar-controls",
    popover: {
      title: "Controles y Tour",
      description: "Aquí puedes reactivar este tour en cualquier momento. ¡Explora el sistema!",
      side: "left",
      align: "end"
    }
  }
];

export const dashboardSteps: DriveStep[] = [
  {
    element: "#tour-dashboard-kpis",
    popover: {
      title: "Métricas de Portafolio",
      description: "Visión global de todos tus proyectos. Monitorea el total de deploys, score promedio y alertas críticas.",
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "#tour-dashboard-distribution",
    popover: {
      title: "Distribución por Etapas",
      description: "Analiza cuántos de tus proyectos están en planeación, MVP o ya en producción generando MRR.",
      side: "right",
      align: "start"
    }
  },
  {
    element: "#tour-dashboard-logs",
    popover: {
      title: "Logs de Mejora",
      description: "El motor de IA consolida las sugerencias críticas de todos tus proyectos aquí para que sepas qué atacar primero.",
      side: "left",
      align: "start"
    }
  }
];

export const newProjectSteps: DriveStep[] = [
  {
    element: "#tour-new-project-stage",
    popover: {
      title: "Fase de Operación",
      description: "Crucial. Define si tu proyecto es una idea o si ya está en producción. La IA adaptará sus análisis y métricas financieras dependiendo de esto.",
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "#tour-new-project-form",
    popover: {
      title: "Parámetros del Proyecto",
      description: "Llena los metadatos. Mientras más preciso seas con el problema y el mercado, más duro y útil será el roasting de la IA.",
      side: "top",
      align: "start"
    }
  }
];

export const aiKeysSteps: DriveStep[] = [
  {
    element: "#tour-ai-keys-form",
    popover: {
      title: "Configuración BYOK",
      description: "Bring Your Own Key. En lugar de cobrarte suscripciones caras, tú conectas tus propias llaves y pagas solo lo que consumes directo a OpenAI/Anthropic.",
      side: "right",
      align: "start"
    }
  },
  {
    element: "select[name='provider']",
    popover: {
      title: "1. Selecciona el Motor",
      description: "Elige el modelo que deseas usar. Diferentes modelos tienen diferentes fortalezas (ej. Claude 3.5 Sonnet para análisis profundo, GPT-4o para reportes estructurados).",
      side: "top",
      align: "start"
    }
  },
  {
    element: "input[name='api_key']",
    popover: {
      title: "2. Tu Llave Segura",
      description: "Pega aquí tu API Key. Solo se usará localmente para ejecutar tus peticiones a través de nuestra pasarela, no se almacena en texto plano.",
      side: "top",
      align: "start"
    }
  }
];

const projectsListSteps: DriveStep[] = [
  {
    element: "#tour-projects-list-header",
    popover: {
      title: "Inventario Activo",
      description: "Aquí se listan todos los proyectos SaaS que has perfilado. Puedes buscar, filtrar y monitorear el estado de cada uno.",
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "#tour-deploy-new-btn",
    popover: {
      title: "Desplegar un Nuevo Proyecto",
      description: "Al dar clic aquí iniciarás el flujo de registro. La IA requiere datos precisos sobre tu mercado y finanzas para generar el primer diagnóstico.",
      side: "left",
      align: "start"
    }
  }
];

export const projectDetailSteps: DriveStep[] = [
  {
    element: "#tour-project-header",
    popover: {
      title: "Consola del Proyecto",
      description: "Bienvenido a la sala de control de tu proyecto. Aquí puedes ver la información clave, estado del sistema y acceder a los submódulos de análisis.",
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "#tour-project-actions",
    popover: {
      title: "Submódulos de Acción",
      description: "Estos botones te llevarán a las herramientas clave: ingreso de datos financieros (Estimaciones/Data Input), Diagnóstico IA y el Hub de Reportes.",
      side: "top",
      align: "start"
    }
  }
];

export const projectMetricsSteps: DriveStep[] = [
  {
    popover: {
      title: "Data Input (Métricas)",
      description: "Aquí registras el latido de tu SaaS. Puedes ingresar costos, ingresos, CAC, Churn y otras métricas clave según la fase del proyecto.",
      side: "bottom",
      align: "start"
    }
  }
];

export const projectScoreSteps: DriveStep[] = [
  {
    popover: {
      title: "Heurística y Score",
      description: "Nuestro motor calcula un puntaje basado en las reglas del negocio SaaS, mostrándote exactamente dónde estás fallando y cómo corregirlo.",
      side: "bottom",
      align: "start"
    }
  }
];

export const projectReportsSteps: DriveStep[] = [
  {
    popover: {
      title: "Hub de Reportes",
      description: "Genera documentos profesionales para inversionistas o para tu equipo. La IA extraerá los datos y redactará análisis detallados en PDF/Markdown.",
      side: "bottom",
      align: "start"
    }
  }
];

export const projectReportDetailSteps: DriveStep[] = [
  {
    popover: {
      title: "Detalle del Reporte",
      description: "Aquí puedes visualizar el reporte generado, revisar la metodología utilizada por la IA, o exportarlo a un archivo final.",
      side: "bottom",
      align: "start"
    }
  }
];

export const projectAiAnalysisSteps: DriveStep[] = [
  {
    popover: {
      title: "Tutor / Analista IA",
      description: "Un espacio interactivo donde la IA actúa como tu CFO o Product Manager, analizando en crudo los datos del proyecto y dándote feedback implacable.",
      side: "bottom",
      align: "start"
    }
  }
];

const moduleMap: Record<TutorialModule, DriveStep[]> = {
  global: globalSteps,
  dashboard: dashboardSteps,
  newProject: newProjectSteps,
  aiKeys: aiKeysSteps,
  projectsList: projectsListSteps,
  projectDetail: projectDetailSteps,
  projectMetrics: projectMetricsSteps,
  projectScore: projectScoreSteps,
  projectReports: projectReportsSteps,
  projectReportDetail: projectReportDetailSteps,
  projectAiAnalysis: projectAiAnalysisSteps,
};

export function startTour(module: TutorialModule, onComplete?: () => void) {
  const steps: DriveStep[] = moduleMap[module] || [];

  // Filter out steps where elements don't exist in the DOM (for mobile/responsive safety)
  const validSteps = steps.filter(step => {
    if (!step.element) return true; // Steps without specific elements are always valid (e.g. welcome modals)
    const el = document.querySelector(step.element as string);
    // Extra safety: element must be visible
    if (el) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        return false;
      }
      return true;
    }
    return false;
  });

  if (validSteps.length === 0) return;

  const driverObj = driver({
    ...defaultDriverOptions,
    steps: validSteps,
    onDestroyStarted: () => {
      driverObj.destroy();
      if (onComplete) onComplete();
    }
  });

  driverObj.drive();
}
