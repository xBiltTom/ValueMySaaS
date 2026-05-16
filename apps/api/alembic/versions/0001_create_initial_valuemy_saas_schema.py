"""create initial valuemy saas schema

Revision ID: 0001
Revises:
Create Date: 2026-05-13 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Enums ---
    userrole = postgresql.ENUM("USER", "ADMIN", name="userrole", create_type=False)
    userrole.create(op.get_bind(), checkfirst=True)

    saascategory = postgresql.ENUM(
        "EDTECH", "FINTECH", "HEALTHTECH", "PRODUCTIVITY", "MARKETING",
        "ECOMMERCE", "AI", "DEVELOPER_TOOLS", "OTHER",
        name="saascategory", create_type=False,
    )
    saascategory.create(op.get_bind(), checkfirst=True)

    saasstage = postgresql.ENUM(
        "IDEA", "PLANNING", "MVP", "LAUNCHED", "GROWING", "PAUSED",
        name="saasstage", create_type=False,
    )
    saasstage.create(op.get_bind(), checkfirst=True)

    businessmodel = postgresql.ENUM(
        "B2B", "B2C", "B2B2C", "FREEMIUM", "SUBSCRIPTION", "ONE_TIME", "OTHER",
        name="businessmodel", create_type=False,
    )
    businessmodel.create(op.get_bind(), checkfirst=True)

    sustainabilitylevel = postgresql.ENUM(
        "HEALTHY", "VIABLE_WITH_ADJUSTMENTS", "RISKY", "UNSUSTAINABLE", "INSUFFICIENT_DATA",
        name="sustainabilitylevel", create_type=False,
    )
    sustainabilitylevel.create(op.get_bind(), checkfirst=True)

    decisionrecommendation = postgresql.ENUM(
        "CONTINUE", "IMPROVE", "PIVOT", "PAUSE", "DISCARD", "INSUFFICIENT_DATA",
        name="decisionrecommendation", create_type=False,
    )
    decisionrecommendation.create(op.get_bind(), checkfirst=True)

    aiprovider = postgresql.ENUM(
        "OPENAI", "GEMINI", "ANTHROPIC", "OPENROUTER", "OTHER",
        name="aiprovider", create_type=False,
    )
    aiprovider.create(op.get_bind(), checkfirst=True)

    aianalysistype = postgresql.ENUM(
        "EXECUTIVE_SUMMARY", "RISK_ANALYSIS", "PRICING_ANALYSIS", "GROWTH_ANALYSIS",
        "RETENTION_ANALYSIS", "FULL_DIAGNOSIS", "CUSTOM",
        name="aianalysistype", create_type=False,
    )
    aianalysistype.create(op.get_bind(), checkfirst=True)

    conversationstatus = postgresql.ENUM(
        "ACTIVE", "ARCHIVED", "DELETED",
        name="conversationstatus", create_type=False,
    )
    conversationstatus.create(op.get_bind(), checkfirst=True)

    chatrole = postgresql.ENUM(
        "SYSTEM", "USER", "ASSISTANT", "TOOL",
        name="chatrole", create_type=False,
    )
    chatrole.create(op.get_bind(), checkfirst=True)

    reporttype = postgresql.ENUM(
        "BASIC", "EXECUTIVE", "AI_ASSISTED", "SCENARIO_SIMULATION",
        name="reporttype", create_type=False,
    )
    reporttype.create(op.get_bind(), checkfirst=True)

    reportstatus = postgresql.ENUM(
        "DRAFT", "GENERATED", "FAILED",
        name="reportstatus", create_type=False,
    )
    reportstatus.create(op.get_bind(), checkfirst=True)

    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("username", sa.String(100), nullable=True),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", userrole, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email_active", "users", ["email", "is_active"])

    # --- saas_projects ---
    op.create_table(
        "saas_projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", saascategory, nullable=True),
        sa.Column("stage", saasstage, nullable=False),
        sa.Column("business_model", businessmodel, nullable=True),
        sa.Column("target_market", sa.String(255), nullable=True),
        sa.Column("target_audience", sa.Text(), nullable=True),
        sa.Column("country_focus", sa.String(100), nullable=True),
        sa.Column("main_problem", sa.Text(), nullable=True),
        sa.Column("value_proposition", sa.Text(), nullable=True),
        sa.Column("pricing_notes", sa.Text(), nullable=True),
        sa.Column("current_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(10), nullable=False, server_default="USD"),
        sa.Column("is_public_sample", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id", "slug", name="uq_saas_projects_owner_slug"),
    )
    op.create_index("ix_saas_projects_owner_id", "saas_projects", ["owner_id"])
    op.create_index("ix_saas_projects_slug", "saas_projects", ["slug"])
    op.create_index("ix_saas_projects_stage", "saas_projects", ["stage"])
    op.create_index("ix_saas_projects_category", "saas_projects", ["category"])
    op.create_index("ix_saas_projects_owner_stage", "saas_projects", ["owner_id", "stage"])

    # --- saas_metric_snapshots ---
    op.create_table(
        "saas_metric_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("saas_project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("period_label", sa.String(100), nullable=True),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("mrr", sa.Numeric(14, 2), nullable=True),
        sa.Column("arr", sa.Numeric(14, 2), nullable=True),
        sa.Column("monthly_revenue", sa.Numeric(14, 2), nullable=True),
        sa.Column("monthly_costs", sa.Numeric(14, 2), nullable=True),
        sa.Column("gross_profit", sa.Numeric(14, 2), nullable=True),
        sa.Column("net_profit", sa.Numeric(14, 2), nullable=True),
        sa.Column("cash_available", sa.Numeric(14, 2), nullable=True),
        sa.Column("burn_rate", sa.Numeric(14, 2), nullable=True),
        sa.Column("total_users", sa.Integer(), nullable=True),
        sa.Column("active_users", sa.Integer(), nullable=True),
        sa.Column("paying_customers", sa.Integer(), nullable=True),
        sa.Column("new_users", sa.Integer(), nullable=True),
        sa.Column("new_paying_customers", sa.Integer(), nullable=True),
        sa.Column("churned_customers", sa.Integer(), nullable=True),
        sa.Column("cac", sa.Numeric(12, 2), nullable=True),
        sa.Column("marketing_spend", sa.Numeric(14, 2), nullable=True),
        sa.Column("churn_rate", sa.Numeric(8, 4), nullable=True),
        sa.Column("retention_rate", sa.Numeric(8, 4), nullable=True),
        sa.Column("conversion_rate", sa.Numeric(8, 4), nullable=True),
        sa.Column("arpu", sa.Numeric(12, 2), nullable=True),
        sa.Column("ltv", sa.Numeric(14, 2), nullable=True),
        sa.Column("ltv_cac_ratio", sa.Numeric(8, 4), nullable=True),
        sa.Column("payback_months", sa.Numeric(8, 2), nullable=True),
        sa.Column("growth_rate", sa.Numeric(8, 4), nullable=True),
        sa.Column("runway_months", sa.Numeric(8, 2), nullable=True),
        sa.Column("nps", sa.Numeric(6, 2), nullable=True),
        sa.Column("avg_session_minutes", sa.Numeric(8, 2), nullable=True),
        sa.Column("support_tickets", sa.Integer(), nullable=True),
        sa.Column("critical_bugs", sa.Integer(), nullable=True),
        sa.Column("uptime_percentage", sa.Numeric(6, 3), nullable=True),
        sa.Column("custom_metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["saas_project_id"], ["saas_projects.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_saas_metric_snapshots_saas_project_id", "saas_metric_snapshots", ["saas_project_id"])
    op.create_index("ix_metric_snapshots_project_captured", "saas_metric_snapshots", ["saas_project_id", "captured_at"])

    # --- saas_scores ---
    op.create_table(
        "saas_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("saas_project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("metric_snapshot_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("overall_score", sa.Numeric(5, 2), nullable=False),
        sa.Column("financial_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("growth_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("retention_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("product_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("risk_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("sustainability_level", sustainabilitylevel, nullable=False),
        sa.Column("decision_recommendation", decisionrecommendation, nullable=False),
        sa.Column("strengths", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("weaknesses", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("alerts", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("recommendations", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("scoring_version", sa.String(20), nullable=False, server_default="v1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["saas_project_id"], ["saas_projects.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["metric_snapshot_id"], ["saas_metric_snapshots.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_saas_scores_saas_project_id", "saas_scores", ["saas_project_id"])
    op.create_index("ix_saas_scores_metric_snapshot_id", "saas_scores", ["metric_snapshot_id"])

    # --- ai_provider_keys ---
    op.create_table(
        "ai_provider_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", aiprovider, nullable=False),
        sa.Column("label", sa.String(100), nullable=True),
        sa.Column("encrypted_api_key", sa.String(1024), nullable=False),
        sa.Column("key_last_four", sa.String(4), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "provider", "label", name="uq_ai_provider_keys_user_provider_label"),
    )
    op.create_index("ix_ai_provider_keys_user_id", "ai_provider_keys", ["user_id"])
    op.create_index("ix_ai_provider_keys_user_provider", "ai_provider_keys", ["user_id", "provider"])

    # --- ai_analyses ---
    op.create_table(
        "ai_analyses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("saas_project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("metric_snapshot_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("score_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", aiprovider, nullable=False),
        sa.Column("model_name", sa.String(100), nullable=True),
        sa.Column("analysis_type", aianalysistype, nullable=False),
        sa.Column("prompt_version", sa.String(20), nullable=False, server_default="v1"),
        sa.Column("input_context", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("output_text", sa.Text(), nullable=False),
        sa.Column("output_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("tokens_input", sa.Integer(), nullable=True),
        sa.Column("tokens_output", sa.Integer(), nullable=True),
        sa.Column("estimated_cost", sa.Numeric(10, 6), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["saas_project_id"], ["saas_projects.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["metric_snapshot_id"], ["saas_metric_snapshots.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["score_id"], ["saas_scores.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_analyses_saas_project_id", "ai_analyses", ["saas_project_id"])
    op.create_index("ix_ai_analyses_metric_snapshot_id", "ai_analyses", ["metric_snapshot_id"])
    op.create_index("ix_ai_analyses_user_id", "ai_analyses", ["user_id"])

    # --- chat_conversations ---
    op.create_table(
        "chat_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("saas_project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("provider", aiprovider, nullable=True),
        sa.Column("model_name", sa.String(100), nullable=True),
        sa.Column("system_prompt_version", sa.String(20), nullable=False, server_default="v1"),
        sa.Column("status", conversationstatus, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["saas_project_id"], ["saas_projects.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_chat_conversations_saas_project_id", "chat_conversations", ["saas_project_id"])
    op.create_index("ix_chat_conversations_user_id", "chat_conversations", ["user_id"])
    op.create_index("ix_chat_conversations_user_status", "chat_conversations", ["user_id", "status"])

    # --- chat_messages ---
    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", chatrole, nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["chat_conversations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_chat_messages_conversation_id", "chat_messages", ["conversation_id"])
    op.create_index("ix_chat_messages_conversation_created", "chat_messages", ["conversation_id", "created_at"])

    # --- reports ---
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("saas_project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("metric_snapshot_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("score_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("ai_analysis_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("report_type", reporttype, nullable=False),
        sa.Column("status", reportstatus, nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("file_url", sa.String(2048), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["saas_project_id"], ["saas_projects.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["metric_snapshot_id"], ["saas_metric_snapshots.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["score_id"], ["saas_scores.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["ai_analysis_id"], ["ai_analyses.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reports_saas_project_id", "reports", ["saas_project_id"])
    op.create_index("ix_reports_user_id", "reports", ["user_id"])
    op.create_index("ix_reports_project_status", "reports", ["saas_project_id", "status"])


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("chat_messages")
    op.drop_table("chat_conversations")
    op.drop_table("ai_analyses")
    op.drop_table("ai_provider_keys")
    op.drop_table("saas_scores")
    op.drop_table("saas_metric_snapshots")
    op.drop_table("saas_projects")
    op.drop_table("users")

    for enum_name in [
        "reportstatus", "reporttype", "chatrole", "conversationstatus",
        "aianalysistype", "aiprovider", "decisionrecommendation",
        "sustainabilitylevel", "businessmodel", "saasstage",
        "saascategory", "userrole",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
