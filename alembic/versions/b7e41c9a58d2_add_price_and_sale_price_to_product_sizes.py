"""add price and sale price to product sizes

Revision ID: b7e41c9a58d2
Revises: a3c1e98d24b7
Create Date: 2026-11-23 12:24:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b7e41c9a58d2'
down_revision = 'a3c1e98d24b7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('product_sizes', sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('product_sizes', sa.Column('sale_price', sa.Numeric(precision=10, scale=2), nullable=True))
    op.create_check_constraint('check_product_size_price_positive', 'product_sizes', 'price IS NULL OR price > 0')
    op.create_check_constraint(
        'check_product_size_sale_price_valid',
        'product_sizes',
        'sale_price IS NULL OR (price IS NOT NULL AND sale_price > 0 AND sale_price < price)'
    )


def downgrade() -> None:
    op.drop_constraint('check_product_size_sale_price_valid', 'product_sizes', type_='check')
    op.drop_constraint('check_product_size_price_positive', 'product_sizes', type_='check')
    op.drop_column('product_sizes', 'sale_price')
    op.drop_column('product_sizes', 'price')
