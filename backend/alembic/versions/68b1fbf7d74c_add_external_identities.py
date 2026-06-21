"""add external identities

Revision ID: 68b1fbf7d74c
Revises: 0f4c62e2e5dd
Create Date: 2026-06-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "68b1fbf7d74c"
down_revision: Union[str, Sequence[str], None] = "0f4c62e2e5dd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "external_identities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("external_source", sa.String(), nullable=False),
        sa.Column("external_id", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "entity_type",
            "external_source",
            "external_id",
            name="uq_external_identities_source_id",
        ),
    )
    op.create_index(
        op.f("ix_external_identities_id"),
        "external_identities",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_external_identities_id"), table_name="external_identities")
    op.drop_table("external_identities")
