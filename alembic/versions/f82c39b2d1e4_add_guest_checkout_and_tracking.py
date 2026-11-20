"""add guest checkout and tracking
Revision ID: f82c39b2d1e4
Revises: e71b29a1b2c3
Create Date: 2026-11-20 15:58:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f82c39b2d1e4'
down_revision: Union[str, None] = 'e71b29a1b2c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Allow buyer_id and shipping_address_id to be NULL for guest checkout
    op.alter_column('orders', 'buyer_id', existing_type=sa.Integer(), nullable=True)
    op.alter_column('orders', 'shipping_address_id', existing_type=sa.Integer(), nullable=True)

    # 2. Add guest customer and delivery information
    op.add_column('orders', sa.Column('guest_name', sa.String(length=255), nullable=True))
    op.add_column('orders', sa.Column('guest_email', sa.String(length=255), nullable=True))
    op.add_column('orders', sa.Column('guest_phone', sa.String(length=50), nullable=True))
    op.add_column('orders', sa.Column('guest_address', sa.String(length=500), nullable=True))
    op.add_column('orders', sa.Column('guest_city', sa.String(length=100), nullable=True))
    op.add_column('orders', sa.Column('guest_postal_code', sa.String(length=20), nullable=True))

    # 3. Add unique tracking token for secure guest order tracking
    op.add_column('orders', sa.Column('tracking_token', sa.String(length=64), nullable=True))
    op.create_index(op.f('ix_orders_guest_email'), 'orders', ['guest_email'], unique=False)
    op.create_index(op.f('ix_orders_tracking_token'), 'orders', ['tracking_token'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_orders_tracking_token'), table_name='orders')
    op.drop_index(op.f('ix_orders_guest_email'), table_name='orders')
    op.drop_column('orders', 'tracking_token')
    op.drop_column('orders', 'guest_postal_code')
    op.drop_column('orders', 'guest_city')
    op.drop_column('orders', 'guest_address')
    op.drop_column('orders', 'guest_phone')
    op.drop_column('orders', 'guest_email')
    op.drop_column('orders', 'guest_name')
    op.alter_column('orders', 'shipping_address_id', existing_type=sa.Integer(), nullable=False)
    op.alter_column('orders', 'buyer_id', existing_type=sa.Integer(), nullable=False)
