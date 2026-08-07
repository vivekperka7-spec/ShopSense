from fastapi import APIRouter
from app.database import transactions_col, products_col

router = APIRouter()


@router.get("/category-performance")
def category_performance():
    """
    Revenue and units sold rolled up by product category - a level of
    analysis your Node backend doesn't currently expose (it reports at the
    individual-product and vendor level, not category level).
    """
    pipeline = [
        {"$match": {"status": "Completed"}},
        {
            "$group": {
                "_id": "$productId",
                "unitsSold": {"$sum": "$quantity"},
                "revenue": {"$sum": "$totalAmount"},
            }
        },
    ]
    rows = list(transactions_col.aggregate(pipeline))

    category_totals = {}
    for row in rows:
        product = products_col.find_one({"_id": row["_id"]})
        if not product:
            continue
        category = product.get("category", "Uncategorized")
        if category not in category_totals:
            category_totals[category] = {"category": category, "unitsSold": 0, "revenue": 0}
        category_totals[category]["unitsSold"] += row["unitsSold"]
        category_totals[category]["revenue"] += row["revenue"]

    results = list(category_totals.values())
    results.sort(key=lambda r: r["revenue"], reverse=True)
    for r in results:
        r["revenue"] = round(r["revenue"], 2)
    return results
