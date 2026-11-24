import os
import sys
import time
import subprocess
import json
import re
from playwright.sync_api import sync_playwright

SAMPLE_PRODUCTS = [
  {
    "id": 3,
    "category_id": 3,
    "name": "Nike Shoes",
    "description": "Running sports shoes",
    "price": "8000.00",
    "sale_price": None,
    "has_sizes": False,
    "stock": 3,  # Limited stock = 3
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
  },
  {
    "id": 6,
    "category_id": 7,
    "name": "Helmet",
    "description": "A very high built quality helmet",
    "price": "15000.00",
    "sale_price": None,
    "has_sizes": False,
    "stock": 0,  # Out of stock
    "is_active": True,
    "images": [],
    "sizes": [],
    "average_rating": None,
    "review_count": 0,
  },
  {
    "id": 9,
    "category_id": 8,
    "name": "Rolex",
    "description": "Very good luxury watch",
    "price": "10000.00",
    "sale_price": None,
    "has_sizes": True,
    "stock": 7,
    "is_active": True,
    "images": [
      {
        "id": 15,
        "image_url": "https://res.cloudinary.com/v5m0qvyc/image/upload/v1795420666/ecommerce/products/9/r0y7csop3lvomli0ietv.jpg",
        "is_primary": True,
      }
    ],
    "sizes": [
      {
        "id": 17,
        "product_id": 9,
        "size": "S",
        "stock": 2,  # Size S stock = 2
        "price": "5000.00",
        "sale_price": None,
        "is_available": True,
      },
      {
        "id": 18,
        "product_id": 9,
        "size": "M",
        "stock": 5,  # Size M stock = 5
        "price": "8000.00",
        "sale_price": None,
        "is_available": True,
      },
    ],
    "average_rating": 3.5,
    "review_count": 2,
  },
]

