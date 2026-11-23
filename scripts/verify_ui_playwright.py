import os
import time
import subprocess
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.join(os.getcwd(), "playwright_screenshots", "after")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

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
        ("home", "/"),
        ("product_detail", "/products/4"),
        ("cart", "/cart"),
        ("checkout", "/checkout"),
        ("login", "/login"),
        ("register", "/register"),
        ("track_order", "/track-order/sample-token"),
        ("my_orders", "/my-orders"),
        ("admin", "/admin"),
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
                page = context.new_page()
                
                # Listen to console errors
                page.on("console", lambda msg: console_errors.append(f"[{vp_name}] {msg.text}") if msg.type == "error" else None)
                
                for page_name, route in pages_to_visit:
                    url = f"{base_url}{route}"
                    try:
                        print(f"Visiting {url} [{vp_name}]...")
                        page.goto(url, wait_until="networkidle", timeout=12000)
                        page.wait_for_timeout(1000)
                        
                        # Extra interactions
                        if page_name == "home":
                            # Test category filter click if buttons exist
                            cat_btns = page.locator("button:has-text('All Items')")
                            if cat_btns.count() > 0:
                                cat_btns.first.click()
                        
                        if page_name == "product_detail":
                            # Test clicking Medium size button if present
                            m_btn = page.locator("button:has-text('M')")
                            if m_btn.count() > 0:
                                m_btn.first.click()
                                page.wait_for_timeout(500)
                        
                        shot_path = os.path.join(SCREENSHOTS_DIR, f"{page_name}_{vp_name}.png")
                        page.screenshot(path=shot_path, full_page=True)
                        print(f"  -> Captured: {shot_path}")
                    except Exception as e:
                        print(f"  -> Error on {page_name} [{vp_name}]: {e}")
                        try:
                            shot_path = os.path.join(SCREENSHOTS_DIR, f"{page_name}_{vp_name}_fallback.png")
                            page.screenshot(path=shot_path)
                        except Exception:
                            pass
                
                # Special mobile drawer test on mobile viewport
                if vp_name == "mobile":
                    try:
                        print("Testing mobile hamburger drawer toggle...")
                        page.goto(base_url, wait_until="networkidle")
                        menu_btn = page.locator("button[aria-label='Toggle navigation menu']")
                        if menu_btn.count() > 0:
                            menu_btn.click()
                            page.wait_for_timeout(500)
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
