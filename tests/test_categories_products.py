def test_admin_create_category(client, admin_token):
    response = client.post(
        "/categories/",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Shoes", "description": "Footwear"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Shoes"


def test_buyer_cannot_create_category(client, buyer_token):
    response = client.post(
        "/categories/",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"name": "Hacking", "description": "Block me"},
    )
    assert response.status_code == 403


def test_admin_create_product(client, admin_token, sample_category):
    response = client.post(
        "/products/",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "category_id": sample_category.id,
            "name": "Headphones",
            "description": "Wireless headphones",
            "price": "3000.00",
            "stock": 20,
        },
    )
    assert response.status_code == 201
    assert response.json()["stock"] == 20


def test_public_get_products(client, sample_product):
    response = client.get("/products/")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 1
    assert items[0]["name"] == "Samsung Mobile"


def test_product_detail(client, sample_product):
    response = client.get(f"/products/{sample_product.id}")
    assert response.status_code == 200
    assert response.json()["id"] == sample_product.id


def test_admin_soft_delete_product(client, admin_token, sample_product):
    response = client.delete(
        f"/products/{sample_product.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200

    # Public detail should now return 404
    public_res = client.get(f"/products/{sample_product.id}")
    assert public_res.status_code == 404
