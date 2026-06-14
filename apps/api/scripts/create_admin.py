import asyncio
import os
import sys

# Ajustar PYTHONPATH para que app sea resoluble
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import hash_password_async

async def main():
    async with AsyncSessionLocal() as db:
        email = "admin@valuemysaas.com"
        
        # Consultar si ya existe
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if user:
            print("El usuario administrador ya existe.")
            # Asegurar de que tenga rol ADMIN y la contraseña correcta
            user.role = UserRole.ADMIN
            user.hashed_password = await hash_password_async("admin123")
            user.is_active = True
            await db.commit()
            print("Contraseña y rol actualizados por si acaso.")
        else:
            print("Creando usuario administrador...")
            hashed = await hash_password_async("admin123")
            user = User(
                email=email,
                username="admin",
                full_name="System Administrator",
                hashed_password=hashed,
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                ai_credits=9999
            )
            db.add(user)
            await db.commit()
            print("Admin creado exitosamente: admin@valuemysaas.com / admin123")

if __name__ == "__main__":
    asyncio.run(main())
