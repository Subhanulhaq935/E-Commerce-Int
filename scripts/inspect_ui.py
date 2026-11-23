import os
import time
import subprocess
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.join(os.getcwd(), "playwright_screenshots", "before")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def run():
    print("Starting Vite preview server...")
    # Start vite preview on port 4173
    server_process = subprocess.Popen(
        ["npm.cmd", "run", "preview", "--", "--port", "4173", "--host", "127.0.0.1"],
        cwd=os.path.join(os.getcwd(), "frontend"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    
    # Wait a few seconds for server to boot
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
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            
            for vp_name, vp_size in viewports.items():
                print(f"\n--- Testing Viewport: {vp_name} ({vp_size['width']}x{vp_size['height']}) ---")
                context = browser.new_context(viewport=vp_size)
                page = context.new_page()
                
                for page_name, route in pages_to_visit:
                    url = f"{base_url}{route}"
                    try:
                        print(f"Visiting {url} [{vp_name}]...")
                        page.goto(url, wait_until="networkidle", timeout=12000)
                        page.wait_for_timeout(1000)
                        
                        shot_path = os.path.join(SCREENSHOTS_DIR, f"{page_name}_{vp_name}.png")
                        page.screenshot(path=shot_path, full_page=True)
                        print(f"  -> Saved: {shot_path}")
                    except Exception as e:
                        print(f"  -> Error on {page_name} [{vp_name}]: {e}")
                        try:
                            # fallback screenshot
                            shot_path = os.path.join(SCREENSHOTS_DIR, f"{page_name}_{vp_name}_fallback.png")
                            page.screenshot(path=shot_path)
                            print(f"  -> Saved fallback: {shot_path}")
                        except Exception:
                            pass
                
                context.close()
            browser.close()
            print("\nPlaywright inspection completed successfully!")
    finally:
        server_process.terminate()
        try:
            server_process.wait(timeout=3)
        except Exception:
            server_process.kill()

if __name__ == "__main__":
    run()
