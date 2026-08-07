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
    }).sort({ createdAt: 1 });

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

    // Build a day-by-day sales series over the window so the chart reflects
    // this specific product's actual pattern, not a generic comparison.
    const dailySales = {};
    for (let i = Number(days) - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailySales[key] = 0;
    }
    transactions.forEach((t) => {
      const key = t.createdAt.toISOString().slice(0, 10);
      if (dailySales[key] !== undefined) dailySales[key] += t.quantity;
    });
    const salesSeries = Object.entries(dailySales).map(([date, quantitySold]) => ({ date, quantitySold }));

    res.json({
      ...forecast.toObject(),
      productName: product.name,
      currentStock: product.stock,
      basedOnOrders: transactions.length,
      restockNeeded: predictedStock > product.stock,
      salesSeries,
      avgDailySales: Math.round(avgDailySales * 10) / 10
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
