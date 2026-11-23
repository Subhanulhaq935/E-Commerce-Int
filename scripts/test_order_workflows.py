import os
import sys
import time
import subprocess
import json
from playwright.sync_api import sync_playwright

SAMPLE_ADMIN_USER = {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "is_active": True
}

SAMPLE_BUYER_USER = {
    "id": 2,
    "name": "Subhan Buyer",
    "email": "buyer@example.com",
    "role": "buyer",
    "is_active": True
}

SAMPLE_ORDERS = [
    {
        "id": 101,
        "buyer_id": 2,
        "shipping_address_id": 1,
        "total_amount": 3500.0,
        "status": "pending",
        "created_at": "2026-11-23T10:00:00Z",
        "buyer": SAMPLE_BUYER_USER,
        "shipping_address": {
            "id": 1,
            "full_name": "Subhan Buyer",
            "phone": "03001234567",
            "address_line": "Street 1, House 2",
            "city": "Lahore",
            "postal_code": "54000",
            "country": "Pakistan",
            "is_default": True
        },
        "payment": {
            "id": 1,
            "payment_method": "cod",
            "status": "pending",
            "amount": 3500.0
        },
        "items": [
            {
                "id": 1,
                "order_id": 101,
                "product_id": 1,
                "product_name": "Casual Polo Shirt",
                "quantity": 1,
                "unit_price": 3500.0,
                "subtotal": 3500.0,
                "size": "M"
            }
        ]
    }
]

SAMPLE_CART = {
    "id": 1,
    "user_id": 2,
    "items": [
        {
            "id": 1,
            "product_id": 1,
            "product_name": "Casual Polo Shirt",
            "quantity": 1,
            "unit_price": 3500.0,
            "size": "M",
            "product": {
                "id": 1,
                "name": "Casual Polo Shirt",
                "price": 3500.0,
                "stock": 10
            }
        }
    ]
}

SAMPLE_ADDRESSES = [
    {
        "id": 1,
        "full_name": "Subhan Buyer",
        "phone": "03001234567",
        "address_line": "Street 1, House 2",
        "city": "Lahore",
        "postal_code": "54000",
        "country": "Pakistan",
        "is_default": True
    }
]

