# ShopSense Analytics Service (Milestone 3)

A Python/FastAPI service for advanced analytics and ML-based forecasting. It reads from the **same MongoDB** your Node/Express backend already writes to — this is a second service for Python-specific analysis (pandas, scikit-learn, MLflow), not a separate data store. Nothing here duplicates or replaces the Node backend; both read/write the same `shopsense` database.

## Why a second service instead of building this in Node?

Milestone 3 calls for MLflow model tracking and data-science-style analysis (pandas, scikit-learn) — Python's ecosystem for this is far more mature than Node's, so it made sense to add a focused Python service for just this piece rather than force ML tooling into Express.

## Setup

```bash
cd analytics-service
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
cp .env.example .env            # point MONGO_URI at the same database your Node backend uses
```

## Running the API

```bash
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for interactive API docs (FastAPI generates this automatically).

## Endpoints

| Route | Purpose |
|---|---|
| `GET /analytics/revenue` | GMV, average order value, and marketplace margin per vendor |
| `GET /analytics/growth` | Period-over-period revenue growth trend |
| `GET /vendors/ranking` | Vendors ranked by revenue, orders, and fulfillment rate |
| `GET /products/category-performance` | Revenue and units sold by product category |
| `GET /ml-forecast/{product_id}` | Latest MLflow-trained forecast for a product |

## Training the ML forecasting model

The API serves predictions from the *last trained* model — it doesn't retrain on every request. To train (or retrain after more data comes in):

```bash
python -m app.ml.train_forecast
```

This fits a simple linear regression per product on daily sales history and logs each run (parameters, MAE, the model itself) to MLflow. Inspect the results:

```bash
mlflow ui
```
Open `http://localhost:5000` to browse trained runs, compare accuracy, and see version history — this is the "model registry" requirement from the milestone brief.

**Note:** products need at least 3 days of transaction history to train a model. On a freshly seeded database with real purchases, this may take a few buys before predictions are available.

## BI Dashboard

An interactive dashboard (Milestone 3, Step 5) built with Streamlit, reading live from the FastAPI service above:

```bash
# with the API already running on port 8000, in a separate terminal:
streamlit run bi_dashboard/dashboard.py
```

Shows revenue and margin by vendor, vendor benchmarking, category performance, growth trend, and ML forecast lookup — with CSV export on the revenue and ranking tables.

## Honest scope notes

- **Profit margin** uses each vendor's existing `commissionRate` field as the marketplace's take — there's no separate product cost field in the schema, so this is the real, available proxy rather than an invented number.
- **Growth trend** compares the first half vs second half of a 14-day window — a period-over-period comparison, not a seasonally-adjusted trend model. With more historical data later, this could become a proper time-series model.
- **Vendor fulfillment rate** uses the share of orders that weren't refunded, since there's no shipping/delivery-status tracking yet — an honest stand-in, not real fulfillment data.
- **The ML forecast** is a genuine trained linear regression (not a heuristic like Milestone 2's moving average), but it's intentionally simple — a stronger model would use more features (day of week, category trends, promotions) than just a day index.
