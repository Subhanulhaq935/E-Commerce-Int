"""support guest reviews and verified purchase

Revision ID: c1f5e2a8d4b3
Revises: b7e41c9a58d2
Create Date: 2026-11-23 15:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c1f5e2a8d4b3'
down_revision = 'b7e41c9a58d2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('reviews', 'user_id', existing_type=sa.Integer(), nullable=True)
    op.add_column('reviews', sa.Column('guest_name', sa.String(length=100), nullable=True))
    op.add_column('reviews', sa.Column('is_verified_purchase', sa.Boolean(), server_default='false', nullable=False))
    # Mark existing reviews as verified purchase (since they required delivered purchases)
    op.execute("UPDATE reviews SET is_verified_purchase = true WHERE user_id IS NOT NULL")


def downgrade() -> None:
    op.drop_column('reviews', 'is_verified_purchase')
    op.drop_column('reviews', 'guest_name')
    op.alter_column('reviews', 'user_id', existing_type=sa.Integer(), nullable=False)
