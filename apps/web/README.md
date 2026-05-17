# ValueMySaaS Web

Frontend de ValueMySaaS construido con Next.js, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts y React Markdown.

ValueMySaaS evalúa valor, sostenibilidad y riesgo de ideas SaaS, micro-SaaS, MVPs o productos en operación. La IA es una capa complementaria BYOK; el núcleo del sistema son métricas, score, dashboard, reportes y mejora continua.

## Requisitos

- Node.js
- Backend de ValueMySaaS corriendo en `http://localhost:8000`
- Base de datos configurada para el backend

## Variables de Entorno

Crear `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abrir `http://localhost:3000`.

## Build

```bash
npm run build
```

## Rutas Principales

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/projects`
- `/projects/new`
- `/projects/[id]`
- `/projects/[id]/metrics`
- `/projects/[id]/score`
- `/projects/[id]/reports`
- `/projects/[id]/reports/[reportId]`
- `/settings/ai-keys`
- `/projects/[id]/ai-analysis`
- `/projects/[id]/ai-analysis/[analysisId]`
- `/projects/[id]/chat`
- `/projects/[id]/chat/[conversationId]`

## Flujo de Demo Recomendado

1. Registrar usuario.
2. Crear SaaS.
3. Registrar métricas.
4. Generar diagnóstico.
5. Revisar dashboard individual.
6. Generar reporte ejecutivo.
7. Configurar y verificar API Key BYOK.
8. Generar análisis IA.
9. Crear conversación y preguntar al chat contextual.

## Seguridad BYOK

- El frontend nunca muestra la API Key completa después de guardarla.
- Solo se muestra `key_last_four` como `•••• abcd`.
- La API Key no se guarda en `localStorage`.
- Análisis IA y chat usan `ai_key_id`; no piden claves manualmente.
