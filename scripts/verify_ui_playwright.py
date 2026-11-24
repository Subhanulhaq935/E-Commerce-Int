import os
import json
import time
import subprocess
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.join(os.getcwd(), "playwright_screenshots", "after")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

MOCK_CATEGORIES = [
    {"id": 1, "name": "Electronics", "description": "Premium gadgets & audio"},
    {"id": 2, "name": "Apparel", "description": "Modern streetwear & essentials"},
    {"id": 3, "name": "Accessories", "description": "Watches & everyday carry"},
]

MOCK_PRODUCTS = [
    {
        "id": 1,
        "name": "AeroPulse ANC Wireless Headphones",
        "description": "Studio-grade active noise cancellation with 40-hour battery life, spatial audio, and plush memory foam earcups.",
        "price": 18500.0,
        "sale_price": 14900.0,
        "stock": 14,
        "category_id": 1,
        "is_active": True,
        "has_sizes": False,
        "average_rating": 4.9,
        "review_count": 28,
        "images": [],
        "sizes": [],
    },
    {
        "id": 2,
        "name": "Signature Heavyweight Oversized Hoodie",
        "description": "Crafted from 450GSM organic brushed fleece with drop shoulders and double-lined hood for ultimate everyday comfort.",
        "price": 6500.0,
        "sale_price": 4990.0,
        "stock": 18,
        "category_id": 2,
        "is_active": True,
        "has_sizes": True,
        "average_rating": 4.8,
        "review_count": 42,
        "images": [],
        "sizes": [
            {"id": 1, "size": "S", "stock": 6, "price": 6500.0, "sale_price": 4990.0, "is_available": True},
            {"id": 2, "size": "M", "stock": 8, "price": 6500.0, "sale_price": 4990.0, "is_available": True},
            {"id": 3, "size": "L", "stock": 4, "price": 6800.0, "sale_price": 5290.0, "is_available": True},
        ],
    },
    {
        "id": 3,
        "name": "ChronoMinimalist Sapphire Watch",
        "description": "Brushed 316L stainless steel case with scratch-resistant sapphire crystal and Japanese quartz movement.",
        "price": 24000.0,
        "sale_price": None,
        "stock": 4,
        "category_id": 3,
        "is_active": True,
        "has_sizes": False,
        "average_rating": 5.0,
        "review_count": 19,
        "images": [],
        "sizes": [],
    },
    {
        "id": 4,
        "name": "Essential Structured Oxford Shirt",
        "description": "Tailored modern fit breathable cotton oxford weave suitable for both executive and smart-casual wear.",
        "price": 4500.0,
        "sale_price": 3600.0,
        "stock": 22,
        "category_id": 2,
        "is_active": True,
        "has_sizes": True,
        "average_rating": 4.7,
        "review_count": 15,
        "images": [],
        "sizes": [
            {"id": 4, "size": "S", "stock": 7, "price": 4500.0, "sale_price": 3600.0, "is_available": True},
            {"id": 5, "size": "M", "stock": 10, "price": 4500.0, "sale_price": 3600.0, "is_available": True},
            {"id": 6, "size": "L", "stock": 5, "price": 4500.0, "sale_price": 3600.0, "is_available": True},
        ],
    },
]

MOCK_REVIEWS = [
    {
        "id": 1,
        "product_id": 4,
        "user_name": "Hamza Tariq",
        "rating": 5,
        "comment": "Exceptional fabric quality and stitching! Fits true to size and arrived in Lahore within 24 hours via COD.",
        "is_verified_purchase": True,
        "created_at": "2026-11-20T14:30:00Z",
    },
    {
        "id": 2,
        "product_id": 4,
        "user_name": "Zainab Malik",
        "rating": 5,
        "comment": "Packaging was super premium and the color looks even better in person. Highly recommended store!",
        "is_verified_purchase": True,
        "created_at": "2026-11-18T09:15:00Z",
    },
]

