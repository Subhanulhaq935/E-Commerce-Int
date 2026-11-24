from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest

from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.user import User
from app.models.address import Address
from app.services.email_service import EmailService


def test_authenticated_order_context_extraction():
    """Test that _extract_order_context extracts registered user details correctly"""
    buyer = User(id=1, name="Ahmed Khan", email="ahmed.khan@example.com")
    shipping_addr = Address(
        id=1,
        user_id=1,
        full_name="Ahmed Khan (Home)",
        phone="03001234567",
        address_line="Flat 402, Block 5, Gulshan",
        city="Karachi",
        postal_code="75300",
        country="Pakistan",
    )
    order = Order(
        id=501,
        buyer_id=1,
        shipping_address_id=1,
        total_amount=Decimal("12500.00"),
        status=OrderStatus.pending,
        tracking_token="secure_token_auth_501",
    )
    order.buyer = buyer
    order.shipping_address = shipping_addr

    item1 = OrderItem(
        id=1,
        order_id=501,
        product_id=10,
        product_name="Wireless Headphones",
        quantity=2,
        unit_price=Decimal("5000.00"),
        subtotal=Decimal("10000.00"),
        size=None,
    )
    item2 = OrderItem(
        id=2,
        order_id=501,
        product_id=11,
        product_name="Phone Case",
        quantity=1,
        unit_price=Decimal("2500.00"),
        subtotal=Decimal("2500.00"),
        size="Pro Max",
    )
    order.items = [item1, item2]

    ctx = EmailService._extract_order_context(order)
    assert ctx is not None
    assert ctx["recipient_email"] == "ahmed.khan@example.com"
    assert ctx["customer_name"] == "Ahmed Khan"
    assert "Flat 402, Block 5, Gulshan, Karachi, 75300" in ctx["shipping_address_str"]
    assert ctx["shipping_phone"] == "03001234567"
    assert "Wireless Headphones" in ctx["items_rows_html"]
    assert "Phone Case" in ctx["items_rows_html"]
    assert "Size: Pro Max" in ctx["items_rows_html"]
    assert "track-order/secure_token_auth_501" in ctx["tracking_link"]
    assert ctx["is_authenticated"] is True


def test_guest_order_context_extraction():
    """Test that _extract_order_context extracts guest details correctly"""
    order = Order(
        id=502,
        buyer_id=None,
        shipping_address_id=None,
        guest_name="Sara Guest",
        guest_email="sara.guest@example.com",
        guest_phone="03129876543",
        guest_address="House 88, Street 4, F-8/2",
        guest_city="Islamabad",
        guest_postal_code="44000",
        total_amount=Decimal("3500.00"),
        status=OrderStatus.pending,
        tracking_token="secure_token_guest_502",
    )
    order.buyer = None
    order.shipping_address = None

    item1 = OrderItem(
        id=3,
        order_id=502,
        product_id=15,
        product_name="Casual T-Shirt",
        quantity=1,
        unit_price=Decimal("3500.00"),
        subtotal=Decimal("3500.00"),
        size="Large",
    )
    order.items = [item1]

    ctx = EmailService._extract_order_context(order)
    assert ctx is not None
    assert ctx["recipient_email"] == "sara.guest@example.com"
    assert ctx["customer_name"] == "Sara Guest"
    assert "House 88, Street 4, F-8/2, Islamabad, 44000" in ctx["shipping_address_str"]
    assert ctx["shipping_phone"] == "03129876543"
    assert "Casual T-Shirt" in ctx["items_rows_html"]
    assert "Size: Large" in ctx["items_rows_html"]
    assert "track-order/secure_token_guest_502" in ctx["tracking_link"]
    assert ctx["is_authenticated"] is False


def test_send_order_confirmation_authenticated(mock_email_dispatch):
    """Test send_order_confirmation for registered customer"""
    buyer = User(id=2, name="Bilal Raza", email="bilal.raza@example.com")
    shipping_addr = Address(
        id=2,
        user_id=2,
        full_name="Bilal Raza",
        phone="03211234567",
        address_line="Main Boulevard",
        city="Lahore",
        postal_code="54000",
        country="Pakistan",
    )
    order = Order(
        id=601,
        buyer_id=2,
        shipping_address_id=2,
        total_amount=Decimal("8000.00"),
        status=OrderStatus.pending,
        tracking_token="token_bilal_601",
    )
    order.buyer = buyer
    order.shipping_address = shipping_addr
    order.items = []

    res = EmailService.send_order_confirmation(order)
    assert res is True
    assert mock_email_dispatch.called
    kwargs = mock_email_dispatch.call_args.kwargs
    assert kwargs["recipient_email"] == "bilal.raza@example.com"
    assert kwargs["customer_name"] == "Bilal Raza"
    assert "Order #601 Confirmed" in kwargs["subject"]
    assert "Order #601 Confirmed Successfully!" in kwargs["html_content"]


