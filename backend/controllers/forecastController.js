import Transaction from "../models/transaction.js";
import InventoryForecast from "../models/inventoryForecast.js";
import Product from "../models/product.js";

// Forecast next-period stock needs using a simple moving average of recent
// completed sales. This is a heuristic, not a statistical model - a
// reasonable Milestone 2 starting point, not demand forecasting with
// seasonality/trend detection. (Fixes two issues vs. the reference: the
// date field is `createdAt` not `date`, and this filters to Completed
// orders only.)
export const forecastInventory = async (req, res) => {
  try {
    const { productId, days = 7 } = req.query;
    if (!productId) return res.status(400).json({ error: "productId is required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const transactions = await Transaction.find({
      productId,
      status: "Completed",
      createdAt: { $gte: since }
    });

    const totalSold = transactions.reduce((sum, t) => sum + t.quantity, 0);
    const avgDailySales = totalSold / Number(days);
    const predictedStock = Math.round(avgDailySales * 7);

    const confidenceLevel = Math.min(0.5 + transactions.length * 0.05, 0.95);

    const forecast = await InventoryForecast.create({
      productId,
      predictedStock,
      windowDays: Number(days),
      confidenceLevel
    });

    res.json({
      ...forecast.toObject(),
      productName: product.name,
      currentStock: product.stock,
      basedOnOrders: transactions.length,
      restockNeeded: predictedStock > product.stock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listForecasts = async (req, res) => {
  const forecasts = await InventoryForecast.find()
    .sort({ forecastDate: -1 })
    .limit(50)
    .populate("productId", "name stock");
  res.json(forecasts);
};
