from fastapi import APIRouter
from app.database import transactions_col, vendors_col

router = APIRouter()


@router.get("/ranking")
def vendor_ranking():
    """
    Ranks vendors by revenue, order count, and a simple fulfillment proxy
    (share of orders that were NOT refunded). Real fulfillment tracking
    (shipping status, delivery time) isn't in the current schema - refund
    rate is used as an honest, available stand-in for "reliability."
    """
    pipeline = [
        {
            "$group": {
                "_id": "$vendorId",
                "totalOrders": {"$sum": 1},
                "completedOrders": {
                    "$sum": {"$cond": [{"$eq": ["$status", "Completed"]}, 1, 0]}
                },
                "revenue": {
                    "$sum": {
                        "$cond": [{"$eq": ["$status", "Completed"]}, "$totalAmount", 0]
                    }
                },
            }
        },
        {"$sort": {"revenue": -1}},
    ]
    rows = list(transactions_col.aggregate(pipeline))

    ranked = []
    for i, row in enumerate(rows):
        vendor = vendors_col.find_one({"_id": row["_id"]})
        if not vendor:
            continue
        fulfillment_rate = (
            round((row["completedOrders"] / row["totalOrders"]) * 100, 1)
            if row["totalOrders"] > 0
            else 0
        )
        ranked.append(
            {
                "rank": i + 1,
                "vendorId": str(row["_id"]),
                "businessName": vendor.get("businessName"),
                "status": vendor.get("status"),
                "revenue": round(row["revenue"], 2),
                "totalOrders": row["totalOrders"],
                "fulfillmentRate": fulfillment_rate,
            }
        )
    return ranked
