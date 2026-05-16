import app.models  # noqa: F401
from app.db.base import Base


def test_expected_tables_are_registered():
    expected_tables = {
        "users",
        "saas_projects",
        "saas_metric_snapshots",
        "saas_scores",
        "ai_provider_keys",
        "ai_analyses",
        "chat_conversations",
        "chat_messages",
        "reports",
    }

    assert expected_tables.issubset(set(Base.metadata.tables.keys()))
