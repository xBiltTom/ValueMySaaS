# ValueMySaaS — Backend API

FastAPI + SQLAlchemy 2.x async + Alembic + PostgreSQL.

## Requisitos previos

- Python 3.12+
- PostgreSQL 15+ corriendo localmente (o vía Docker)
- (Opcional) un virtualenv activo

## Setup inicial

### 1. Instalar dependencias

```bash
cd apps/api
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus valores reales
```

Genera un `ENCRYPTION_KEY` válido para las BYOK API keys:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Crear la base de datos

```sql
CREATE DATABASE valuemy_saas;
```

O con psql:

```bash
psql -U postgres -c "CREATE DATABASE valuemy_saas;"
```

### 4. Ejecutar migraciones

```bash
alembic upgrade head
```

### 5. Iniciar el servidor

```bash
uvicorn app.main:app --reload
```

La API estará disponible en `http://localhost:8000`.  
Documentación Swagger: `http://localhost:8000/docs`.  
Health check: `http://localhost:8000/health`.

---

## Generar una nueva migración

Después de modificar o añadir modelos:

```bash
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

## Estructura del proyecto

```
apps/api/
├── app/
│   ├── main.py                   # Entrypoint FastAPI + lifespan
│   ├── core/
│   │   ├── config.py             # Pydantic Settings (single source of truth)
│   │   ├── security.py           # JWT, hashing, BYOK encryption stubs
│   │   └── logging.py            # Logging centralizado
│   ├── db/
│   │   ├── base.py               # DeclarativeBase
│   │   ├── session.py            # Engine async + get_db dependency
│   │   └── init_db.py            # Health check de conexión al arrancar
│   ├── models/
│   │   ├── enums.py              # Todos los enums del dominio
│   │   ├── user.py
│   │   ├── saas_project.py
│   │   ├── saas_metric_snapshot.py
│   │   ├── saas_score.py
│   │   ├── ai_provider_key.py
│   │   ├── ai_analysis.py
│   │   ├── chat_conversation.py
│   │   ├── chat_message.py
│   │   └── report.py
│   ├── schemas/                  # Pydantic schemas (por implementar)
│   ├── api/                      # Routers FastAPI (por implementar)
│   ├── services/                 # Lógica de negocio (por implementar)
│   └── repositories/             # Acceso a datos (por implementar)
├── alembic/
│   ├── env.py                    # Config Alembic con Settings + async
│   ├── script.py.mako
│   └── versions/
│       └── 0001_create_initial_valuemy_saas_schema.py
├── alembic.ini
├── requirements.txt
└── .env.example
```

## Decisiones de diseño

| Decisión | Motivo |
|---|---|
| `asyncpg` en runtime, `psycopg2` en Alembic | Alembic no soporta drivers async nativamente |
| UUID como PK | Evita secuencias predecibles, facilita sharding futuro |
| `Numeric` para dinero/ratios | Precisión exacta; nunca `Float` para valores financieros |
| JSONB para `custom_metrics`, `strengths`, etc. | Flexibilidad sin romper el esquema |
| `deleted_at` en User, SaasProject, AiProviderKey, ChatConversation | Soft delete — preserva auditoría |
| `scoring_version` / `prompt_version` | Permite evolucionar fórmulas sin invalidar resultados históricos |
| `ondelete="RESTRICT"` en FKs críticas | Previene borrado accidental en cascada de datos valiosos |
| `ondelete="CASCADE"` en `ai_provider_keys → users` | Las keys son propiedad del usuario; eliminación controlada |
| `ondelete="SET NULL"` en FKs opcionales | Mantiene el registro huérfano consultable |
| `file_url` genérico en Report | No acoplado a ningún proveedor de storage |
