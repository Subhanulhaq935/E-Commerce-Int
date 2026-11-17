# Single-Vendor E-Commerce Backend

Production-ready, robust, aur transactional Single-Vendor E-Commerce REST API Backend jo **FastAPI**, **PostgreSQL**, **SQLAlchemy ORM**, aur **Alembic Migrations** par mabni hai.

---

## 🌟 Key Features & Architecture
- **Single-Vendor Architecture**: Store owner khud Admin hai (koi separate seller role nahi).
- **Strict Stock Quantity Validation**: Cart addition ya checkout par stock se zyada quantity mangne par `400 Bad Request` with `{"detail": "Itni quantity available nahi hai"}`.
- **Row-Level Stock Locking (`SELECT ... FOR UPDATE`)**: Deadlock-free concurrent checkout prevention.
- **Atomic Transactional Checkout**: Single order, order items snapshots (historical price retention), COD payment creation, aur stock deduction ek hi DB transaction mein.
- **Automatic Payment Completion**: Admin jab order status ko `delivered` kare, to payment ka status khud-ba-khud `completed` ho jata hai aur `paid_at` timestamp set hota hai.
- **Order Cancellation & Stock Restoration**: Cancel hone par items ka stock wapas products mein restore hota hai.
- **Verified Buyer Product Reviews**: Sirf wahi buyer review de sakta hai jiska product deliver ho chuka ho.
- **Multiple Product Image Uploads**: Magic bytes verification, 5MB limit, UUID filenames, aur primary image management.

---

## 🛠️ Tech Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (Neon Cloud / Local)
- **ORM & Migrations**: SQLAlchemy 2.0, Alembic
- **Validation**: Pydantic v2, Pydantic-Settings
- **Security**: OAuth2 Password Bearer, JWT (python-jose), Passlib (Bcrypt)
- **Testing**: Pytest, HTTPX, FastAPI TestClient

---

## 🗄️ Database Tables (11 Tables)
1. `users` (id, name, email, password_hash, role [buyer, admin], is_active, created_at)
2. `categories` (id, name, description, created_at)
3. `products` (id, category_id, name, description, price, stock, is_active, created_at, updated_at)
4. `product_images` (id, product_id, image_url, is_primary, created_at)
5. `carts` (id, user_id, created_at, updated_at)
6. `cart_items` (id, cart_id, product_id, quantity, created_at, updated_at)
7. `addresses` (id, user_id, full_name, phone, address_line, city, postal_code, country, is_default)
8. `orders` (id, buyer_id, shipping_address_id, total_amount, status, created_at, updated_at)
9. `order_items` (id, order_id, product_id, product_name, quantity, unit_price, subtotal)
10. `payments` (id, order_id, amount, payment_method [COD], status [pending, completed], paid_at, created_at)
11. `reviews` (id, user_id, product_id, rating [1..5], comment, created_at)

---

## 🚀 Setup & Local Installation

### 1. Clone & Virtual Environment
```bash
git clone https://github.com/Subhanulhaq935/E-Commerce-Int.git
cd E-Commerce-Int
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# source venv/bin/activate    # Linux / Mac
pip install -r requirements.txt
```

### 2. Environment Variables (.env)
```ini
DATABASE_URL=postgresql+psycopg2://<user>:<password>@<host>/<database>
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
UPLOAD_DIR=uploads
MAX_IMAGE_SIZE_MB=5
MAX_IMAGES_PER_PRODUCT=5
DELIVERY_CHARGE=0
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@12345
```

### 3. Database Migrations
```bash
alembic upgrade head
```

### 4. Create Initial Store Admin
```bash
python -m scripts.create_admin
```

### 5. Run Server
```bash
uvicorn app.main:app --reload
```
- Swagger UI Docs: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## 📋 Master API Reference (Total 35 Endpoints)

### 1. Health (2 Endpoints)
- `GET /health`: Server status (Public)
- `GET /health/db`: Database connection health (Public)

### 2. Authentication (3 Endpoints)
- `POST /auth/register`: Buyer registration (Public)
- `POST /auth/login`: Login & receive JWT (Public)
- `GET /auth/me`: Current logged-in user profile (Any Auth)

### 3. Categories (4 Endpoints)
- `GET /categories/`: List all categories (Public)
- `POST /categories/`: Create category (Admin)
- `PUT /categories/{id}`: Update category (Admin)
- `DELETE /categories/{id}`: Delete category (Admin)

### 4. Products & Images (8 Endpoints)
- `GET /products/`: List active products with filters & search (Public)
- `GET /products/{id}`: Product detail with rating stats (Public)
- `POST /products/`: Create product with initial stock (Admin)
- `PUT /products/{id}`: Update product & stock (Admin)
- `DELETE /products/{id}`: Soft delete product (Admin)
- `GET /admin/products`: View all products including inactive (Admin)
- `POST /products/{id}/images`: Upload up to 5 images with validation (Admin)
- `DELETE /product-images/{id}`: Delete image & promote next primary (Admin)

### 5. Addresses (4 Endpoints)
- `GET /addresses/`: List buyer saved addresses (Buyer)
- `POST /addresses/`: Add new delivery address (Buyer)
- `PUT /addresses/{id}`: Update address (Buyer)
- `DELETE /addresses/{id}`: Delete address (Buyer)

### 6. Cart Management (4 Endpoints)
- `GET /cart/`: View cart with items, images & total (Buyer)
- `POST /cart/items`: Add to cart with strict stock validation (Buyer)
- `PATCH /cart/items/{id}`: Update item quantity with stock validation (Buyer)
- `DELETE /cart/items/{id}`: Remove item from cart (Buyer)

### 7. Orders & Checkout (4 Endpoints)
- `POST /orders/`: Transactional checkout & stock deduction (Buyer)
- `GET /orders/my-orders`: Buyer order history (Buyer)
- `GET /orders/{id}`: Order details + items + payment (Buyer/Admin)
- `GET /admin/orders`: List all orders with filters (Admin)

### 8. Admin Controls & Status Workflow (3 Endpoints)
- `PATCH /admin/orders/{id}/status`: Status transition & Auto payment completion (Admin)
- `PATCH /admin/orders/{id}/cancel`: Cancel order & restore stock (Admin)
- `PATCH /admin/users/{id}/status`: Activate / deactivate user (Admin)

### 9. Payments (1 Endpoint)
- `GET /payments/{id}`: View payment details with isolation (Buyer/Admin)

### 10. Reviews (2 Endpoints)
- `POST /products/{id}/reviews`: Verified buyer review & rating (Buyer)
- `GET /products/{id}/reviews`: List product reviews (Public)

---

## 🧪 Automated Testing
Run the complete Pytest suite (covers all 15 test scenarios):
```bash
pytest -v
```
