def test_app_imports():
    from app.main import app

    assert app.title == "ValueMySaaS API"


def test_models_import_and_register_metadata():
    import app.models  # noqa: F401
    from app.db.base import Base

    assert Base.metadata.tables
