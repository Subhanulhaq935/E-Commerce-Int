import os
import sys
import time
import subprocess
import json
from playwright.sync_api import sync_playwright

SAMPLE_PRODUCTS = [
    {
        "id": i,
        "name": f"Premium Lifestyle Product {i}",
        "description": f"Detailed description for product {i} with high quality materials.",
        "price": 2500 + i * 500,
        "sale_price": 2200 + i * 450 if i % 2 == 0 else None,
        "stock": 10 + i,
        "category_id": 1,
        "has_sizes": True,
        "is_active": True,
        "average_rating": 4.8,
        "review_count": 12,
        "images": [{"id": i, "image_url": "https://via.placeholder.com/600", "is_primary": True}],
        "sizes": [
            {"id": i*3+1, "size": "S", "stock": 5, "price": 2500, "sale_price": None, "is_available": True},
            {"id": i*3+2, "size": "M", "stock": 5, "price": 2700, "sale_price": None, "is_available": True},
            {"id": i*3+3, "size": "L", "stock": 5, "price": 2900, "sale_price": None, "is_available": True},
        ]
    }
    for i in range(1, 13)
]

SAMPLE_CATEGORIES = [
    {"id": 1, "name": "Apparel", "description": "Clothing"}
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
            page = context.new_page()

            # Mock backend API responses for products and categories
            def handle_api(route):
                url = route.request.url
                if "/products/?limit=100" in url or url.endswith("/products/"):
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_PRODUCTS))
                elif "/products/" in url and not url.endswith("/reviews"):
                    # Individual product
                    prod_id = int(url.split("/products/")[1].split("?")[0].split("/")[0])
                    prod = next((p for p in SAMPLE_PRODUCTS if p["id"] == prod_id), SAMPLE_PRODUCTS[0])
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(prod))
                elif "/categories/" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(SAMPLE_CATEGORIES))
                elif "/reviews" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([]))
                else:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({}))

            page.route("**/products/**", handle_api)
            page.route("**/categories/**", handle_api)

            print("Navigating to http://127.0.0.1:4173 ...")
            page.goto("http://127.0.0.1:4173", wait_until="networkidle")

            page.wait_for_selector('a[href^="/products/"]', timeout=8000)
            product_links = page.locator('a[href^="/products/"]').all()
            print(f"Found {len(product_links)} product links on home page.")

            # 1. Scroll down on home page
            page.evaluate("window.scrollTo(0, 1200)")
            time.sleep(0.5)
            initial_scroll = page.evaluate("window.scrollY")
            print(f"1. Home page scrolled down to: {initial_scroll}px (expected > 0)")
            assert initial_scroll > 300, f"Expected scroll > 300, got {initial_scroll}"

            # 2. Click on a product link
            target_link = product_links[6] # Product 4
            target_href = target_link.get_attribute("href")
            print(f"2. Clicking product link: {target_href} ...")
            target_link.click()

            page.wait_for_url(f"**{target_href}", timeout=5000)
            time.sleep(0.5)

            # 3. Check scroll position on product detail page
            detail_scroll = page.evaluate("window.scrollY")
            print(f"3. Product detail page scroll position: {detail_scroll}px")
            assert detail_scroll == 0, f"ERROR: Expected scroll position 0, but got {detail_scroll}px!"

            # 4. Verify all top elements are in viewport
            breadcrumb = page.locator("nav").last
            assert breadcrumb.is_visible(), "Breadcrumb should be visible at top of page!"

            h1 = page.locator("h1")
            assert h1.is_visible(), "Product H1 title should be visible!"

            price = page.locator("text=Price").first
            assert price.is_visible(), "Price section should be visible at top!"

            print("4. Verification SUCCESS: Top elements are immediately visible at scroll position 0.")

            # 5. Simulate scrolling down on ProductDetail (e.g. to read reviews)
            page.evaluate("window.scrollTo(0, 800)")
            time.sleep(0.3)
            print(f"5. Scrolled down on ProductDetail to: {page.evaluate('window.scrollY')}px")

            # 6. Navigate to another product (e.g. /products/2)
            print("6. Navigating to another product (/products/2)...")
            page.evaluate("window.history.pushState({}, '', '/products/2')")
            page.goto("http://127.0.0.1:4173/products/2", wait_until="networkidle")
            time.sleep(0.5)
            second_scroll = page.evaluate("window.scrollY")
            print(f"7. Second product detail scroll position: {second_scroll}px")
            assert second_scroll == 0, f"ERROR: Expected scroll position 0, but got {second_scroll}px!"

            print("\n==========================================")
            print("ALL PRODUCT SCROLL POSITION TESTS PASSED 100%!")
            print("==========================================")
            browser.close()

    finally:
        subprocess.call(["taskkill", "/F", "/T", "/PID", str(proc.pid)], shell=True)

if __name__ == "__main__":
    main()
