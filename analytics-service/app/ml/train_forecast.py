"""
Trains a simple linear regression forecasting model per product using
historical daily sales, and logs each run to MLflow's model registry.

This is the ML-based upgrade to the moving-average heuristic used in
Milestone 2's Node/Express forecast endpoint - a genuine trained model,
tracked with parameters/metrics/artifacts, versus a plain average.

Run standalone (not on every API request - training happens offline,
the API serves the latest logged model's predictions):

    python -m app.ml.train_forecast

Then inspect results with:

    mlflow ui
    (open http://localhost:5000 in a browser)
"""

import pandas as pd
import mlflow
import mlflow.sklearn
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error
from datetime import datetime, timedelta
from app.database import transactions_col, products_col

mlflow.set_experiment("shopsense-inventory-forecast")


def build_daily_sales_frame(product_id, days=30):
    since = datetime.utcnow() - timedelta(days=days)
    txns = list(
        transactions_col.find(
            {"productId": product_id, "status": "Completed", "createdAt": {"$gte": since}}
        )
    )
    if len(txns) < 3:
        return None  # not enough history to fit a meaningful model

    df = pd.DataFrame(txns)
    df["day"] = pd.to_datetime(df["createdAt"]).dt.date
    daily = df.groupby("day")["quantity"].sum().reset_index()
    daily["dayIndex"] = range(len(daily))
    return daily


def train_and_log(product_id, product_name):
    daily = build_daily_sales_frame(product_id)
    if daily is None or len(daily) < 3:
        print(f"  skip {product_name}: not enough transaction history yet")
        return

    X = daily[["dayIndex"]]
    y = daily["quantity"]

    model = LinearRegression()
    model.fit(X, y)

    predictions = model.predict(X)
    mae = mean_absolute_error(y, predictions)

    next_day_index = [[daily["dayIndex"].max() + 1]]
    next_day_forecast = max(0, round(model.predict(next_day_index)[0], 1))

    with mlflow.start_run(run_name=str(product_name)):
        mlflow.log_param("model_type", "LinearRegression")
        mlflow.log_param("product_id", str(product_id))
        mlflow.log_param("product_name", product_name)
        mlflow.log_param("training_days", len(daily))
        mlflow.log_metric("mean_absolute_error", mae)
        mlflow.log_metric("next_day_forecast", next_day_forecast)
        mlflow.sklearn.log_model(model, "forecast_model")

    print(f"  logged {product_name}: next-day forecast={next_day_forecast}, MAE={mae:.2f}")


def run_all():
    products = list(products_col.find({}))
    print(f"Training forecast models for {len(products)} products...")
    for p in products:
        train_and_log(p["_id"], p.get("name", "Unknown product"))
    print("Done. Run `mlflow ui` to inspect the model registry.")


if __name__ == "__main__":
    run_all()
