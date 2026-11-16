from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product import Product


class CartRepository:
    @staticmethod
    def get_or_create_cart(db: Session, user_id: int) -> Cart:
        cart = db.scalar(
            select(Cart)
            .options(
                selectinload(Cart.items)
                .selectinload(CartItem.product)
                .selectinload(Product.images)
            )
            .where(Cart.user_id == user_id)
        )
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
            # Re-fetch with relationships loaded
            cart = db.scalar(
                select(Cart)
                .options(
                    selectinload(Cart.items)
                    .selectinload(CartItem.product)
                    .selectinload(Product.images)
                )
                .where(Cart.user_id == user_id)
            )
        return cart

    @staticmethod
    def get_cart_item(
        db: Session, cart_id: int, product_id: int
    ) -> Optional[CartItem]:
        return db.scalar(
            select(CartItem)
            .options(
                selectinload(CartItem.product).selectinload(Product.images)
            )
            .where(CartItem.cart_id == cart_id, CartItem.product_id == product_id)
        )

    @staticmethod
    def get_item_by_id(db: Session, item_id: int) -> Optional[CartItem]:
        return db.scalar(
            select(CartItem)
            .options(
                selectinload(CartItem.product).selectinload(Product.images),
                selectinload(CartItem.cart),
            )
            .where(CartItem.id == item_id)
        )

    @staticmethod
    def add_item(
        db: Session, cart_id: int, product_id: int, quantity: int
    ) -> CartItem:
        item = CartItem(cart_id=cart_id, product_id=product_id, quantity=quantity)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_item_quantity(
        db: Session, cart_item: CartItem, quantity: int
    ) -> CartItem:
        cart_item.quantity = quantity
        db.commit()
        db.refresh(cart_item)
        return cart_item

    @staticmethod
    def delete_item(db: Session, cart_item: CartItem) -> None:
        db.delete(cart_item)
        db.commit()

    @staticmethod
    def clear_cart(db: Session, cart_id: int) -> None:
        cart = db.scalar(
            select(Cart).options(selectinload(Cart.items)).where(Cart.id == cart_id)
        )
        if cart:
            for item in cart.items:
                db.delete(item)
            db.commit()