MOCK_TRACKED_ORDER = {
    "id": 508,
    "buyer_id": None,
    "guest_name": "Ahmed Raza",
    "guest_email": "ahmed.raza@example.com",
    "guest_phone": "0300 1234567",
    "guest_address": "House 42, Street 10, DHA Phase 5",
    "guest_city": "Lahore",
    "guest_postal_code": "54792",
    "total_amount": 18500.0,
    "status": "shipped",
    "tracking_token": "sample-token",
    "created_at": "2026-11-23T11:20:00Z",
    "payment": {"id": 1, "payment_method": "COD", "status": "pending", "amount": 18500.0},
    "items": [
        {
            "id": 1,
            "product_id": 1,
            "product_name": "AeroPulse ANC Wireless Headphones",
            "quantity": 1,
            "unit_price": 14900.0,
            "subtotal": 14900.0,
            "size": None,
        },
        {
            "id": 2,
            "product_id": 4,
            "product_name": "Essential Structured Oxford Shirt",
            "quantity": 1,
            "unit_price": 3600.0,
            "subtotal": 3600.0,
            "size": "M",
        },
    ],
}

MOCK_BUYER_USER = {
    "id": 2,
    "name": "Subhan Ul Haq",
    "email": "subhan@example.com",
    "role": "buyer",
    "is_active": True,
    "created_at": "2026-10-01T10:00:00Z",
}

MOCK_ADMIN_USER = {
    "id": 1,
    "name": "Store Administrator",
    "email": "admin@eshop.pk",
    "role": "admin",
    "is_active": True,
    "created_at": "2026-09-01T10:00:00Z",
}

MOCK_CART = {
    "id": 1,
    "user_id": 2,
    "items": [
        {
            "id": 101,
            "product_id": 1,
            "product_name": "AeroPulse ANC Wireless Headphones",
            "quantity": 1,
            "unit_price": 14900.0,
            "original_price": 18500.0,
            "size": None,
            "product": MOCK_PRODUCTS[0],
        },
        {
            "id": 102,
            "product_id": 4,
            "product_name": "Essential Structured Oxford Shirt",
            "quantity": 2,
            "unit_price": 3600.0,
            "original_price": 4500.0,
            "size": "M",
            "product": MOCK_PRODUCTS[3],
        },
    ],
}

MOCK_ADDRESSES = [
    {
        "id": 1,
        "full_name": "Subhan Ul Haq",
        "phone": "0300 9876543",
        "address_line": "Apartment 14B, Gulberg III, Main Boulevard",
        "city": "Lahore",
        "postal_code": "54660",
        "country": "Pakistan",
        "is_default": True,
    }
]


def setup_mock_routes(context, auth_holder):
    def handle_route(route):
        if route.request.resource_type in ("document", "stylesheet", "script", "font", "image"):
            return route.continue_()

        url = route.request.url

        if "/categories" in url:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_CATEGORIES))
        if "/products/4/reviews" in url:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_REVIEWS))
        if "/products/4" in url:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_PRODUCTS[3]))
        if "/admin/products" in url or "/products/" in url:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_PRODUCTS))
        if "/orders/track/" in url:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_TRACKED_ORDER))
        if "/orders/my-orders" in url or "/admin/orders" in url:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps([MOCK_TRACKED_ORDER]))
        if "/admin/users" in url:
            return route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps([MOCK_ADMIN_USER, MOCK_BUYER_USER]),
            )
        if "/addresses" in url:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_ADDRESSES))
        if "/cart" in url:
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_CART))
        if "/auth/me" in url:
            user_obj = auth_holder.get("user") or MOCK_BUYER_USER
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(user_obj))

        return route.continue_()

    context.route("**/*", handle_route)


