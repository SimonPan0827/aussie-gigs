"""add external dedup fields

Revision ID: 0f4c62e2e5dd
Revises: 791579c310cf
Create Date: 2026-06-17 22:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0f4c62e2e5dd"
down_revision: Union[str, Sequence[str], None] = "791579c310cf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("artists", sa.Column("external_source", sa.String(), nullable=True))
    op.add_column("artists", sa.Column("external_id", sa.String(), nullable=True))
    op.create_unique_constraint(
        "uq_artists_external_source_id",
        "artists",
        ["external_source", "external_id"],
    )

    op.add_column("venues", sa.Column("external_source", sa.String(), nullable=True))
    op.add_column("venues", sa.Column("external_id", sa.String(), nullable=True))
    op.create_unique_constraint(
        "uq_venues_external_source_id",
        "venues",
        ["external_source", "external_id"],
    )

    op.add_column("events", sa.Column("external_source", sa.String(), nullable=True))
    op.add_column("events", sa.Column("external_id", sa.String(), nullable=True))
    op.create_unique_constraint(
        "uq_events_external_source_id",
        "events",
        ["external_source", "external_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("uq_events_external_source_id", "events", type_="unique")
    op.drop_column("events", "external_id")
    op.drop_column("events", "external_source")

    op.drop_constraint("uq_venues_external_source_id", "venues", type_="unique")
    op.drop_column("venues", "external_id")
    op.drop_column("venues", "external_source")

    op.drop_constraint("uq_artists_external_source_id", "artists", type_="unique")
    op.drop_column("artists", "external_id")
    op.drop_column("artists", "external_source")
