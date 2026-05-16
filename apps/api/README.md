# ValueMySaaS Backend API

Backend base para ValueMySaaS, construido con FastAPI, SQLAlchemy 2.x async, Alembic y PostgreSQL.

## Requisitos

- Python 3.12+
- PostgreSQL 15+ local o remoto
- Entorno virtual activo, por ejemplo `venv`

## Setup

```bash
cd apps/api
pip install -r requirements.txt
copy .env.example .env
```

Edita `.env` con tus valores locales. No guardes secretos reales en el repositorio.

Para generar una clave Fernet valida para `ENCRYPTION_KEY`:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Base de datos local sugerida:

```sql
CREATE DATABASE valuemysaas;
```

## Migraciones

Alembic usa el mismo driver async del runtime: `postgresql+asyncpg`. La URL vive en `DATABASE_URL`; el valor de `alembic.ini` es solo un placeholder.

```bash
alembic upgrade head
alembic current
```

Para probar rollback en una base local o descartable:

```bash
alembic downgrade base
alembic upgrade head
```

No ejecutes `downgrade base` contra una base con datos reales.

## Ejecutar API

```bash
uvicorn app.main:app --reload
```

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Tests

```bash
pytest
```

Los tests iniciales solo validan imports, registro de metadata SQLAlchemy y `/health` sin requerir una base real.

## Estructura

```text
apps/api/
  app/
    main.py
    core/          # config, seguridad y logging
    db/            # Base declarativa, engine async y sesiones
    models/        # modelos SQLAlchemy del dominio
    schemas/       # preparado para Pydantic schemas
    api/           # preparado para routers FastAPI
    services/      # preparado para logica de negocio
    repositories/  # preparado para acceso a datos
  alembic/
    env.py
    versions/
  tests/
  alembic.ini
  requirements.txt
  .env.example
```

## Decisiones de diseno

- El backend es dueno del dominio de base de datos y no depende de Supabase, Render, Vercel ni otro proveedor.
- La configuracion se controla por variables de entorno mediante Pydantic Settings.
- SQLAlchemy corre en modo async con `asyncpg`; Alembic tambien usa `asyncpg` mediante `async_engine_from_config`.
- Las tablas principales usan UUID como primary key y `DateTime(timezone=True)`.
- Dinero, ratios y scores usan `Numeric`, no `Float`.
- Campos flexibles como metricas personalizadas, recomendaciones, contexto IA y contenido de reportes usan JSONB.
- `User`, `SaasProject`, `AiProviderKey` y `ChatConversation` tienen soft delete con `deleted_at`.
- Las claves BYOK se guardan cifradas en `encrypted_api_key`; nunca deben persistirse en texto plano.
- Las relaciones historicas y de auditoria usan `RESTRICT` o `SET NULL`; `CASCADE` queda limitado a mensajes dentro de una conversacion.
- `Report.file_url` es generico y no esta acoplado a ningun storage especifico.

## Variables minimas

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/valuemysaas
JWT_SECRET=change_me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
APP_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
ENCRYPTION_KEY=change_me_generate_with_fernet
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
```
