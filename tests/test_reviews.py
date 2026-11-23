def test_authenticated_review_without_delivery(client, buyer_token, sample_product):
    """Authenticated user without delivered purchase can review, but is_verified_purchase is False."""
    response = client.post(
        f"/products/{sample_product.id}/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"rating": 4, "comment": "Nice phone even before delivery"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user_name"] == "Ali Khan"
    assert data["rating"] == 4
    assert data["is_verified_purchase"] is False


def test_verified_buyer_review_flow(
    client, admin_token, buyer_token, sample_product
):
    """Verified buyer after delivery gets is_verified_purchase = True, and duplicate review is blocked."""
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
    for s in ["processing", "shipped", "delivered"]:
        client.patch(
            f"/admin/orders/{order_id}/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": s},
        )

    # 3. Ali can now review as verified buyer
    rev_res = client.post(
        f"/products/{sample_product.id}/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"rating": 5, "comment": "Great phone!"},
    )
    assert rev_res.status_code == 201
    assert rev_res.json()["user_name"] == "Ali Khan"
    assert rev_res.json()["rating"] == 5
    assert rev_res.json()["is_verified_purchase"] is True

    # 4. Duplicate review blocked
    dup_res = client.post(
        f"/products/{sample_product.id}/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"rating": 4, "comment": "Second review"},
    )
    assert dup_res.status_code == 409


def test_guest_review_flow(client, sample_product):
    """Guest visitor can submit review with their name; user_id is null and verified is false."""
    response = client.post(
        f"/products/{sample_product.id}/reviews",
        json={
            "guest_name": "Hamza",
            "rating": 5,
            "comment": "Awesome build quality and display!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user_name"] == "Hamza"
    assert data["user_id"] is None
    assert data["rating"] == 5
    assert data["comment"] == "Awesome build quality and display!"
    assert data["is_verified_purchase"] is False


def test_guest_review_validation(client, sample_product):
    """Guest review must provide a valid name and non-empty comment."""
    # Missing / empty guest name
    res1 = client.post(
        f"/products/{sample_product.id}/reviews",
        json={"rating": 4, "comment": "Nice phone"},
    )
    assert res1.status_code == 422

    # Blank guest name
    res2 = client.post(
        f"/products/{sample_product.id}/reviews",
        json={"guest_name": "   ", "rating": 4, "comment": "Nice phone"},
    )
    assert res2.status_code == 422

    # Empty comment
    res3 = client.post(
        f"/products/{sample_product.id}/reviews",
        json={"guest_name": "Usman", "rating": 4, "comment": "   "},
    )
    assert res3.status_code in [400, 422]

    # Invalid rating
    res4 = client.post(
        f"/products/{sample_product.id}/reviews",
        json={"guest_name": "Usman", "rating": 6, "comment": "Great"},
    )
    assert res4.status_code == 422


def test_combined_reviews_and_product_stats(client, buyer_token, sample_product):
    """Listing returns both guest and authenticated reviews and updates average rating."""
    # 1. Guest review
    client.post(
        f"/products/{sample_product.id}/reviews",
        json={"guest_name": "Bilal", "rating": 4, "comment": "Good quality"},
    )

    # 2. Authenticated user review
    client.post(
        f"/products/{sample_product.id}/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"rating": 5, "comment": "Loved it!"},
    )

    # 3. List reviews
    list_res = client.get(f"/products/{sample_product.id}/reviews")
    assert list_res.status_code == 200
    revs = list_res.json()
    assert len(revs) == 2
    names = {r["user_name"] for r in revs}
    assert "Bilal" in names
    assert "Ali Khan" in names

    # 4. Check product stats (average (4+5)/2 = 4.5, count = 2)
    prod_res = client.get(f"/products/{sample_product.id}")
    assert prod_res.status_code == 200
    assert prod_res.json()["average_rating"] == 4.5
    assert prod_res.json()["review_count"] == 2
