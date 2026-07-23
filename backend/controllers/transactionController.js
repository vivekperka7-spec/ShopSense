import Transaction from "../models/transaction.js";
import Product from "../models/product.js";
import Inventory from "../models/inventory.js";

export const createTransaction = async (req, res) => {
  try {
    const { productId, quantity, unitPrice } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.stock < quantity) {
      return res.status(400).json({ error: `Only ${product.stock} in stock` });
    }

    const totalAmount = quantity * unitPrice;
    const txn = await Transaction.create({ ...req.body, totalAmount });

    // decrement stock on purchase, and keep the separate Inventory collection in sync
    product.stock -= quantity;
    await product.save();
    await Inventory.findOneAndUpdate(
      { productId: product._id },
      { stockAvailable: product.stock, lastUpdated: new Date() },
      { upsert: true }
    );

    res.status(201).json(txn);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const listTransactions = async (req, res) => {
  const filter = req.query.customerId ? { customerId: req.query.customerId } : {};
  const txns = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .populate("productId", "name imageUrl")
    .populate("vendorId", "businessName");
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