def main():
    print("Building latest frontend...")
    subprocess.run(["npm.cmd", "run", "build"], cwd=os.path.join(os.getcwd(), "frontend"), check=True)

    print("Starting Vite preview server on port 4174...")
    proc = subprocess.Popen(
        ["npm.cmd", "run", "preview", "--", "--port", "4174", "--host", "127.0.0.1"],
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

            def handle_routes(route):
                url = route.request.url
                method = route.request.method
                if "/reviews" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([]))
                elif "/products/3" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_PRODUCTS[0]))
                elif "/products/6" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_PRODUCTS[1]))
                elif "/products/9" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_PRODUCTS[2]))
                elif "/products" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_PRODUCTS))
                elif "/categories" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([{"id": 3, "name": "Shoes"}, {"id": 8, "name": "SmartWatches"}]))
                elif "/orders/guest" in url and method == "POST":
                    req_data = json.loads(route.request.post_data)
                    for item in req_data.get("items", []):
                        if item.get("quantity", 0) > 3:
                            route.fulfill(status=400, content_type="application/json", body=json.dumps({
                                "detail": f"Requested quantity exceeds available stock (3). Only 3 items are currently available in stock."
                            }))
                            return
                    route.fulfill(status=201, content_type="application/json", body=json.dumps({"id": 999, "tracking_token": "tok123"}))
                elif "/cart" in url and method == "GET":
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({"items": [], "total": 0}))
                else:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([]))

            context.route(re.compile(r".*(8000|onrender).*"), handle_routes)

            # ========================================================
            # TEST 1: PRODUCT DETAIL PAGE - REGULAR PRODUCT WITH STOCK = 3
            # ========================================================
            print("\n--------------------------------------------------")
            print("TEST 1: Product Detail Page - Stock = 3 Restrictions")
            print("--------------------------------------------------")
            page = context.new_page()
            page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
            page.on("pageerror", lambda err: print(f"PAGEERROR: {err}"))
            page.goto("http://127.0.0.1:4174/products/3", wait_until="networkidle")

            # Check quantity starts at 1
            qty_span = page.locator("span.tabular-nums", has_text="1").first
            assert qty_span.is_visible(), "Initial quantity should be 1"
            print("Initial quantity is 1.")

            # Plus button
            btn_plus = page.locator("button[aria-label='Increase quantity']")
            btn_minus = page.locator("button[aria-label='Decrease quantity']")

            # Click + to 2
            btn_plus.click()
            page.wait_for_selector("span.tabular-nums:text-is('2')")
            print("Quantity increased to 2.")

            # Click + to 3 (Max stock)
            btn_plus.click()
            page.wait_for_selector("span.tabular-nums:text-is('3')")
            print("Quantity increased to 3 (Max available stock).")

            # Verify + button is disabled when quantity == maxAvailableStock
            assert btn_plus.is_disabled(), "Plus button must be disabled when quantity == max stock (3)!"
            print("PASS: Plus button is correctly disabled at maximum stock 3.")

            # Click disabled plus button (force click) -> quantity must NOT increase past 3
            btn_plus.click(force=True)
            time.sleep(0.3)
            current_qty = page.locator("button[aria-label='Decrease quantity'] + span").inner_text()
            assert current_qty == "3", f"Quantity must remain 3, got {current_qty}!"
            print(f"PASS: Quantity remained strictly at {current_qty} (did not exceed stock 3).")

            # ========================================================
            # TEST 2: PRODUCT DETAIL PAGE - SIZE VARIANTS (Size S=2, Size M=5)
            # ========================================================
            print("\n--------------------------------------------------")
            print("TEST 2: Product Detail Page - Size Variants Stock Restrictions")
            print("--------------------------------------------------")
            page.goto("http://127.0.0.1:4174/products/9", wait_until="networkidle")

            # Click Size M (Stock = 5)
            btn_size_m = page.locator("button:has-text('M')").first
            btn_size_m.click()
            print("Selected Size M (Stock = 5).")

            # Increase quantity up to 4
            for _ in range(3):
                btn_plus.click()
            page.wait_for_selector("button[aria-label='Decrease quantity'] + span:text-is('4')")
            print("Quantity for Size M is now 4.")

            # Now click Size S (Stock = 2) -> Quantity MUST auto-cap/adjust to 2!
            btn_size_s = page.locator("button:has-text('S')").first
            btn_size_s.click()
            time.sleep(0.3)

            current_qty = page.locator("button[aria-label='Decrease quantity'] + span").inner_text()
            assert current_qty == "2", f"Switching to Size S with stock 2 must adjust quantity to 2, got {current_qty}!"
            print("PASS: Switching to Size S (stock 2) automatically adjusted quantity to 2!")

            # Verify + button is disabled for Size S at quantity 2
            assert btn_plus.is_disabled(), "Plus button must be disabled for Size S at max stock 2!"
            print("PASS: Plus button is disabled for Size S at max stock 2.")

            # ========================================================
            # TEST 3: PRODUCT DETAIL PAGE - OUT OF STOCK PRODUCT
            # ========================================================
            print("\n--------------------------------------------------")
            print("TEST 3: Product Detail Page - Out of Stock (Stock = 0)")
            print("--------------------------------------------------")
            page.goto("http://127.0.0.1:4174/products/6", wait_until="networkidle")

            # Verify Out of Stock banner / disabled CTA
            out_of_stock_btn = page.locator("button:has-text('Out of Stock')")
            assert out_of_stock_btn.is_visible() and out_of_stock_btn.is_disabled()
            print("PASS: Out of Stock item shows disabled CTA and cannot be added to cart.")

            # ========================================================
            # TEST 4: SHOPPING CART - INCREMENT RESTRICTION AT MAX STOCK
            # ========================================================
            print("\n--------------------------------------------------")
            print("TEST 4: Shopping Cart - Increment Restriction at Max Stock")
            print("--------------------------------------------------")
            # Setup guest cart in localStorage with Nike Shoes quantity = 3 (Max stock = 3)
            cart_data = {
                "items": [
                    {
                        "id": 1001,
                        "product_id": 3,
                        "product_name": "Nike Shoes",
                        "unit_price": 8000.0,
                        "quantity": 3,
                        "available_stock": 3,
                        "stock": 3,
                        "subtotal": 24000.0,
                    }
                ],
                "total": 24000.0
            }
            page.evaluate(f"localStorage.setItem('guest_cart', '{json.dumps(cart_data)}')")
            page.goto("http://127.0.0.1:4174/cart", wait_until="networkidle")

            cart_plus_btn = page.locator("button[title*='Only 3 items are currently available in stock.']")
            assert cart_plus_btn.is_visible() and cart_plus_btn.is_disabled(), "Cart plus button must be disabled at max stock 3!"
            print("PASS: Shopping cart '+' button is disabled when quantity reaches stock 3.")

            # Try clicking disabled button -> verify error message
            cart_plus_btn.click(force=True)
            time.sleep(0.3)
            cart_qty = page.locator("span.tabular-nums:text-is('3')").first
            assert cart_qty.is_visible(), "Cart quantity must strictly stay 3!"
            print("PASS: Cart quantity strictly stayed at 3 and did not exceed available stock.")

            # ========================================================
            # TEST 5: CHECKOUT - STOCK OVERFLOW PREVENTION
            # ========================================================
            print("\n--------------------------------------------------")
            print("TEST 5: Checkout - Stock Overflow Prevention")
            print("--------------------------------------------------")
            # If cart has quantity 5 (exceeding stock 3)
            overflow_cart = {
                "items": [
                    {
                        "id": 1001,
                        "product_id": 3,
                        "product_name": "Nike Shoes",
                        "unit_price": 8000.0,
                        "quantity": 5,
                        "available_stock": 3,
                        "stock": 3,
                        "subtotal": 40000.0,
                    }
                ],
                "total": 40000.0
            }
            page.evaluate(f"localStorage.setItem('guest_cart', '{json.dumps(overflow_cart)}')")
            page.goto("http://127.0.0.1:4174/cart", wait_until="networkidle")

            # Verify alert and disabled checkout button
            warning_elem = page.locator("text=Only 3 items available.")
            assert warning_elem.is_visible(), "Cart should display warning that item exceeds stock"
            print("PASS: Cart displays stock warning when item quantity exceeds available stock.")

            checkout_btn = page.locator("button:has-text('Proceed to Checkout')")
            assert checkout_btn.is_disabled(), "Proceed to Checkout must be disabled when stock is exceeded!"
            print("PASS: Proceed to Checkout is disabled when stock is exceeded.")

            page.close()
            browser.close()
            print("\n==================================================")
            print("ALL STOCK VALIDATION PLAYWRIGHT TESTS PASSED 100%!")
            print("==================================================")

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    main()