def test_send_order_status_update_all_transitions(mock_email_dispatch):
    """Test status update email generation for Processing, Shipped, Delivered, Cancelled"""
    buyer = User(id=3, name="Fatima Zahra", email="fatima.zahra@example.com")
    shipping_addr = Address(
        id=3,
        user_id=3,
        full_name="Fatima Zahra",
        phone="03331112233",
        address_line="DHA Phase 6",
        city="Lahore",
        postal_code="54000",
        country="Pakistan",
    )
    order = Order(
        id=701,
        buyer_id=3,
        shipping_address_id=3,
        total_amount=Decimal("15000.00"),
        status=OrderStatus.pending,
        tracking_token="token_fatima_701",
    )
    order.buyer = buyer
    order.shipping_address = shipping_addr
    order.items = []

    # 1. Processing
    order.status = OrderStatus.processing
    res = EmailService.send_order_status_update(
        order, new_status=OrderStatus.processing, old_status=OrderStatus.pending
    )
    assert res is True
    kwargs = mock_email_dispatch.call_args.kwargs
    assert kwargs["recipient_email"] == "fatima.zahra@example.com"
    assert "Order #701 is Now Processing" in kwargs["subject"]
    assert "Processing" in kwargs["html_content"]

    # 2. Shipped
    order.status = OrderStatus.shipped
    res = EmailService.send_order_status_update(
        order, new_status=OrderStatus.shipped, old_status=OrderStatus.processing
    )
    assert res is True
    kwargs = mock_email_dispatch.call_args.kwargs
    assert kwargs["recipient_email"] == "fatima.zahra@example.com"
    assert "Order #701 Has Been Shipped!" in kwargs["subject"]
    assert "Shipped" in kwargs["html_content"]

    # 3. Delivered
    order.status = OrderStatus.delivered
    res = EmailService.send_order_status_update(
        order, new_status=OrderStatus.delivered, old_status=OrderStatus.shipped
    )
    assert res is True
    kwargs = mock_email_dispatch.call_args.kwargs
    assert kwargs["recipient_email"] == "fatima.zahra@example.com"
    assert "Order #701 Has Been Delivered" in kwargs["subject"]
    assert "Delivered" in kwargs["html_content"]

    # 4. Cancelled
    order.status = OrderStatus.cancelled
    res = EmailService.send_order_status_update(
        order, new_status=OrderStatus.cancelled, old_status=OrderStatus.pending
    )
    assert res is True
    kwargs = mock_email_dispatch.call_args.kwargs
    assert kwargs["recipient_email"] == "fatima.zahra@example.com"
    assert "Order #701 Has Been Cancelled" in kwargs["subject"]
    assert "Cancelled" in kwargs["html_content"]


def test_authenticated_checkout_triggers_email(client, buyer_token, sample_product, mock_email_dispatch):
    """End-to-end: Registered buyer checkout dispatches confirmation email to registered account email"""
    # 1. Add Address
    addr_res = client.post(
        "/addresses/",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={
            "full_name": "Ali Khan",
            "phone": "03001234567",
            "address_line": "House 12",
            "city": "Lahore",
            "postal_code": "54000",
        },
    )
    assert addr_res.status_code == 201
    address_id = addr_res.json()["id"]

    # 2. Add item to cart
    client.post(
        "/cart/items",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"product_id": sample_product.id, "quantity": 1},
    )

    # 3. Checkout
    mock_email_dispatch.reset_mock()
    order_res = client.post(
        "/orders/",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"shipping_address_id": address_id},
    )
    assert order_res.status_code == 201
    assert mock_email_dispatch.called
    kwargs = mock_email_dispatch.call_args.kwargs
    # Registered user's email was used from database!
    assert kwargs["recipient_email"] == "alitest@example.com"
    assert kwargs["customer_name"] == "Ali Khan"
    assert f"Order #{order_res.json()['id']} Confirmed" in kwargs["subject"]


