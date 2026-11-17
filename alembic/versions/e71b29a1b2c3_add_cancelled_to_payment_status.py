"""add cancelled to payment_status

Revision ID: e71b29a1b2c3
Revises: d6dff88da186
Create Date: 2026-11-17 18:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e71b29a1b2c3'
down_revision: Union[str, None] = 'd6dff88da186'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL mein enum value add karne ke liye
    op.execute("ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'cancelled';")


def downgrade() -> None:
    # PostgreSQL does not support removing values from an enum type easily
    pass
