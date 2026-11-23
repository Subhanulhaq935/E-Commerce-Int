"""add product sizes and sale pricing

Revision ID: a3c1e98d24b7
Revises: f82c39b2d1e4
Create Date: 2026-11-23 11:42:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3c1e98d24b7'
down_revision: Union[str, None] = 'f82c39b2d1e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add sale_price and has_sizes to products
    op.add_column('products', sa.Column('sale_price', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('products', sa.Column('has_sizes', sa.Boolean(), server_default='false', nullable=False))

    # 2. Create product_sizes table
    op.create_table(
        'product_sizes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('size', sa.String(length=20), nullable=False),
        sa.Column('stock', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_available', sa.Boolean(), server_default='true', nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_id', 'size', name='uq_product_size'),
    )
    op.create_index('ix_product_sizes_id', 'product_sizes', ['id'], unique=False)
    op.create_index('ix_product_sizes_product_id', 'product_sizes', ['product_id'], unique=False)

    # 3. Add size to cart_items
    op.add_column('cart_items', sa.Column('size', sa.String(length=20), nullable=True))

    # 4. Add size to order_items
    op.add_column('order_items', sa.Column('size', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('order_items', 'size')
    op.drop_column('cart_items', 'size')
    op.drop_index('ix_product_sizes_product_id', table_name='product_sizes')
    op.drop_index('ix_product_sizes_id', table_name='product_sizes')
    op.drop_table('product_sizes')
    op.drop_column('products', 'has_sizes')
    op.drop_column('products', 'sale_price')
