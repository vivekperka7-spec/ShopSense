from fastapi import APIRouter, HTTPException
import mlflow
from mlflow.tracking import MlflowClient

router = APIRouter()

EXPERIMENT_NAME = "shopsense-inventory-forecast"


@router.get("/{product_id}")
def get_ml_forecast(product_id: str):
    """
    Returns the most recent MLflow-logged forecast for a product.
    Run `python -m app.ml.train_forecast` first to populate the registry -
    this endpoint reads the latest logged run, it doesn't train on request.
    """
    client = MlflowClient()
    experiment = client.get_experiment_by_name(EXPERIMENT_NAME)
    if not experiment:
        raise HTTPException(
            status_code=404,
            detail="No trained models yet - run `python -m app.ml.train_forecast` first",
        )

    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        filter_string=f"params.product_id = '{product_id}'",
        order_by=["start_time DESC"],
        max_results=1,
    )
    if not runs:
        raise HTTPException(
            status_code=404,
            detail="No trained model found for this product yet",
        )

    run = runs[0]
    return {
        "productId": product_id,
        "productName": run.data.params.get("product_name"),
        "modelType": run.data.params.get("model_type"),
        "trainingDays": run.data.params.get("training_days"),
        "nextDayForecast": run.data.metrics.get("next_day_forecast"),
        "meanAbsoluteError": run.data.metrics.get("mean_absolute_error"),
        "trainedAt": run.info.start_time,
        "mlflowRunId": run.info.run_id,
    }
