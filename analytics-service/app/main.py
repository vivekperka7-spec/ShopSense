from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import vendor, product, analytics, ml_forecast

app = FastAPI(
    title="ShopSense Analytics API",
    description=(
        "Python/FastAPI service for Milestone 3 advanced analytics. "
        "Reads from the same MongoDB the Node/Express backend writes to - "
        "this is a second service for ML-driven analysis, not a separate "
        "data store."
    ),
    version="1.0.0",
)

# Allow the React frontend (localhost:5173) to call this service directly if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vendor.router, prefix="/vendors", tags=["Vendor benchmarking"])
app.include_router(product.router, prefix="/products", tags=["Product analytics"])
app.include_router(analytics.router, prefix="/analytics", tags=["Revenue & growth"])
app.include_router(ml_forecast.router, prefix="/ml-forecast", tags=["ML forecasting"])


@app.get("/")
def root():
    return {"message": "ShopSense Analytics API is running"}

# Run: uvicorn app.main:app --reload --port 8000
