"""add sync logs

Revision ID: f44c825f9b75
Revises: 68b1fbf7d74c
Create Date: 2026-06-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f44c825f9b75"
down_revision: Union[str, Sequence[str], None] = "68b1fbf7d74c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "sync_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("sync_type", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("state_code", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("keyword", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("created_events", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_events", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_artists", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("matched_artists", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_venues", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("matched_venues", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("skipped_events", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fetched_events", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pages_fetched", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reached_page_limit", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sync_logs_id"), "sync_logs", ["id"], unique=False)
    op.create_index("ix_sync_logs_source_started_at", "sync_logs", ["source", "started_at"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_sync_logs_source_started_at", table_name="sync_logs")
    op.drop_index(op.f("ix_sync_logs_id"), table_name="sync_logs")
    op.drop_table("sync_logs")
