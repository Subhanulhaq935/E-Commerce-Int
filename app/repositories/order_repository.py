from decimal import Decimal
from typing import Optional, Sequence
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
        total_amount: Decimal,
        buyer_id: Optional[int] = None,
        shipping_address_id: Optional[int] = None,
        guest_name: Optional[str] = None,
        guest_email: Optional[str] = None,
        guest_phone: Optional[str] = None,
        guest_address: Optional[str] = None,
        guest_city: Optional[str] = None,
        guest_postal_code: Optional[str] = None,
        tracking_token: Optional[str] = None,
    ) -> Order:
        order = Order(
            buyer_id=buyer_id,
            shipping_address_id=shipping_address_id,
            total_amount=total_amount,
            status=OrderStatus.pending,
            guest_name=guest_name,
            guest_email=guest_email,
            guest_phone=guest_phone,
            guest_address=guest_address,
            guest_city=guest_city,
            guest_postal_code=guest_postal_code,
            tracking_token=tracking_token,
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
        size: Optional[str] = None,
    ) -> OrderItem:
        item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            product_name=product_name,
            quantity=quantity,
            unit_price=unit_price,
            subtotal=subtotal,
            size=size,
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
                selectinload(Order.buyer),
            )
            .where(Order.id == order_id)
        )

    @staticmethod
    def get_by_tracking_token(db: Session, token: str) -> Optional[Order]:
        return db.scalar(
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.payment),
                selectinload(Order.shipping_address),
                selectinload(Order.buyer),
            )
            .where(Order.tracking_token == token)
        )

    @staticmethod
    def list_by_buyer(
        db: Session, buyer_id: int, skip: int = 0, limit: int = 20
    ) -> Sequence[Order]:
        return db.scalars(
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.payment),
                selectinload(Order.shipping_address),
            )
            .where(Order.buyer_id == buyer_id)
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        ).all()

    @staticmethod
    def list_all(
        db: Session,
        status: Optional[OrderStatus] = None,
        buyer_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Order]:
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.payment),
                selectinload(Order.shipping_address),
                selectinload(Order.buyer),
            )
            .order_by(Order.created_at.desc())
        )
        if status is not None:
            stmt = stmt.where(Order.status == status)
        if buyer_id is not None:
            stmt = stmt.where(Order.buyer_id == buyer_id)

        stmt = stmt.offset(skip).limit(limit)
        return db.scalars(stmt).all()
