from decimal import Decimal
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import OrderStatus, PaymentMethod, PaymentStatus
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.payment import Payment


class OrderRepository:
    @staticmethod
    def create_order(
        db: Session,
        buyer_id: int,
        shipping_address_id: int,
        total_amount: Decimal,
    ) -> Order:
        order = Order(
            buyer_id=buyer_id,
            shipping_address_id=shipping_address_id,
            total_amount=total_amount,
            status=OrderStatus.pending,
        )
        db.add(order)
        db.flush()
        return order

    @staticmethod
    def create_order_item(
        db: Session,
        order_id: int,
        product_id: int,
        product_name: str,
        quantity: int,
        unit_price: Decimal,
        subtotal: Decimal,
    ) -> OrderItem:
        item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            product_name=product_name,
            quantity=quantity,
            unit_price=unit_price,
            subtotal=subtotal,
        )
        db.add(item)
        db.flush()
        return item

    @staticmethod
    def create_payment(
        db: Session,
        order_id: int,
        amount: Decimal,
    ) -> Payment:
        payment = Payment(
            order_id=order_id,
            amount=amount,
            payment_method=PaymentMethod.COD,
            status=PaymentStatus.pending,
        )
        db.add(payment)
        db.flush()
        return payment

    @staticmethod
    def get_order_by_id(db: Session, order_id: int) -> Optional[Order]:
        return db.scalar(
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.payment),
                selectinload(Order.shipping_address),
            )
            .where(Order.id == order_id)
        )
