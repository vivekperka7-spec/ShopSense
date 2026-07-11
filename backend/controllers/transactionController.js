import Transaction from "../models/transaction.js";

export const createTransaction = async (req, res) => {
  try {
    const { quantity, unitPrice } = req.body;
    const totalAmount = quantity * unitPrice;
    const txn = await Transaction.create({ ...req.body, totalAmount });
    res.status(201).json(txn);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const listTransactions = async (req, res) => {
  const txns = await Transaction.find().sort({ createdAt: -1 });
  res.json(txns);
};

// Revenue grouped by day - powers the "Revenue Overview" line chart
export const revenueOverTime = async (req, res) => {
  const data = await Transaction.aggregate([
    { $match: { status: "Completed" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalRevenue: { $sum: "$totalAmount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(data.map((d) => ({ date: d._id, revenue: d.totalRevenue })));
};

// Quantity sold per product - powers the "Product Performance" table
export const productPerformance = async (req, res) => {
  const data = await Transaction.aggregate([
    { $match: { status: "Completed" } },
    {
      $group: {
        _id: "$productId",
        quantitySold: { $sum: "$quantity" },
        revenue: { $sum: "$totalAmount" }
      }
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        name: "$product.name",
        quantitySold: 1,
        revenue: 1
      }
    },
    { $sort: { quantitySold: -1 } }
  ]);
  res.json(data);
};

// Combined baseline analytics payload - single call for the dashboard
export const baselineAnalytics = async (req, res) => {
  const [revenueSeries, products] = await Promise.all([
    Transaction.aggregate([
      { $match: { status: "Completed" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Transaction.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: "$productId", quantitySold: { $sum: "$quantity" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      { $project: { _id: 0, name: "$product.name", imageUrl: "$product.imageUrl", quantitySold: 1 } },
      { $sort: { quantitySold: -1 } }
    ])
  ]);

  const totalRevenue = revenueSeries.reduce((sum, r) => sum + r.totalRevenue, 0);

  res.json({
    totalRevenue,
    revenueSeries: revenueSeries.map((r) => ({ date: r._id, revenue: r.totalRevenue })),
    productPerformance: products
  });
};
