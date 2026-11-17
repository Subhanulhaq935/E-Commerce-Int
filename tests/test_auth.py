def test_register_buyer_success(client):
    payload = {
        "name": "Naya Buyer",
        "email": "nayabuyer@example.com",
        "password": "Password@123",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["role"] == "buyer"
    assert "password_hash" not in data


def test_register_duplicate_email(client, buyer_user):
    payload = {
        "name": "Ali Khan Duplicate",
        "email": buyer_user.email,
        "password": "Password@123",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 409


def test_register_weak_password(client):
    payload = {
        "name": "Weak Pass User",
        "email": "weak@example.com",
        "password": "123",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success(client, buyer_user):
    response = client.post(
        "/auth/login",
        json={"email": buyer_user.email, "password": "Ali@12345"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, buyer_user):
    response = client.post(
        "/auth/login",
        json={"email": buyer_user.email, "password": "WrongPassword"},
    )
    assert response.status_code == 401


def test_get_me_success(client, buyer_token):
    response = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert response.status_code == 200
    assert response.json()["role"] == "buyer"


def test_get_me_no_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 401
