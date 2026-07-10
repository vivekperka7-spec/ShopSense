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
