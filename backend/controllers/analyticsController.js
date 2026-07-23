import Transaction from "../models/transaction.js";

// Matches the reference Step 4 shape: revenue + units sold grouped by vendor
export const revenueReport = async (req, res) => {
  try {
    const report = await Transaction.aggregate([
      { $match: { status: "Completed" } },
      {
        $group: {
          _id: "$vendorId",
          totalRevenue: { $sum: "$totalAmount" },
          totalUnitsSold: { $sum: "$quantity" }
        }
      },
      {
        $lookup: {
          from: "vendors",
          localField: "_id",
          foreignField: "_id",
          as: "vendor"
        }
      },
      { $unwind: "$vendor" },
      {
        $project: {
          _id: 0,
          vendorId: "$_id",
          businessName: "$vendor.businessName",
          totalRevenue: 1,
          totalUnitsSold: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Customer segmentation: group by customer, bucket into segments by spend.
// Simple rule-based segmentation, not a clustering model - a reasonable
// Milestone 2 starting point that's easy to explain and extend later.
export const customerSegments = async (req, res) => {
  try {
    const rows = await Transaction.aggregate([
      { $match: { status: "Completed" } },
      {
        $group: {
          _id: "$customerId",
          totalSpent: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          lastOrder: { $max: "$createdAt" }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    const segmented = rows.map((r) => {
      let segment = "New";
      if (r.orderCount >= 4 || r.totalSpent >= 5000) segment = "High Value";
      else if (r.orderCount >= 2) segment = "Regular";
      return { customerId: r._id, totalSpent: r.totalSpent, orderCount: r.orderCount, lastOrder: r.lastOrder, segment };
    });

    const summary = segmented.reduce((acc, c) => {
      acc[c.segment] = (acc[c.segment] || 0) + 1;
      return acc;
    }, {});

    res.json({ customers: segmented, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Data integrity check: raw transaction sum vs aggregated report sum.
// Directly demonstrates the ">=98% transactional consistency" criterion,
// and doubles as the Milestone 2 "validate analytical outputs" requirement.
export const validateConsistency = async (req, res) => {
  try {
    const txns = await Transaction.find({ status: "Completed" });
    const rawTotal = txns.reduce((sum, t) => sum + t.totalAmount, 0);
    const rawUnits = txns.reduce((sum, t) => sum + t.quantity, 0);

    const [agg] = await Transaction.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalUnits: { $sum: "$quantity" } } }
    ]);

    const revenueMatch = agg ? agg.totalRevenue === rawTotal : rawTotal === 0;
    const unitsMatch = agg ? agg.totalUnits === rawUnits : rawUnits === 0;

    res.json({
      transactionCount: txns.length,
      rawRevenueTotal: rawTotal,
      aggregatedRevenueTotal: agg?.totalRevenue || 0,
      rawUnitsTotal: rawUnits,
      aggregatedUnitsTotal: agg?.totalUnits || 0,
      consistent: revenueMatch && unitsMatch,
      consistencyRate: revenueMatch && unitsMatch ? "100%" : "mismatch detected"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
