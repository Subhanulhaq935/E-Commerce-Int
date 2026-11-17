def test_non_verified_buyer_cannot_review(client, buyer_token, sample_product):
    response = client.post(
        f"/products/{sample_product.id}/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"rating": 5, "comment": "Nice phone"},
    )
    assert response.status_code == 403
    assert (
        response.json()["detail"]
        == "You can only review products from delivered orders"
    )


def test_verified_buyer_review_flow(
    client, admin_token, buyer_token, sample_product
):
    # 1. Ali orders the phone
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

    # 2. Admin moves order to delivered
    client.patch(
        f"/admin/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "processing"},
    )
    client.patch(
        f"/admin/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "shipped"},
    )
    client.patch(
        f"/admin/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "delivered"},
    )

    # 3. Ali can now review
    rev_res = client.post(
        f"/products/{sample_product.id}/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"rating": 5, "comment": "Great phone!"},
    )
    assert rev_res.status_code == 201
    assert rev_res.json()["user_name"] == "Ali Khan"
    assert rev_res.json()["rating"] == 5

    # 4. Duplicate review blocked
    dup_res = client.post(
        f"/products/{sample_product.id}/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"rating": 4, "comment": "Second review"},
    )
    assert dup_res.status_code == 409

    # 5. Check product stats
    prod_res = client.get(f"/products/{sample_product.id}")
    assert prod_res.status_code == 200
    assert prod_res.json()["average_rating"] == 5.0
    assert prod_res.json()["review_count"] == 1
