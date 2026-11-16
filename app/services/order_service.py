from decimal import Decimal
from typing import Dict
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import Order
from app.models.product import Product
from app.repositories.address_repository import AddressRepository
from app.repositories.cart_repository import CartRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.order import CheckoutRequest


class OrderService:
    @staticmethod
    def checkout(db: Session, user_id: int, data: CheckoutRequest) -> Order:
        # 1. Cart load and check (Pehle cart check karein)
        cart = CartRepository.get_or_create_cart(db, user_id=user_id)
        if not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )

        # 2. Address check (Must belong to this buyer)
        address = AddressRepository.get_by_id_and_user(
            db, address_id=data.shipping_address_id, user_id=user_id
        )
        if not address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid address",
            )

        try:
            # 3. Product IDs ko ascending order mein sort karein (Deadlock prevention)
            product_ids = sorted([item.product_id for item in cart.items])

            # Row lock: SELECT ... FOR UPDATE
            locked_products = db.scalars(
                select(Product)
                .where(Product.id.in_(product_ids))
                .order_by(Product.id.asc())
                .with_for_update()
            ).all()

            products_by_id: Dict[int, Product] = {p.id: p for p in locked_products}

            # 4. Active status & Stock check for each item
            for item in cart.items:
                product = products_by_id.get(item.product_id)
                if not product or not product.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Product is not active",
                    )
                if item.quantity > product.stock:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Itni quantity available nahi hai",
                    )

            # 5. Total calculation (DB prices se, client se nahi)
            subtotal_sum = Decimal("0.00")
            for item in cart.items:
                product = products_by_id[item.product_id]
                unit_price = Decimal(str(product.price))
                subtotal_sum += unit_price * item.quantity

            delivery_charge = Decimal(str(settings.DELIVERY_CHARGE))
            grand_total = subtotal_sum + delivery_charge

            # 6. Create Order
            order = OrderRepository.create_order(
                db,
                buyer_id=user_id,
                shipping_address_id=data.shipping_address_id,
                total_amount=grand_total,
            )

            # 7. Create Order Items & Deduct Stock
            for item in cart.items:
                product = products_by_id[item.product_id]
                unit_price = Decimal(str(product.price))
                item_subtotal = unit_price * item.quantity

                OrderRepository.create_order_item(
                    db,
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    subtotal=item_subtotal,
                )

                # Stock deduction
                product.stock -= item.quantity

            # 8. Create Payment (COD, pending)
            OrderRepository.create_payment(
                db,
                order_id=order.id,
                amount=grand_total,
            )

            # 9. Clear cart items (cart row intact)
            for item in list(cart.items):
                db.delete(item)

            # 10. Atomic Commit
            db.commit()

            # Return order with all relationships
            return OrderRepository.get_order_by_id(db, order_id=order.id)

        except HTTPException:
            db.rollback()
            raise
        except Exception:
            db.rollback()
            raise
