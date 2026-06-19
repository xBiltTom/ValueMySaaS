import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "./styles/driver-theme.css";
import { TutorialModule } from "./store";

const defaultDriverOptions = {
  showProgress: true,
  animate: true,
  smoothScroll: true,
  allowClose: true,
  overlayColor: "rgba(0,0,0,0.6)",
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
    element: "#tour-sidebar",
    popover: {
      title: "Navegación del Sistema",
      description: "Desde aquí accedes a tus cuadros de mando, proyectos desplegados y configuración de IA (BYOK).",
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
      title: "Nodos IA (BYOK)",
      description: "ValueMySaaS funciona con un sistema 'Bring Your Own Key'. Registra tu propia API Key de OpenAI, Anthropic o Gemini para realizar análisis ilimitados.",
      side: "right",
      align: "start"
    }
  }
];

export function startTour(module: TutorialModule, onComplete?: () => void) {
  let steps: DriveStep[] = [];
  
  if (module === "global") steps = globalSteps;
  if (module === "dashboard") steps = dashboardSteps;
  if (module === "newProject") steps = newProjectSteps;
  if (module === "aiKeys") steps = aiKeysSteps;

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