def run():
    print("Starting Vite preview server for post-improvement verification...")
    server_process = subprocess.Popen(
        ["npm.cmd", "run", "preview", "--", "--port", "4173", "--host", "127.0.0.1"],
        cwd=os.path.join(os.getcwd(), "frontend"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    time.sleep(3)
    base_url = "http://127.0.0.1:4173"

    viewports = {
        "desktop": {"width": 1440, "height": 900},
        "tablet": {"width": 768, "height": 1024},
        "mobile": {"width": 375, "height": 812},
    }

    pages_to_visit = [
        ("home", "/", None),
        ("product_detail", "/products/4", None),
        ("cart", "/cart", MOCK_BUYER_USER),
        ("checkout", "/checkout", None),
        ("login", "/login", None),
        ("register", "/register", None),
        ("track_order", "/track-order/sample-token", None),
        ("my_orders", "/my-orders", MOCK_BUYER_USER),
        ("admin", "/admin", MOCK_ADMIN_USER),
    ]

    console_errors = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            for vp_name, vp_size in viewports.items():
                print(f"\n==========================================")
                print(f"VERIFYING VIEWPORT: {vp_name} ({vp_size['width']}x{vp_size['height']})")
                print(f"==========================================")
                context = browser.new_context(viewport=vp_size)
                auth_holder = {"user": None}
                setup_mock_routes(context, auth_holder)
                page = context.new_page()

                page.on(
                    "console",
                    lambda msg, vp=vp_name: console_errors.append(f"[{vp}] {msg.text}")
                    if msg.type == "error"
                    else None,
                )

                for page_name, route, auth_user in pages_to_visit:
                    auth_holder["user"] = auth_user
                    url = f"{base_url}{route}"
                    try:
                        print(f"Visiting {url} [{vp_name}]...")
                        page.goto(base_url, wait_until="domcontentloaded", timeout=12000)

                        # Hydrate auth or guest cart in localStorage for realistic state
                        if auth_user:
                            page.evaluate(
                                """(u) => {
                                    localStorage.setItem('token', 'mock-jwt-token');
                                    localStorage.setItem('user', JSON.stringify(u));
                                }""",
                                auth_user,
                            )
                        else:
                            page.evaluate(
                                """(cartItems) => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    localStorage.setItem('guest_cart', JSON.stringify({ items: cartItems }));
                                }""",
                                MOCK_CART["items"],
                            )

                        page.goto(url, wait_until="networkidle", timeout=12000)
                        page.wait_for_timeout(600)

                        if page_name == "product_detail":
                            m_btn = page.locator("button:has-text('M')")
                            if m_btn.count() > 0:
                                m_btn.first.click()
                                page.wait_for_timeout(300)

                        shot_path = os.path.join(SCREENSHOTS_DIR, f"{page_name}_{vp_name}.png")
                        page.screenshot(path=shot_path, full_page=True)
                        print(f"  -> Captured: {shot_path}")
                    except Exception as e:
                        print(f"  -> Error on {page_name} [{vp_name}]: {e}")

                if vp_name == "mobile":
                    try:
                        print("Testing mobile hamburger drawer toggle...")
                        page.goto(base_url, wait_until="networkidle")
                        menu_btn = page.locator("button[aria-label='Toggle navigation menu']")
                        if menu_btn.count() > 0:
                            menu_btn.click()
                            page.wait_for_timeout(400)
                            drawer_shot = os.path.join(SCREENSHOTS_DIR, "mobile_drawer_open.png")
                            page.screenshot(path=drawer_shot)
                            print(f"  -> Captured drawer: {drawer_shot}")
                    except Exception as me:
                        print(f"  -> Mobile drawer test error: {me}")

                context.close()
            browser.close()
            print("\nPlaywright visual verification finished!")
            if console_errors:
                print(f"Recorded {len(console_errors)} console errors:")
                for ce in console_errors[:5]:
                    print("  *", ce)
            else:
                print("Zero client console errors detected across all tested viewports!")
    finally:
        server_process.terminate()
        try:
            server_process.wait(timeout=3)
        except Exception:
            server_process.kill()


if __name__ == "__main__":
    run()