def main():
    print("Starting Vite preview server on port 4173...")
    proc = subprocess.Popen(
        ["npm.cmd", "run", "preview", "--", "--port", "4173", "--host", "127.0.0.1"],
        cwd=os.path.join(os.getcwd(), "frontend"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    time.sleep(3)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 900})

            # ========================================================
            # WORKFLOW 1: TEST INSTANT ADMIN ORDER STATUS UPDATES
            # ========================================================
            print("\n--------------------------------------------------")
            print("WORKFLOW 1: Testing Instant Admin Order Status Updates...")
            print("--------------------------------------------------")

            # Setup admin localStorage auth
            page_admin = context.new_page()
            page_admin.add_init_script(f"""
                localStorage.setItem('token', 'fake-admin-token');
                localStorage.setItem('user', '{json.dumps(SAMPLE_ADMIN_USER)}');
            """)

            # Route mocks for admin
            def handle_admin_routes(route):
                url = route.request.url
                method = route.request.method
                if "/auth/me" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_ADMIN_USER))
                elif "/admin/orders" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_ORDERS))
                elif "/admin/products" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([]))
                elif "/categories/" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([]))
                elif "/admin/users" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([SAMPLE_ADMIN_USER, SAMPLE_BUYER_USER]))
                elif "/status" in url and method == "PATCH":
                    # Simulate slight 600ms backend latency
                    time.sleep(0.6)
                    data = json.loads(route.request.post_data)
                    updated = dict(SAMPLE_ORDERS[0], status=data["status"])
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(updated))
                else:
                    route.continue_()

            page_admin.route("**/auth/me", handle_admin_routes)
            page_admin.route("**/admin/**", handle_admin_routes)
            page_admin.route("**/categories/**", handle_admin_routes)

            page_admin.goto("http://127.0.0.1:4173/admin", wait_until="networkidle")
            print(f"Loaded page URL: {page_admin.url}")
            if "/admin" not in page_admin.url:
                print(f"Redirected! Current content: {page_admin.title()}")

            # Verify initial status is pending
            status_cell = page_admin.locator("td:has-text('pending')")
            assert status_cell.is_visible(), "Order #101 should start as 'pending'"
            print("Admin Dashboard loaded: Order #101 is 'pending'.")

            # 1. Click 'Move to Process'
            btn_process = page_admin.locator("button:has-text('Move to Process')")
            assert btn_process.is_visible()
            
            start_time = time.time()
            btn_process.click()

            # Verify status changes to 'processing' INSTANTLY (sub 100ms UI reaction)
            page_admin.wait_for_selector("span:text-is('processing')", timeout=200)
            elapsed = (time.time() - start_time) * 1000
            print(f"PASS: Status updated to 'processing' in {elapsed:.1f}ms (instant optimistic UI)!")

            # 2. Click 'Ship Order'
            btn_ship = page_admin.locator("button:has-text('Ship Order')")
            page_admin.wait_for_selector("button:has-text('Ship Order')", timeout=1000)
            start_time = time.time()
            btn_ship.click()

            page_admin.wait_for_selector("span:text-is('shipped')", timeout=200)
            elapsed = (time.time() - start_time) * 1000
            print(f"PASS: Status updated to 'shipped' in {elapsed:.1f}ms (instant optimistic UI)!")

            # 3. Click 'Mark Delivered'
            btn_deliver = page_admin.locator("button:has-text('Mark Delivered')")
            page_admin.wait_for_selector("button:has-text('Mark Delivered')", timeout=1000)
            start_time = time.time()
            btn_deliver.click()

            page_admin.wait_for_selector("span:text-is('delivered')", timeout=200)
            elapsed = (time.time() - start_time) * 1000
            print(f"PASS: Status updated to 'delivered' in {elapsed:.1f}ms (instant optimistic UI)!")

            print("WORKFLOW 1 PASSED: All order status transitions feel 100% instant!")
            page_admin.close()

            # ========================================================
            # WORKFLOW 2: TEST AUTHENTICATED CHECKOUT CONFIRMATION
            # ========================================================
            print("\n--------------------------------------------------")
            print("WORKFLOW 2: Testing Authenticated Checkout Confirmation...")
            print("--------------------------------------------------")

            page_buyer = context.new_page()
            page_buyer.add_init_script(f"""
                localStorage.setItem('token', 'fake-buyer-token');
                localStorage.setItem('user', '{json.dumps(SAMPLE_BUYER_USER)}');
            """)

            my_orders_fetched = False

            def handle_buyer_routes(route):
                nonlocal my_orders_fetched
                url = route.request.url
                method = route.request.method

                if "/auth/me" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_BUYER_USER))
                elif "/cart" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_CART))
                elif "/addresses/" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_ADDRESSES))
                elif "/orders/my-orders" in url:
                    my_orders_fetched = True
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_ORDERS))
                elif "/orders/" in url and method == "POST":
                    created_order = {
                        "id": 999,
                        "buyer_id": 2,
                        "shipping_address_id": 1,
                        "total_amount": 3500.0,
                        "status": "pending",
                        "created_at": "2026-11-23T18:45:00Z",
                        "tracking_token": None # Authenticated order
                    }
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(created_order))
                else:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({}))

            page_buyer.route("**/auth/me", handle_buyer_routes)
            page_buyer.route("**/cart**", handle_buyer_routes)
            page_buyer.route("**/addresses/**", handle_buyer_routes)
            page_buyer.route("**/orders/**", handle_buyer_routes)

            page_buyer.goto("http://127.0.0.1:4173/checkout", wait_until="networkidle")

            # Place order button
            btn_place_order = page_buyer.locator("button:has-text('Place Order')")
            assert btn_place_order.is_visible()
            print("Checkout loaded with saved address. Placing order...")
            btn_place_order.click()

            # Verify order confirmation appears
            page_buyer.wait_for_selector("h2:has-text('Thank You for Your Order!')", timeout=3000)
            assert page_buyer.locator("text=#999").is_visible(), "Order #999 should be displayed"
            assert page_buyer.locator("a:has-text('View in My Orders')").is_visible(), "'View in My Orders' button should be displayed"
            assert page_buyer.locator("a:has-text('Continue Shopping')").is_visible(), "'Continue Shopping' button should be displayed"
            print("PASS: Order Confirmed screen displayed successfully with Order #999!")

            # Wait 4.0 seconds (well past the old 3.0s automatic redirect)
            print("Waiting 4.0 seconds to verify no automatic redirect occurs...")
            time.sleep(4.0)

            # Assert current URL is STILL /checkout
            current_url = page_buyer.url
            print(f"Current page URL: {current_url}")
            assert "/checkout" in current_url, f"Expected to remain on /checkout, but URL was: {current_url}"
            assert not my_orders_fetched, "FAIL: /orders/my-orders should NOT be fetched automatically!"
            print("PASS: No automatic navigation occurred! User stayed on confirmation screen.")

            # Explicitly click "View in My Orders"
            btn_view_orders = page_buyer.locator("a:has-text('View in My Orders')")
            print("Clicking 'View in My Orders' explicitly...")
            btn_view_orders.click()

            page_buyer.wait_for_url("**/my-orders", timeout=4000)
            assert "/my-orders" in page_buyer.url, "User should now be on /my-orders"
            assert my_orders_fetched, "Orders should only be fetched after explicit click!"
            print("PASS: Navigated to My Orders and fetched history only upon explicit customer action!")

            print("\n========================================================")
            print("ALL ORDER MANAGEMENT & CHECKOUT WORKFLOW TESTS PASSED 100%!")
            print("========================================================")
            browser.close()

    finally:
        subprocess.call(["taskkill", "/F", "/T", "/PID", str(proc.pid)], shell=True)

if __name__ == "__main__":
    main()
