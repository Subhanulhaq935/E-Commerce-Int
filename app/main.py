from fastapi import FastAPI

app = FastAPI(title="Multi-Vendor E-Commerce API", version="1.0.0")

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}

