# ValueMySaaS

**ValueMySaaS** es una plataforma impulsada por Inteligencia Artificial diseñada para analizar el estado y rendimiento de proyectos SaaS. Permite a los usuarios llevar un registro de sus métricas clave y generar reportes y diagnósticos automáticos utilizando potentes modelos de lenguaje.

## 🚀 Características Principales

- **Dashboard de Métricas**: Controla MRR, Churn Rate, CAC, LTV y más.
- **Análisis por Inteligencia Artificial**: Genera reportes de salud, identifica fortalezas, debilidades y proporciona recomendaciones estratégicas para mejorar tu SaaS.
- **Gestión de Proveedores de IA**: Soporte nativo para utilizar claves de API (OpenAI, Groq, etc.) o utilizar modelos de uso gratuito (GPT4Free) a través de un sistema de créditos gestionable.
- **Panel de Administración Global**: Control de usuarios, sistema centralizado de créditos, estadísticas globales y personalización de mensajes de inicio de sesión.
- **Arquitectura Moderna**: Construido para ser veloz y completamente responsivo.

## 💻 Tecnologías Utilizadas

- **Frontend**: Next.js (App Router, Turbopack), React, Tailwind CSS, TypeScript.
- **Backend**: Python, FastAPI, SQLAlchemy, Alembic.
- **Base de Datos**: PostgreSQL (con Asyncpg).
- **Integración IA**: `litellm` (para proveedores oficiales) y `g4f` (para inteligencia artificial gratuita).

## 📦 Despliegue

El proyecto está diseñado para funcionar en un entorno de microservicios:
- **Backend y Base de datos**: Preparado para servicios en la nube como Render. (Comando de inicio sugerido: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
- **Frontend**: Optimizado para Vercel o entornos Node.js (`npm run build && npm run start`).

---
*Desarrollado para proveer a los creadores de SaaS de un análisis automatizado, preciso y procesable.*
