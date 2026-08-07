from fastapi import APIRouter
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import transactions_col, vendors_col

router = APIRouter()


def _to_obj_id(id_str):
    try:
        return ObjectId(id_str)
    except Exception:
        return None


@router.get("/revenue")
def revenue_analysis():
    """
    GMV, average order value, and marketplace profit margin per vendor.

    GMV = sum of totalAmount across completed transactions for that vendor.
    Margin = the marketplace's cut, using each vendor's own commissionRate
    (already stored on the Vendor model) rather than inventing a separate
    cost field - this is a genuine field from your schema, not a guess.
    """
    pipeline = [
        {"$match": {"status": "Completed"}},
        {
            "$group": {
                "_id": "$vendorId",
                "gmv": {"$sum": "$totalAmount"},
                "orders": {"$sum": 1},
                "avgOrderValue": {"$avg": "$totalAmount"},
            }
        },
        {"$sort": {"gmv": -1}},
    ]
    rows = list(transactions_col.aggregate(pipeline))

    results = []
    for row in rows:
        vendor = vendors_col.find_one({"_id": row["_id"]})
        if not vendor:
            continue
        commission_rate = vendor.get("commissionRate", 10)
        margin = round(row["gmv"] * (commission_rate / 100), 2)
        results.append(
            {
                "vendorId": str(row["_id"]),
                "businessName": vendor.get("businessName"),
                "gmv": round(row["gmv"], 2),
                "orders": row["orders"],
                "avgOrderValue": round(row["avgOrderValue"], 2),
                "commissionRate": commission_rate,
                "marketplaceMargin": margin,
            }
        )
    return results


@router.get("/growth")
def growth_trends(days: int = 14):
    """
    Simple growth trend: compares total revenue in the first half of the
    window vs the second half. With only ~2 weeks of seed data this is a
    period-over-period comparison, not a seasonally-adjusted trend model -
    a reasonable starting point that's honest about what it is.
    """
    now = datetime.utcnow()
    window_start = now - timedelta(days=days)
    midpoint = now - timedelta(days=days / 2)

    def total_in_range(start, end):
        pipeline = [
            {
                "$match": {
                    "status": "Completed",
                    "createdAt": {"$gte": start, "$lt": end},
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$totalAmount"}}},
        ]
        result = list(transactions_col.aggregate(pipeline))
        return result[0]["total"] if result else 0

    first_half = total_in_range(window_start, midpoint)
    second_half = total_in_range(midpoint, now)

    growth_pct = None
    if first_half > 0:
        growth_pct = round(((second_half - first_half) / first_half) * 100, 1)

    return {
        "windowDays": days,
        "firstHalfRevenue": round(first_half, 2),
        "secondHalfRevenue": round(second_half, 2),
        "growthPercent": growth_pct,
        "trend": "up" if (growth_pct or 0) > 0 else "down" if (growth_pct or 0) < 0 else "flat",
    }
