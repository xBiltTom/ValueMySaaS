from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Single declarative base for all SQLAlchemy models.
    Import this in every model file and in alembic/env.py.
    """
    pass
