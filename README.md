<div align="center">

# 🛒 Single-Vendor E-Commerce REST API Backend

**A production-ready, highly secure, transactional E-Commerce Backend built with FastAPI, PostgreSQL, SQLAlchemy ORM, and Alembic.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20DB-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Alembic](https://img.shields.io/badge/Alembic-Migrations-8A2BE2?style=for-the-badge)](https://alembic.sqlalchemy.org)
[![Pytest](https://img.shields.io/badge/Pytest-23%20Passed-4682B4?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Live API Docs (Swagger UI)](https://e-commerce-int.onrender.com/docs) • [ReDoc](https://e-commerce-int.onrender.com/redoc)

</div>

---

## 📖 Overview

Yeh backend ek **Single-Vendor E-Commerce Store** ke liye tayyar kiya gaya hai jahan:
1. **Store Owner hi Admin hai** — Kisi alag third-party seller ka concept nahi hai.
2. **Buyer Strict Isolation** — Har buyer sirf apna cart, addresses, orders aur payments dekh sakta hai.
3. **Strict Stock Validation** — Agar buyer cart ya checkout ke waqt mojooda stock se zyada quantity select kare to foran `400 Bad Request` return hota hai: `{"detail": "Requested quantity is not available in stock"}`.
4. **Deadlock-Free Row-Level Locking** — Concurrency issues aur race conditions se bachne ke liye checkout ke waqt products `SELECT ... FOR UPDATE` se ascending order mein lock hotay hain.
5. **Automatic COD Payment on Delivery** — Jab Admin order deliver mark karta hai, to Cash-On-Delivery payment automatically `completed` ho jati hai aur timestamp record ho jata hai.

---

## 🌟 Core Features

- 🔐 **JWT Authentication & RBAC**: Secure role-based guards (`require_buyer`, `require_admin`).
- 🏬 **Admin Catalog Management**: Category CRUD & Product CRUD with active/inactive soft deletes.
- 🖼️ **Multi-Image Uploads**: Magic bytes file validation, 5MB limit, UUID filenames, aur auto primary promotion.
- 📍 **Buyer Address Book**: Default address auto-toggle aur orders protection ke sath delete.
- 🛍️ **Cart System**: Real-time price calculation, auto subtotal, aur strict stock limits.
- 💳 **Transactional Checkout**: Atomic commit; order creation, stock deduction, payment initialization, aur cart clearing ek hi transaction mein.
- 🔄 **Order Cancellation & Stock Restore**: Admin order cancel kare to tamam items ka stock wapas products mein add ho jata hai.
- ⭐ **Verified Buyer Reviews**: Sirf wahi buyer review de sakta hai jiska order deliver ho chuka ho (aggregate average rating & count ke sath).

---

## 🏗️ Clean Layered Architecture

```
E-Commerce/
├── alembic/                 # Database migration scripts & environments
├── app/
│   ├── core/                # App configuration, security (JWT/Bcrypt) & DB engine
│   ├── dependencies/        # FastApi auth & role guards (require_buyer, require_admin)
│   ├── models/              # 11 SQLAlchemy ORM models & relationships
│   ├── repositories/        # Database query abstractions & data access layer
│   ├── routers/             # 35 API Route controllers (Auth, Products, Cart, Orders, etc.)
│   ├── schemas/             # Pydantic v2 validation models & request/response schemas
│   ├── services/            # Core business logic (Checkout, Auto-payment, Stock lock)
│   └── main.py              # Application entrypoint & Swagger setup
├── scripts/                 # Admin seed & database provisioning utilities
├── tests/                   # Pytest automated test suite (23 integration tests)
├── uploads/                 # Static media directory for product images
├── requirements.txt         # Pinned production dependencies
└── README.md                # Project documentation
```

---

## 🗄️ Database Schema (11 Tables)

| # | Table Name | Key Columns | Purpose |
|---|---|---|---|
| 1 | `users` | `id, name, email, password_hash, role, is_active` | Buyers & Admin authentication |
| 2 | `categories` | `id, name, description` | Product classifications |
| 3 | `products` | `id, category_id, name, price, stock, is_active` | Store products inventory |
| 4 | `product_images` | `id, product_id, image_url, is_primary` | Product image gallery (Max 5) |
| 5 | `carts` | `id, user_id` | Buyer persistent shopping carts |
| 6 | `cart_items` | `id, cart_id, product_id, quantity` | Cart line items |
| 7 | `addresses` | `id, user_id, full_name, phone, address_line, city` | Delivery shipping addresses |
| 8 | `orders` | `id, buyer_id, shipping_address_id, total_amount, status` | Customer purchase orders |
| 9 | `order_items` | `id, order_id, product_id, product_name, unit_price, quantity` | Order snapshots for price safety |
| 10 | `payments` | `id, order_id, amount, payment_method, status, paid_at` | Cash-on-Delivery payment records |
| 11 | `reviews` | `id, user_id, product_id, rating, comment` | Verified customer feedback |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.11+
- Git

### 2. Setup Local Environment
```bash
# Clone the repository
git clone https://github.com/Subhanulhaq935/E-Commerce-Int.git
cd E-Commerce-Int

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1    # On Windows PowerShell
# source venv/bin/activate     # On Linux / macOS

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables (`.env`)
Create a `.env` file in the project root:
```ini
DATABASE_URL=postgresql+psycopg2://<user>:<password>@<host>/<database>
SECRET_KEY=your-secure-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
UPLOAD_DIR=uploads
MAX_IMAGE_SIZE_MB=5
MAX_IMAGES_PER_PRODUCT=5
DELIVERY_CHARGE=0
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-secure-admin-password
```

### 4. Database Migrations & Admin Seed
```bash
# Apply all 11 database tables via Alembic
alembic upgrade head

# Seed store admin account
python -m scripts.create_admin
```

### 5. Start the Server
```bash
uvicorn app.main:app --reload
```
Interactive Documentation:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📋API Reference (Total 35 Endpoints)

<details>
<summary><b>Click to expand full 35 API Endpoints Table</b></summary>

| Category | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| **Health** | `GET` | `/health` | Public | Server health status |
| | `GET` | `/health/db` | Public | Database connection check |
| **Auth** | `POST` | `/auth/register` | Public | Register new buyer account |
| | `POST` | `/auth/login` | Public | Authenticate user & get JWT |
| | `GET` | `/auth/me` | Logged In | Get current user profile |
| **Categories**| `GET` | `/categories/` | Public | List all categories |
| | `POST` | `/categories/` | Admin | Create new category |
| | `PUT` | `/categories/{id}` | Admin | Update category details |
| | `DELETE`| `/categories/{id}` | Admin | Delete category (with product check) |
| **Products** | `GET` | `/products/` | Public | List active products (Filters/Search) |
| | `GET` | `/products/{id}` | Public | Product details with rating stats |
| | `POST` | `/products/` | Admin | Create product with stock |
| | `PUT` | `/products/{id}` | Admin | Update product & stock |
| | `DELETE`| `/products/{id}` | Admin | Soft delete product (`is_active=false`) |
| | `GET` | `/admin/products` | Admin | View all products (including inactive) |
| **Images** | `POST` | `/products/{id}/images` | Admin | Upload up to 5 validated images |
| | `DELETE`| `/product-images/{id}` | Admin | Delete image (disk & DB) & reassign primary |
| **Addresses** | `GET` | `/addresses/` | Buyer | List buyer saved addresses |
| | `POST` | `/addresses/` | Buyer | Add new delivery address |
| | `PUT` | `/addresses/{id}` | Buyer | Update delivery address |
| | `DELETE`| `/addresses/{id}` | Buyer | Delete address (order history safe) |
| **Cart** | `GET` | `/cart/` | Buyer | View cart with subtotals & grand total |
| | `POST` | `/cart/items` | Buyer | Add item (with strict stock check) |
| | `PATCH`| `/cart/items/{id}` | Buyer | Update quantity (with stock check) |
| | `DELETE`| `/cart/items/{id}` | Buyer | Remove item from cart |
| **Orders** | `POST` | `/orders/` | Buyer | Transactional checkout (stock deduction) |
| | `GET` | `/orders/my-orders` | Buyer | View buyer order history |
| | `GET` | `/orders/{id}` | Buyer/Admin | View order details, items & payment |
| | `GET` | `/admin/orders` | Admin | List all orders with filters |
| **Admin** | `PATCH`| `/admin/orders/{id}/status` | Admin | Status workflow (`pending` ➔ `processing` ➔ `shipped` ➔ `delivered` with auto-payment) |
| | `PATCH`| `/admin/orders/{id}/cancel` | Admin | Cancel order & restore stock |
| | `GET` | `/admin/users` | Admin | List registered users |
| | `PATCH`| `/admin/users/{id}/status` | Admin | Activate / deactivate user account |
| **Payments** | `GET` | `/payments/{id}` | Buyer/Admin | View payment record (Buyer isolation) |
| **Reviews** | `POST` | `/products/{id}/reviews`| Buyer | Add review (Verified purchases only) |
| | `GET` | `/products/{id}/reviews`| Public | List reviews with average rating |

</details>

---

## 🧪 Automated Testing

Project includes a comprehensive test suite written with **Pytest**:

```bash
# Run all tests with verbose output
pytest -v
```

### Test Coverage Results
```
============================ test session starts ============================
tests/test_auth.py .................................. [ 30%]
tests/test_cart_address.py .......................... [ 47%]
tests/test_categories_products.py .................. [ 73%]
tests/test_checkout_orders.py ....................... [ 91%]
tests/test_reviews.py ............................... [100%]

====================== 23 passed in 10.70s ======================
```

---

## 🔒 Security & Best Practices

- 🛡️ **Zero Secret Leaks**: Secrets strictly read from `.env`, never hardcoded or tracked in Git.
- 🔑 **Cryptographic Hashing**: Passwords hashed using industry-standard `bcrypt`.
- ⚡ **Magic Bytes File Sniffing**: Prevents malicious file uploads disguised as images.
- 🚫 **Role Tampering Protection**: Public registration strictly restricted to buyer role.
