from decimal import Decimal
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.cart import Cart
from app.repositories.cart_repository import CartRepository
from app.repositories.product_repository import ProductRepository
from app.services.product_service import ProductService
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
                effective_price, original_price = ProductService.get_effective_price(
                    product, item.size
                )
                subtotal = effective_price * item.quantity
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
                        unit_price=effective_price,
                        original_price=original_price,
                        size=item.size,
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

        clean_size = data.size.strip() if data.size else None

        # Validate size requirements
        if product.has_sizes:
            if not clean_size:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Please select a size for this product",
                )
            # Find matching size variant
            size_variant = next(
                (
                    s
                    for s in product.sizes
                    if s.size.strip().lower() == clean_size.lower() and s.is_available
                ),
                None,
            )
            if not size_variant:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Selected size '{clean_size}' is not available",
                )
            available_stock = size_variant.stock
        else:
            clean_size = None
            available_stock = product.stock

        cart = CartRepository.get_or_create_cart(db, user_id=user_id)
        existing_item = CartRepository.get_cart_item(
            db, cart_id=cart.id, product_id=data.product_id, size=clean_size
        )

        new_quantity = (
            existing_item.quantity + data.quantity
            if existing_item
            else data.quantity
        )

        # Strict Stock Check
        if new_quantity > available_stock:
            size_label = f" for size {clean_size}" if clean_size else ""
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested quantity is not available in stock{size_label} (Only {available_stock} available)",
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
                size=clean_size,
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

        # Determine available stock
        if product.has_sizes and item.size:
            size_variant = next(
                (
                    s
                    for s in product.sizes
                    if s.size.strip().lower() == item.size.strip().lower() and s.is_available
                ),
                None,
            )
            available_stock = size_variant.stock if size_variant else 0
        else:
            available_stock = product.stock

        # Strict Stock Check
        if data.quantity > available_stock:
            size_label = f" for size {item.size}" if item.size else ""
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested quantity is not available in stock{size_label} (Only {available_stock} available)",
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
            fresh_cart = CartRepository.get_or_create_cart(db, user_id=user_id)
            return cls._format_cart_response(fresh_cart)

        # Buyer Isolation Check
        if item.cart.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to remove this cart item",
            )

        CartRepository.delete_item(db, cart_item=item)

        fresh_cart = CartRepository.get_or_create_cart(db, user_id=user_id)
        return cls._format_cart_response(fresh_cart)
