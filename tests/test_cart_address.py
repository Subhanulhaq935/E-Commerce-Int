def test_create_address_success(client, buyer_token):
    payload = {
        "full_name": "Ali Khan",
        "phone": "03001234567",
        "address_line": "House 12, Street 5",
        "city": "Lahore",
        "postal_code": "54000",
        "country": "Pakistan",
        "is_default": True,
    }
    response = client.post(
        "/addresses/",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json=payload,
    )
    assert response.status_code == 201
    assert response.json()["is_default"] is True


def test_address_buyer_isolation(client, buyer_token, buyer2_token):
    # Buyer 1 adds address
    payload = {
        "full_name": "Ali Khan",
        "phone": "03001234567",
        "address_line": "House 12",
        "city": "Lahore",
        "postal_code": "54000",
    }
    res1 = client.post(
        "/addresses/",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json=payload,
    )
    addr_id = res1.json()["id"]

    # Buyer 2 attempts to delete Buyer 1's address
    res2 = client.delete(
        f"/addresses/{addr_id}",
        headers={"Authorization": f"Bearer {buyer2_token}"},
    )
    assert res2.status_code in (403, 404)


def test_cart_strict_stock_check(client, buyer_token, sample_product):
    # Sample product stock is 10. Attempting to add 11 must fail with 400
    response = client.post(
        "/cart/items",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"product_id": sample_product.id, "quantity": 11},
    )
    assert response.status_code == 400
    assert "Requested quantity is not available in stock" in response.json()["detail"]


def test_cart_add_and_view(client, buyer_token, sample_product):
    # Add valid quantity (1)
    response = client.post(
        "/cart/items",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"product_id": sample_product.id, "quantity": 1},
    )
    assert response.status_code == 200
    assert len(response.json()["items"]) == 1
    assert float(response.json()["total"]) == 50000.00