def test_admin_status_update_triggers_email(client, admin_token, buyer_token, sample_product, mock_email_dispatch):
    """End-to-end: Admin status transitions trigger status emails to registered buyer"""
    # 1. Setup order
    addr_res = client.post(
        "/addresses/",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={
            "full_name": "Ali Khan",
            "phone": "03001234567",
            "address_line": "House 12",
            "city": "Lahore",
            "postal_code": "54000",
        },
    )
    client.post(
        "/cart/items",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"product_id": sample_product.id, "quantity": 1},
    )
    order_res = client.post(
        "/orders/",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"shipping_address_id": addr_res.json()["id"]},
    )
    order_id = order_res.json()["id"]

    # 2. Transition Pending -> Processing
    mock_email_dispatch.reset_mock()
    res = client.patch(
        f"/admin/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "processing"},
    )
    assert res.status_code == 200
    assert mock_email_dispatch.called
    kwargs = mock_email_dispatch.call_args.kwargs
    assert kwargs["recipient_email"] == "alitest@example.com"
    assert f"Order #{order_id} is Now Processing" in kwargs["subject"]

    # 3. Transition Processing -> Shipped
    mock_email_dispatch.reset_mock()
    res2 = client.patch(
        f"/admin/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "shipped"},
    )
    assert res2.status_code == 200
    assert mock_email_dispatch.called
    kwargs2 = mock_email_dispatch.call_args.kwargs
    assert kwargs2["recipient_email"] == "alitest@example.com"
    assert f"Order #{order_id} Has Been Shipped!" in kwargs2["subject"]

    # 4. Transition Shipped -> Delivered
    mock_email_dispatch.reset_mock()
    res3 = client.patch(
        f"/admin/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "delivered"},
    )
    assert res3.status_code == 200
    assert mock_email_dispatch.called
    kwargs3 = mock_email_dispatch.call_args.kwargs
    assert kwargs3["recipient_email"] == "alitest@example.com"
    assert f"Order #{order_id} Has Been Delivered" in kwargs3["subject"]


def test_guest_checkout_and_status_update_email(client, admin_token, sample_product, mock_email_dispatch):
    """End-to-end: Guest checkout and status update both send email to guest_email"""
    # 1. Guest checkout
    mock_email_dispatch.reset_mock()
    res = client.post(
        "/orders/guest",
        json={
            "guest_name": "Guest Customer",
            "guest_email": "guest.customer@example.com",
            "guest_phone": "03009998877",
            "guest_address": "Street 10, G-9",
            "guest_city": "Islamabad",
            "guest_postal_code": "44000",
            "items": [{"product_id": sample_product.id, "quantity": 1}],
        },
    )
    assert res.status_code == 201
    guest_order_id = res.json()["id"]
    assert mock_email_dispatch.called
    kwargs = mock_email_dispatch.call_args.kwargs
    assert kwargs["recipient_email"] == "guest.customer@example.com"
    assert kwargs["customer_name"] == "Guest Customer"
    assert f"Order #{guest_order_id} Confirmed" in kwargs["subject"]

    # 2. Admin updates guest order status to processing
    mock_email_dispatch.reset_mock()
    res_status = client.patch(
        f"/admin/orders/{guest_order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "processing"},
    )
    assert res_status.status_code == 200
    assert mock_email_dispatch.called
    kwargs_status = mock_email_dispatch.call_args.kwargs
    assert kwargs_status["recipient_email"] == "guest.customer@example.com"
    assert f"Order #{guest_order_id} is Now Processing" in kwargs_status["subject"]


def test_admin_checkout_email_uses_checkout_form_email(client, admin_token, sample_product, mock_email_dispatch):
    """Admin placing an order via checkout form sends confirmation and status emails to checkout email, not admin profile email"""
    # 1. Admin adds item to cart
    add_res = client.post(
        "/cart/items",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"product_id": sample_product.id, "quantity": 1},
    )
    assert add_res.status_code == 200

    # 2. Admin places order entering a different customer/contact email in checkout form
    mock_email_dispatch.reset_mock()
    order_res = client.post(
        "/orders/",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "guest_name": "Checkout Recipient",
            "guest_email": "checkout.recipient@example.com",
            "guest_phone": "03001112233",
            "guest_address": "House 99, Model Town",
            "guest_city": "Lahore",
            "guest_postal_code": "54000",
        },
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    order_id = order_data["id"]
    assert order_data["buyer_id"] is not None
    assert order_data["guest_email"] == "checkout.recipient@example.com"

    # Confirmation email must go to checkout.recipient@example.com (not admin@test.com)
    assert mock_email_dispatch.called
    assert mock_email_dispatch.call_count == 1
    kwargs = mock_email_dispatch.call_args.kwargs
    assert kwargs["recipient_email"] == "checkout.recipient@example.com"
    assert kwargs["customer_name"] == "Checkout Recipient"
    assert f"Order #{order_id} Confirmed" in kwargs["subject"]

    # 3. Admin updates order status -> status email must also go to checkout.recipient@example.com
    mock_email_dispatch.reset_mock()
    status_res = client.patch(
        f"/admin/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "processing"},
    )
    assert status_res.status_code == 200
    assert mock_email_dispatch.called
    kwargs_status = mock_email_dispatch.call_args.kwargs
    assert kwargs_status["recipient_email"] == "checkout.recipient@example.com"
    assert f"Order #{order_id} is Now Processing" in kwargs_status["subject"]

    # 4. Order appears in Admin's My Orders
    my_orders_res = client.get(
        "/orders/my-orders",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert my_orders_res.status_code == 200
    assert any(o["id"] == order_id for o in my_orders_res.json())
