import os
import re
import time
import subprocess
import json
from playwright.sync_api import sync_playwright

ADMIN_USER = {
    "id": 1,
    "name": "Admin Store",
    "email": "admin@store.com",
    "role": "admin",
    "is_active": True,
}

SAMPLE_PRODUCT = {
    "id": 3,
    "category_id": 3,
    "name": "Nike Shoes",
    "description": "Running sports shoes",
    "price": "8000.00",
    "sale_price": None,
    "has_sizes": False,
    "stock": 5,
    "is_active": True,
    "images": [
        {
            "id": 9,
            "image_url": "https://res.cloudinary.com/v5m0qvyc/image/upload/v1795091202/ecommerce/products/3/qigrflgfrckw0w3twn3b.jpg",
            "is_primary": True,
        }
    ],
    "sizes": [],
    "average_rating": 4.0,
    "review_count": 2,
}

def main():
    print("Starting Vite preview server on port 4175...")
    proc = subprocess.Popen(
        ["npm.cmd", "run", "preview", "--", "--port", "4175", "--host", "127.0.0.1"],
        cwd=os.path.join(os.getcwd(), "frontend"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    time.sleep(3)

    # Stateful mock backend DB
    db_state = {
        "cart": {"id": 10, "items": [], "total": "0.00"},
        "orders": [],
        "next_order_id": 501,
    }

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()

            page.add_init_script(f"""
                localStorage.setItem('token', 'fake-admin-jwt');
                localStorage.setItem('user', '{json.dumps(ADMIN_USER)}');
            """)

            def handle_routes(route):
                url = route.request.url
                method = route.request.method

                if "/auth/me" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(ADMIN_USER))
                elif "/reviews" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([]))
                elif "/products/3" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_PRODUCT))
                elif "/products" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([SAMPLE_PRODUCT]))
                elif "/categories" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([{"id": 3, "name": "Shoes"}]))
                elif "/cart/items" in url and method == "POST":
                    data = json.loads(route.request.post_data)
                    qty = data.get("quantity", 1)
                    item = {
                        "id": 901,
                        "product_id": 3,
                        "product_name": "Nike Shoes",
                        "unit_price": "8000.00",
                        "original_price": None,
                        "size": None,
                        "quantity": qty,
                        "subtotal": f"{8000 * qty:.2f}",
                        "image_url": SAMPLE_PRODUCT["images"][0]["image_url"],
                        "available_stock": 5,
                    }
                    db_state["cart"]["items"] = [item]
                    db_state["cart"]["total"] = item["subtotal"]
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(db_state["cart"]))
                elif "/cart" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(db_state["cart"]))
                elif "/orders/my-orders" in url and method == "GET":
                    my_orders = [o for o in db_state["orders"] if o["buyer_id"] == ADMIN_USER["id"]]
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(my_orders))
                elif "/orders/" in url and method == "POST":
                    data = json.loads(route.request.post_data)
                    order_id = db_state["next_order_id"]
                    db_state["next_order_id"] += 1
                    new_order = {
                        "id": order_id,
                        "buyer_id": ADMIN_USER["id"],
                        "shipping_address_id": None,
                        "total_amount": "8000.00",
                        "status": "pending",
                        "created_at": "2026-11-24T12:00:00Z",
                        "guest_name": data["guest_name"],
                        "guest_email": data["guest_email"],
                        "guest_phone": data["guest_phone"],
                        "guest_address": data["guest_address"],
                        "guest_city": data["guest_city"],
                        "guest_postal_code": data.get("guest_postal_code"),
                        "tracking_token": f"tok_{order_id}",
                        "buyer": ADMIN_USER,
                        "shipping_address": None,
                        "payment": {
                            "id": order_id,
                            "order_id": order_id,
                            "amount": "8000.00",
                            "payment_method": "COD",
                            "status": "pending",
                            "paid_at": None,
                            "created_at": "2026-11-24T12:00:00Z",
                        },
                        "items": [
                            {
                                "id": 1,
                                "product_id": 3,
                                "product_name": "Nike Shoes",
                                "size": None,
                                "quantity": 1,
                                "unit_price": "8000.00",
                                "subtotal": "8000.00",
                            }
                        ],
                    }
                    db_state["orders"].append(new_order)
                    db_state["cart"] = {"id": 10, "items": [], "total": "0.00"}
                    route.fulfill(status=201, content_type="application/json", body=json.dumps(new_order))
                elif "/admin/orders/" in url and "/status" in url and method == "PATCH":
                    # Simulate 400ms backend latency to test rapid sequential clicks without reverting!
                    time.sleep(0.4)
                    data = json.loads(route.request.post_data)
                    new_status = data["status"]
                    ord_id = int(re.search(r"/admin/orders/(\d+)/status", url).group(1))
                    target = next(o for o in db_state["orders"] if o["id"] == ord_id)
                    allowed = {
                        "pending": ["processing"],
                        "processing": ["shipped"],
                        "shipped": ["delivered"],
                    }
                    if new_status not in allowed.get(target["status"], []):
                        route.fulfill(status=400, content_type="application/json", body=json.dumps({"detail": "Invalid status transition"}))
                        return
                    target["status"] = new_status
                    if new_status == "delivered":
                        target["payment"]["status"] = "completed"
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(target))
                elif "/admin/orders" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(db_state["orders"]))
                elif "/admin/products" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([SAMPLE_PRODUCT]))
                elif "/admin/users" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([ADMIN_USER]))
                else:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([]))

            context.route(re.compile(r".*(8000|onrender).*"), handle_routes)

            # 1. Admin browses product and adds to cart
            print("\n1. Admin adds product to cart...")
            page.goto("http://127.0.0.1:4175/products/3", wait_until="networkidle")
            assert page.locator("a[href='/cart']").first.is_visible(), "Cart link must be visible for Admin!"
            assert page.locator("a[href='/my-orders']").first.is_visible(), "My Orders link must be visible for Admin!"
            page.locator("button:has-text('Add to Cart')").click()
            page.wait_for_selector("text=Added to cart")
            print("PASS: Admin added product to cart.")

            # 2. Admin proceeds to checkout and sees customer details form
            print("\n2. Admin proceeds to /cart -> /checkout...")
            page.goto("http://127.0.0.1:4175/cart", wait_until="networkidle")
            page.locator("button:has-text('Proceed to Checkout')").click()
            page.wait_for_url("**/checkout")
            page.wait_for_selector("text=Customer & Delivery Information")

            # Fill customer details
            page.fill("input[placeholder='e.g. Muhammad Ali']", "Admin Buyer Test")
            page.fill("input[placeholder='you@example.com']", "admin@store.com")
            page.fill("input[placeholder*='0300']", "03001234567")
            page.fill("textarea[placeholder*='House']", "House 45, Gulberg III")
            page.fill("input[placeholder*='Lahore']", "Lahore")
            print("PASS: Admin checkout form displays and accepts customer details.")

            # 3. Admin places order
            print("\n3. Admin places order...")
            page.locator("button:has-text('Place Order')").click()
            page.wait_for_selector("text=#501")
            assert db_state["orders"][0]["buyer_id"] == ADMIN_USER["id"]
            assert db_state["orders"][0]["guest_name"] == "Admin Buyer Test"
            print("PASS: Order #501 created and associated with admin user account (buyer_id=1).")

            # 4. Admin sees order in My Orders
            print("\n4. Checking Admin's My Orders...")
            page.goto("http://127.0.0.1:4175/my-orders", wait_until="networkidle")
            page.wait_for_selector("text=#501")
            page.wait_for_selector("text=Nike Shoes")
            print("PASS: Order #501 appears in Admin's My Orders.")

            # 5. Admin updates status rapidly: Processing -> Shipped -> Delivered and refreshes!
            print("\n5. Testing rapid status transitions (Processing -> Shipped -> Delivered) + Reload...")
            page.goto("http://127.0.0.1:4175/admin", wait_until="networkidle")
            page.wait_for_selector("text=#501")

            page.locator("button:has-text('Move to Process')").click()
            page.wait_for_selector("span:text-is('processing')", timeout=500)
            # Click Ship Order immediately BEFORE the 400ms backend call finishes!
            page.locator("button:has-text('Ship Order')").click()
            page.wait_for_selector("span:text-is('shipped')", timeout=500)
            # Click Mark Delivered immediately BEFORE the previous backend call finishes!
            page.locator("button:has-text('Mark Delivered')").click()
            page.wait_for_selector("span:text-is('delivered')", timeout=500)

            # Wait for all queued PATCH requests to finish
            time.sleep(1.8)
            assert db_state["orders"][0]["status"] == "delivered", f"DB status must be 'delivered', got {db_state['orders'][0]['status']}"
            assert page.locator("span:text-is('delivered')").is_visible(), "UI status must stay 'delivered'!"

            # Refresh the page and verify status does NOT revert
            page.reload(wait_until="networkidle")
            page.wait_for_selector("span:text-is('delivered')")
            print("PASS: Rapid status updates serialized cleanly, persisted as 'delivered', and did not revert after reload!")

            browser.close()
            print("\n==================================================")
            print("ALL ADMIN CHECKOUT & ORDER STATUS TESTS PASSED!")
            print("==================================================")
    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    main()
