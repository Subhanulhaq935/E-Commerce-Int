from decimal import Decimal
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.cart import Cart
from app.repositories.cart_repository import CartRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.cart import (
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
)


class CartService:
    @staticmethod
    def _format_cart_response(cart: Cart) -> CartResponse:
        items_response: List[CartItemResponse] = []
        grand_total = Decimal("0.00")

        for item in cart.items:
            product = item.product
            if product:
                unit_price = Decimal(str(product.price))
                subtotal = unit_price * item.quantity
                grand_total += subtotal

                # Primary image select karein
                image_url = None
                if product.images:
                    primary_img = next(
                        (img for img in product.images if img.is_primary),
                        product.images[0],
                    )
                    image_url = primary_img.image_url

                items_response.append(
                    CartItemResponse(
                        id=item.id,
                        product_id=product.id,
                        product_name=product.name,
                        unit_price=unit_price,
                        quantity=item.quantity,
                        subtotal=subtotal,
                        image_url=image_url,
                    )
                )

        return CartResponse(
            id=cart.id,
            items=items_response,
            total=grand_total,
        )

    @classmethod
    def get_cart(cls, db: Session, user_id: int) -> CartResponse:
        cart = CartRepository.get_or_create_cart(db, user_id=user_id)
        return cls._format_cart_response(cart)

    @classmethod
    def add_item(
        cls, db: Session, user_id: int, data: CartItemCreate
    ) -> CartResponse:
        product = ProductRepository.get_by_id(db, data.product_id)
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or inactive",
            )

        cart = CartRepository.get_or_create_cart(db, user_id=user_id)
        existing_item = CartRepository.get_cart_item(
            db, cart_id=cart.id, product_id=data.product_id
        )

        new_quantity = (
            existing_item.quantity + data.quantity
            if existing_item
            else data.quantity
        )

        # Strict Stock Check
        if new_quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Itni quantity available nahi hai",
            )

        if existing_item:
            CartRepository.update_item_quantity(
                db, cart_item=existing_item, quantity=new_quantity
            )
        else:
            CartRepository.add_item(
                db,
                cart_id=cart.id,
                product_id=data.product_id,
                quantity=data.quantity,
            )

        fresh_cart = CartRepository.get_or_create_cart(db, user_id=user_id)
        return cls._format_cart_response(fresh_cart)

    @classmethod
    def update_item_quantity(
        cls, db: Session, user_id: int, item_id: int, data: CartItemUpdate
    ) -> CartResponse:
        item = CartRepository.get_item_by_id(db, item_id=item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )

        # Buyer Isolation Check
        if item.cart.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this cart item",
            )

        product = item.product
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product is no longer available",
            )

        # Strict Stock Check
        if data.quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Itni quantity available nahi hai",
            )

        CartRepository.update_item_quantity(
            db, cart_item=item, quantity=data.quantity
        )

        fresh_cart = CartRepository.get_or_create_cart(db, user_id=user_id)
        return cls._format_cart_response(fresh_cart)

    @classmethod
    def remove_item(
        cls, db: Session, user_id: int, item_id: int
    ) -> CartResponse:
        item = CartRepository.get_item_by_id(db, item_id=item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )

        # Buyer Isolation Check
        if item.cart.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to remove this cart item",
            )

        CartRepository.delete_item(db, cart_item=item)

        fresh_cart = CartRepository.get_or_create_cart(db, user_id=user_id)
        return cls._format_cart_response(fresh_cart)
