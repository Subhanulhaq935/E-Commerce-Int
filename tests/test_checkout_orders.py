def test_checkout_empty_cart(client, buyer_token):
    response = client.post(
        "/orders/",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"shipping_address_id": 1},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Cart is empty"


def test_successful_checkout_and_stock_deduction(
    client, buyer_token, sample_product
):
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
    address_id = addr_res.json()["id"]

    # 2. Add to cart (Mobile x 1)
    client.post(
        "/cart/items",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"product_id": sample_product.id, "quantity": 1},
    )

    # 3. Checkout
    order_res = client.post(
        "/orders/",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"shipping_address_id": address_id},
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    assert order_data["status"] == "pending"
    assert order_data["payment"]["payment_method"] == "COD"
    assert order_data["payment"]["status"] == "pending"

    # 4. Stock should be deducted from 10 to 9
    prod_res = client.get(f"/products/{sample_product.id}")
    assert prod_res.json()["stock"] == 9

    # 5. Cart should be cleared
    cart_res = client.get(
        "/cart/", headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert len(cart_res.json()["items"]) == 0


def test_order_workflow_and_auto_payment(
    client, admin_token, buyer_token, sample_product
):
    # Setup order
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

    # Pending -> Processing
    res1 = client.patch(
        f"/admin/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "processing"},
    )
    assert res1.status_code == 200

    # Processing -> Shipped
    res2 = client.patch(
        f"/admin/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "shipped"},
    )
    assert res2.status_code == 200

    # Shipped -> Delivered (Auto Payment Trigger!)
    res3 = client.patch(
        f"/admin/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "delivered"},
    )
    assert res3.status_code == 200
    delivered_data = res3.json()
    assert delivered_data["status"] == "delivered"
    assert delivered_data["payment"]["status"] == "completed"
    assert delivered_data["payment"]["paid_at"] is not None


def test_cancel_order_restores_stock(
    client, admin_token, buyer_token, sample_product
):
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

    # Stock is now 9
    assert client.get(f"/products/{sample_product.id}").json()["stock"] == 9

    # Admin cancels order
    cancel_res = client.patch(
        f"/admin/orders/{order_id}/cancel",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Stock should be restored back to 10!
    assert client.get(f"/products/{sample_product.id}").json()["stock"] == 10
